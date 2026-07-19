-- Triqna Database Seed Data
-- Paste this script into your Supabase SQL Editor to populate the database with test profiles, rides, and bookings.

-- 1. Create Test Users in auth.users first if not exists (Normally handled by Firebase/Supabase Auth, but needed for testing)
-- Note: Profiles are created automatically via the trigger 'on_auth_user_created' once these auth.users are inserted.
-- We will use some placeholder UUIDs for drivers and passengers.

-- Let's make sure the trigger functions and tables exist first.
-- Clean up previous test profile inserts if any exist:
delete from public.profiles where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444'
);

-- Insert profiles directly to bypass auth.users insert limits during manual seeding
insert into public.profiles (id, phone_number, full_name, bio, rating, is_cin_verified) values
('11111111-1111-1111-1111-111111111111', '+212611111111', 'Youssef El Alami', 'Frequent commuter between Casablanca and Marrakech. Travel safe and cost-share tolls!', 4.8, true),
('22222222-2222-2222-2222-222222222222', '+212622222222', 'Fatima-Zahra Bennani', 'Daily commuter Rabat-Casablanca. Prefer quiet rides, happy to chat or listen to podcasts.', 4.9, true),
('33333333-3333-3333-3333-333333333333', '+212633333333', 'Karim Belkhayat', 'Travelling Fes to Rabat on weekends. Certified professional driver.', 4.6, false),
('44444444-4444-4444-4444-444444444444', '+212644444444', 'Sara Kabbaj', 'Passenger looking for safe, women-only rides between Casablanca and Marrakech.', 5.0, true);

-- 2. Insert Active Rides (Morocco Routes)
-- Coords format: Point(longitude latitude)
-- Casablanca: -7.5898 33.5731
-- Marrakech: -7.9811 31.6295
-- Rabat: -6.8498 34.0209
-- Tangier: -5.8339 35.7595
-- Fes: -5.0003 34.0331
-- Agadir: -9.5981 30.4184

delete from public.rides;

-- Ride 1: Casablanca to Marrakech (Youssef El Alami) - Price: 80 MAD (Capped at 90 MAD)
insert into public.rides (id, driver_id, origin_city, destination_city, origin_coords, destination_coords, departure_time, available_seats, price_per_seat, women_only, status) values
('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Casablanca', 'Marrakech', st_geogfromtext('SRID=4326;POINT(-7.5898 33.5731)'), st_geogfromtext('SRID=4326;POINT(-7.9811 31.6295)'), now() + interval '1 day', 3, 80, false, 'active');

-- Ride 2: Rabat to Casablanca (Fatima-Zahra Bennani) - Price: 35 MAD (Capped at 40 MAD) - Women Only
insert into public.rides (id, driver_id, origin_city, destination_city, origin_coords, destination_coords, departure_time, available_seats, price_per_seat, women_only, status) values
('10000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Rabat', 'Casablanca', st_geogfromtext('SRID=4326;POINT(-6.8498 34.0209)'), st_geogfromtext('SRID=4326;POINT(-7.5898 33.5731)'), now() + interval '8 hours', 4, 35, true, 'active');

-- Ride 3: Casablanca to Tangier (Youssef El Alami) - Price: 120 MAD (Capped at 130 MAD)
insert into public.rides (id, driver_id, origin_city, destination_city, origin_coords, destination_coords, departure_time, available_seats, price_per_seat, women_only, status) values
('10000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Casablanca', 'Tangier', st_geogfromtext('SRID=4326;POINT(-7.5898 33.5731)'), st_geogfromtext('SRID=4326;POINT(-5.8339 35.7595)'), now() + interval '2 days', 4, 120, false, 'active');

-- Ride 4: Fes to Rabat (Karim Belkhayat) - Price: 75 MAD (Capped at 80 MAD)
insert into public.rides (id, driver_id, origin_city, destination_city, origin_coords, destination_coords, departure_time, available_seats, price_per_seat, women_only, status) values
('10000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'Fes', 'Rabat', st_geogfromtext('SRID=4326;POINT(-5.0003 34.0331)'), st_geogfromtext('SRID=4326;POINT(-6.8498 34.0209)'), now() + interval '3 days', 2, 75, false, 'active');


-- 3. Insert Bookings
delete from public.bookings;

-- Booking 1: Passenger Sara Kabbaj booked 1 seat on Youssef's Casablanca-Marrakech ride (Confirmed)
insert into public.bookings (id, ride_id, passenger_id, seats_booked, status) values
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 1, 'confirmed');

-- Booking 2: Passenger Fatima-Zahra booked 2 seats on Karim's Fes-Rabat ride (Pending)
insert into public.bookings (id, ride_id, passenger_id, seats_booked, status) values
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 2, 'pending');


-- 4. Insert Messages (Only allowed on confirmed bookings)
delete from public.messages;

insert into public.messages (booking_id, sender_id, content, created_at) values
('20000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Salam Sara! Thanks for booking. We will meet near the Casa-Port train station entrance.', now() - interval '20 minutes'),
('20000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'Wa Alaikum Salam! Sounds perfect. I will be wearing a blue jacket.', now() - interval '10 minutes'),
('20000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Perfect, see you tomorrow. Keep 80 MAD cash ready for tolls/gas.', now() - interval '5 minutes');
