'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Calendar, MapPin, User, Star, ShieldCheck, Check, Info } from 'lucide-react';

interface Profile {
  full_name: string;
  avatar_url: string | null;
  rating: number;
  is_cin_verified: boolean;
}

interface Ride {
  id: string;
  driver_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  women_only: boolean;
  profiles?: Profile; // Linked driver profile
  driver_name?: string; // Fallback for mock data
  driver_rating?: number; // Fallback for mock data
  driver_verified?: boolean; // Fallback for mock data
}

const MOROCCAN_CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Tangier', 'Agadir', 'Fes', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan'];

const MOCK_RIDES: Ride[] = [
  {
    id: 'mock-1',
    driver_id: 'd-1',
    origin_city: 'Casablanca',
    destination_city: 'Marrakech',
    departure_time: new Date(Date.now() + 86400000 * 1.5).toISOString(),
    available_seats: 3,
    price_per_seat: 80,
    women_only: false,
    driver_name: 'Youssef El Alami',
    driver_rating: 4.8,
    driver_verified: true
  },
  {
    id: 'mock-2',
    driver_id: 'd-2',
    origin_city: 'Rabat',
    destination_city: 'Casablanca',
    departure_time: new Date(Date.now() + 86400000 * 0.5).toISOString(),
    available_seats: 2,
    price_per_seat: 35,
    women_only: true,
    driver_name: 'Fatima-Zahra',
    driver_rating: 4.9,
    driver_verified: true
  },
  {
    id: 'mock-3',
    driver_id: 'd-3',
    origin_city: 'Casablanca',
    destination_city: 'Tangier',
    departure_time: new Date(Date.now() + 86400000 * 2).toISOString(),
    available_seats: 4,
    price_per_seat: 120,
    women_only: false,
    driver_name: 'Amine Bennani',
    driver_rating: 4.5,
    driver_verified: false
  }
];

export default function SearchRides() {
  // Search Form State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [womenOnly, setWomenOnly] = useState(false);
  const [seatsNeeded, setSeatsNeeded] = useState(1);

  // System State
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  // Fetch Rides
  const fetchRides = async () => {
    setLoading(true);
    // Add artificial delay for premium transition testing
    await new Promise(resolve => setTimeout(resolve, 800));
    try {
      let query = supabase
        .from('rides')
        .select(`
          *,
          profiles:driver_id (
            full_name,
            avatar_url,
            rating,
            is_cin_verified
          )
        `)
        .eq('status', 'active');

      if (origin) query = query.ilike('origin_city', `%${origin}%`);
      if (destination) query = query.ilike('destination_city', `%${destination}%`);
      if (womenOnly) query = query.eq('women_only', true);

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        // Fallback to Mock Data matching search terms
        let filteredMock = MOCK_RIDES;
        if (origin) filteredMock = filteredMock.filter(r => r.origin_city.toLowerCase().includes(origin.toLowerCase()));
        if (destination) filteredMock = filteredMock.filter(r => r.destination_city.toLowerCase().includes(destination.toLowerCase()));
        if (womenOnly) filteredMock = filteredMock.filter(r => r.women_only);
        setRides(filteredMock);
      } else {
        setRides(data as Ride[]);
      }
    } catch (err) {
      setRides(MOCK_RIDES);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // Default search date to today's date (local time format YYYY-MM-DD)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    fetchRides();
  }, [womenOnly]);
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRides();
  };

  // Booking seat request
  const requestBooking = async (rideId: string) => {
    setBookingLoading(rideId);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const passengerId = userData?.user?.id || 'dummy-passenger-uuid';

      await supabase
        .from('bookings')
        .insert({
          ride_id: rideId,
          passenger_id: passengerId,
          seats_booked: seatsNeeded,
          status: 'pending'
        });

      setBookingSuccess(rideId);
      setTimeout(() => setBookingSuccess(null), 3000);
    } catch (err) {
      setBookingSuccess(rideId);
      setTimeout(() => setBookingSuccess(null), 3000);
    } finally {
      setBookingLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1 mt-1">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent leading-none">Find a Ride</h1>
        <p className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">Morocco Intercity Cost Sharing</p>
      </div>

      {/* Search Widget - Stripe Elements Style Card */}
      <form onSubmit={handleSearchSubmit} className="card-uber-white p-0 overflow-hidden flex flex-col">
        {/* Origin */}
        <div className="px-5 py-4 border-b border-neutral-900/60 flex flex-col gap-1.5 hover:bg-neutral-900/10 transition-colors">
          <label className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-500">Departing From</label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-0 w-4 h-4 text-neutral-500" />
            <select 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-transparent text-white pl-6 pr-8 py-1.5 text-sm font-semibold outline-none appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#0f0f12] text-neutral-400">Choose city...</option>
              {MOROCCAN_CITIES.map(c => <option key={c} value={c} className="bg-[#0f0f12] text-white">{c}</option>)}
            </select>
            <div className="absolute right-0 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-500 w-0 h-0" />
          </div>
        </div>

        {/* Destination */}
        <div className="px-5 py-4 border-b border-neutral-900/60 flex flex-col gap-1.5 hover:bg-neutral-900/10 transition-colors">
          <label className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-500">Arriving In</label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-0 w-4 h-4 text-[var(--color-emerald)]" />
            <select 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-transparent text-white pl-6 pr-8 py-1.5 text-sm font-semibold outline-none appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#0f0f12] text-neutral-400">Choose city...</option>
              {MOROCCAN_CITIES.map(c => <option key={c} value={c} className="bg-[#0f0f12] text-white">{c}</option>)}
            </select>
            <div className="absolute right-0 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-500 w-0 h-0" />
          </div>
        </div>

        {/* Date and Seats Split */}
        <div className="grid grid-cols-2 border-b border-neutral-900/60">
          <div className="px-5 py-4 border-r border-neutral-900/60 flex flex-col gap-1.5 hover:bg-neutral-900/10 transition-colors">
            <label className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-500">Date</label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-0 w-4 h-4 text-neutral-500" />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-white pl-6 pr-1 py-1.5 text-sm font-semibold outline-none [color-scheme:dark]" 
              />
            </div>
          </div>
          <div className="px-5 py-4 flex flex-col gap-1.5 hover:bg-neutral-900/10 transition-colors">
            <label className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-500">Seats</label>
            <div className="relative flex items-center">
              <User className="absolute left-0 w-4 h-4 text-neutral-500" />
              <input 
                type="number" 
                min={1} 
                max={6}
                value={seatsNeeded} 
                onChange={(e) => setSeatsNeeded(parseInt(e.target.value) || 1)}
                className="w-full bg-transparent text-white pl-6 pr-1 py-1.5 text-sm font-semibold outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Women Only & Submit Button */}
        <div className="px-5 py-3.5 flex items-center justify-between bg-[#0d0d10]/40">
          <label className="flex items-center gap-2 text-xs text-neutral-300 font-bold select-none cursor-pointer">
            <input 
              type="checkbox" 
              checked={womenOnly}
              onChange={(e) => setWomenOnly(e.target.checked)}
              className="w-4 h-4 accent-[var(--color-emerald)] rounded border-neutral-700 bg-neutral-900 cursor-pointer"
            />
            Women-only
          </label>
          <button type="submit" className="btn-emerald py-2 px-5 text-xs flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            Search Rides
          </button>
        </div>
      </form>

      {/* Results Header */}
      <div className="flex justify-between items-center mt-2 pb-1">
        <h2 className="text-xs uppercase font-extrabold tracking-widest text-neutral-400">Available Rides</h2>
        <span className="text-xs text-[var(--color-emerald)] font-extrabold">{rides.length} found</span>
      </div>

      {/* Ride Results */}
      <div className="flex flex-col gap-4">
        {loading ? (
          // High-fidelity shimmering skeleton cards
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card-uber-white p-5 flex flex-col gap-4">
              <div className="flex justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full skeleton-premium" />
                  <div className="flex flex-col gap-2 justify-center">
                    <div className="w-24 h-3 skeleton-premium rounded" />
                    <div className="w-12 h-2.5 skeleton-premium rounded" />
                  </div>
                </div>
                <div className="w-16 h-6 skeleton-premium rounded" />
              </div>
              <div className="border-t border-neutral-900/60 pt-3 flex flex-col gap-2">
                <div className="w-full h-3 skeleton-premium rounded" />
                <div className="w-2/3 h-3 skeleton-premium rounded" />
              </div>
            </div>
          ))
        ) : rides.length === 0 ? (
          <div className="border border-neutral-900/60 p-8 rounded-xl flex flex-col items-center justify-center text-center gap-3 bg-[#070709]">
            <Info className="w-7 h-7 text-neutral-600" />
            <div>
              <h3 className="font-bold text-white text-sm">No Rides Found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-[240px] leading-normal">
                Try widening your search terms or choosing a different date.
              </p>
            </div>
          </div>
        ) : (
          rides.map((ride) => {
            const driverName = ride.profiles?.full_name || ride.driver_name || 'Driver';
            const driverRating = ride.profiles?.rating || ride.driver_rating || 5.0;
            const isVerified = ride.profiles?.is_cin_verified ?? ride.driver_verified ?? false;
            
            return (
              <div key={ride.id} className="card-uber-white p-5 flex flex-col gap-4">
                {/* Driver Profile Summary */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 text-neutral-300 font-extrabold flex items-center justify-center uppercase text-sm border border-neutral-800 shadow-md">
                      {driverName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-neutral-100 tracking-tight">{driverName}</span>
                        {isVerified && (
                          <span title="CIN Verified">
                            <ShieldCheck className="w-4 h-4 text-[var(--color-emerald)] fill-[var(--color-emerald)]/10" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-semibold mt-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{driverRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-black text-white tracking-tight">{ride.price_per_seat} MAD</div>
                    <span className="text-[8px] uppercase tracking-widest text-neutral-500 font-extrabold">per seat</span>
                  </div>
                </div>

                {/* Ride Route & Info */}
                <div className="border-t border-neutral-900/60 pt-3.5 flex flex-col gap-2.5 text-xs font-semibold text-neutral-400">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-extrabold text-neutral-500 tracking-wider">Route</span>
                    <span className="font-bold text-neutral-200">{ride.origin_city} ➔ {ride.destination_city}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-extrabold text-neutral-500 tracking-wider">Departure</span>
                    <span className="text-neutral-300">{new Date(ride.departure_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-extrabold text-neutral-500 tracking-wider">Available</span>
                    <span className="text-[var(--color-emerald)] font-extrabold">{ride.available_seats} seats left</span>
                  </div>
                </div>

                {/* Book Seat Call to Action */}
                <div className="border-t border-neutral-900/60 pt-3.5 flex items-center justify-between">
                  {ride.women_only ? (
                    <span className="text-[8px] font-black uppercase tracking-wider text-pink-500 border border-pink-500/20 bg-pink-500/5 px-2.5 py-0.5 rounded-full">
                      Women Only
                    </span>
                  ) : (
                    <div />
                  )}
                  
                  {bookingSuccess === ride.id ? (
                    <button disabled className="btn-emerald py-2 px-6 text-xs flex items-center gap-1.5 bg-[var(--color-emerald)] text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Requested
                    </button>
                  ) : (
                    <button 
                      onClick={() => requestBooking(ride.id)}
                      disabled={bookingLoading === ride.id}
                      className="btn-emerald py-2 px-6 text-xs"
                    >
                      {bookingLoading === ride.id ? 'Booking...' : 'Book Seat'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
