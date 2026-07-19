-- Enable PostGIS extension for geo-coordinates
create extension if not exists postgis;

-- 1. PROFILES TABLE
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    phone_number varchar(20) unique,
    full_name varchar(100),
    bio text,
    avatar_url text,
    is_cin_verified boolean default false,
    rating numeric(3, 2) default 5.0 check (rating >= 1.0 and rating <= 5.0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

create policy "Allow public read access to profiles" 
on public.profiles for select 
using (true);

create policy "Allow users to update their own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- 2. ROUTE PRICE CAPS
create table public.route_price_caps (
    origin_city varchar(100) not null,
    destination_city varchar(100) not null,
    max_price_dirhams integer not null,
    primary key (origin_city, destination_city)
);

-- Enable RLS for Route Price Caps
alter table public.route_price_caps enable row level security;

create policy "Allow public read access to route price caps" 
on public.route_price_caps for select 
using (true);

-- Insert default price caps for Morocco
insert into public.route_price_caps (origin_city, destination_city, max_price_dirhams) values
('Casablanca', 'Marrakech', 90),
('Rabat', 'Casablanca', 40),
('Casablanca', 'Tangier', 130),
('Fes', 'Rabat', 80),
('Marrakech', 'Agadir', 70);

-- 3. RIDES
create table public.rides (
    id uuid default gen_random_uuid() primary key,
    driver_id uuid references public.profiles(id) on delete cascade not null,
    origin_city varchar(100) not null,
    destination_city varchar(100) not null,
    origin_coords geography(Point, 4326) not null,
    destination_coords geography(Point, 4326) not null,
    departure_time timestamp with time zone not null,
    available_seats integer not null check (available_seats >= 1 and available_seats <= 6),
    price_per_seat integer not null check (price_per_seat > 0),
    women_only boolean default false not null,
    status varchar(20) default 'active' check (status in ('active', 'completed', 'cancelled')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Rides
alter table public.rides enable row level security;

create policy "Allow public read access to active/completed rides" 
on public.rides for select 
using (true);

create policy "Allow authenticated users to create a ride" 
on public.rides for insert 
with check (auth.uid() = driver_id);

create policy "Allow drivers to update their own rides" 
on public.rides for update 
using (auth.uid() = driver_id);

-- 4. BOOKINGS
create table public.bookings (
    id uuid default gen_random_uuid() primary key,
    ride_id uuid references public.rides(id) on delete cascade not null,
    passenger_id uuid references public.profiles(id) on delete cascade not null,
    seats_booked integer not null check (seats_booked >= 1),
    status varchar(20) default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (ride_id, passenger_id)
);

-- Enable RLS for Bookings
alter table public.bookings enable row level security;

create policy "Allow passenger and driver to view bookings" 
on public.bookings for select 
using (
    auth.uid() = passenger_id or 
    exists (
        select 1 from public.rides 
        where id = ride_id and driver_id = auth.uid()
    )
);

create policy "Allow passengers to create a booking" 
on public.bookings for insert 
with check (auth.uid() = passenger_id);

create policy "Allow passenger or driver to update booking status" 
on public.bookings for update 
using (
    auth.uid() = passenger_id or 
    exists (
        select 1 from public.rides 
        where id = ride_id and driver_id = auth.uid()
    )
);

-- 5. MESSAGES
create table public.messages (
    id uuid default gen_random_uuid() primary key,
    booking_id uuid references public.bookings(id) on delete cascade not null,
    sender_id uuid references public.profiles(id) on delete cascade not null,
    content text not null check (length(trim(content)) > 0),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Messages
alter table public.messages enable row level security;

create policy "Allow messaging access for confirmed booking participants"
on public.messages
for all
using (
    exists (
        select 1 from public.bookings b
        join public.rides r on b.ride_id = r.id
        where b.id = booking_id
          and b.status = 'confirmed'
          and (b.passenger_id = auth.uid() or r.driver_id = auth.uid())
    )
);

-- 6. REVIEWS
create table public.reviews (
    id uuid default gen_random_uuid() primary key,
    reviewer_id uuid references public.profiles(id) on delete cascade not null,
    reviewee_id uuid references public.profiles(id) on delete cascade not null,
    ride_id uuid references public.rides(id) on delete cascade not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    check (reviewer_id <> reviewee_id)
);

-- Enable RLS for Reviews
alter table public.reviews enable row level security;

create policy "Allow read access to all reviews"
on public.reviews for select
using (true);

create policy "Allow users to post reviews if they participated in the ride"
on public.reviews for insert
with check (
    auth.uid() = reviewer_id and (
        exists (
            select 1 from public.rides 
            where id = ride_id and (driver_id = reviewer_id or driver_id = reviewee_id)
        ) or exists (
            select 1 from public.bookings 
            where ride_id = ride_id and (passenger_id = reviewer_id or passenger_id = reviewee_id)
        )
    )
);

-- TRIGGERS & BUSINESS LOGIC

-- A. Legal Price Cap check
create or replace function check_ride_price_cap()
returns trigger as $$
declare
    max_allowed integer;
begin
    select max_price_dirhams into max_allowed
    from public.route_price_caps
    where lower(origin_city) = lower(new.origin_city)
      and lower(destination_city) = lower(new.destination_city);

    if max_allowed is not null and new.price_per_seat > max_allowed then
        raise exception 'Price per seat (%) exceeds the legal cost-sharing price cap of % MAD for this route.', 
            new.price_per_seat, max_allowed;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger enforce_ride_price_cap
before insert or update on public.rides
for each row execute function check_ride_price_cap();

-- B. Sync user profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone_number, full_name, avatar_url)
  values (
    new.id,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
