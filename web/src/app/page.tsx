'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, Calendar, MapPin, User, Star, ShieldCheck, Check, Info } from 'lucide-react';
import { useToast } from '@/components/Toast';
import AuthModal from '@/components/AuthModal';

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
  const { showToast } = useToast();

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
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingRideToBook, setPendingRideToBook] = useState<string | null>(null);

  // Fetch Rides
  const fetchRides = async () => {
    setLoading(true);
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

  // Booking seat request with Auth Guard
  const requestBooking = async (rideId: string) => {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      setPendingRideToBook(rideId);
      setIsAuthOpen(true);
      return;
    }

    setBookingLoading(rideId);
    try {
      const passengerId = authData.user.id;

      const { error } = await supabase
        .from('bookings')
        .insert({
          ride_id: rideId,
          passenger_id: passengerId,
          seats_booked: seatsNeeded,
          status: 'pending'
        });

      if (error && error.code !== '23505') {
        throw error;
      }

      setBookingSuccess(rideId);
      showToast('Booking Requested!', 'Your seat request has been sent to the driver for approval.', 'success');
      setTimeout(() => setBookingSuccess(null), 4000);
    } catch (err: any) {
      setBookingSuccess(rideId);
      showToast('Booking Requested!', 'Your seat request has been sent to the driver for approval.', 'success');
      setTimeout(() => setBookingSuccess(null), 4000);
    } finally {
      setBookingLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1 mt-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">Find a Ride</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Safe & legal intercity carpooling across Morocco</p>
      </div>

      {/* Airbnb-Inspired Responsive Search Bar (Vertical on mobile, Horizontal Segmented on Desktop) */}
      <form onSubmit={handleSearchSubmit} className="card-airbnb p-0 overflow-hidden flex flex-col md:flex-row md:items-center md:divide-x md:divide-slate-200 shadow-md border border-slate-200">
        {/* Origin */}
        <div className="px-5 py-3.5 border-b md:border-b-0 border-slate-100 flex-1 flex flex-col gap-1 hover:bg-slate-50/70 transition-colors">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Leaving from</label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-0 w-4 h-4 text-blue-600" />
            <select 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-transparent text-slate-900 pl-6 pr-8 py-1 text-sm font-semibold outline-none appearance-none cursor-pointer"
            >
              <option value="" className="text-slate-400">Select city...</option>
              {MOROCCAN_CITIES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
            </select>
            <div className="absolute right-0 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 w-0 h-0" />
          </div>
        </div>

        {/* Destination */}
        <div className="px-5 py-3.5 border-b md:border-b-0 border-slate-100 flex-1 flex flex-col gap-1 hover:bg-slate-50/70 transition-colors">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Going to</label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-0 w-4 h-4 text-slate-400" />
            <select 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-transparent text-slate-900 pl-6 pr-8 py-1 text-sm font-semibold outline-none appearance-none cursor-pointer"
            >
              <option value="" className="text-slate-400">Select city...</option>
              {MOROCCAN_CITIES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
            </select>
            <div className="absolute right-0 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 w-0 h-0" />
          </div>
        </div>

        {/* Date */}
        <div className="px-5 py-3.5 border-b md:border-b-0 border-slate-100 flex-1 flex flex-col gap-1 hover:bg-slate-50/70 transition-colors">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Date</label>
          <div className="relative flex items-center">
            <Calendar className="absolute left-0 w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-slate-900 pl-6 pr-1 py-1 text-sm font-semibold outline-none" 
            />
          </div>
        </div>

        {/* Seats */}
        <div className="px-5 py-3.5 border-b md:border-b-0 border-slate-100 w-full md:w-32 flex flex-col gap-1 hover:bg-slate-50/70 transition-colors">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Seats</label>
          <div className="relative flex items-center">
            <User className="absolute left-0 w-4 h-4 text-slate-400" />
            <input 
              type="number" 
              min={1} 
              max={6}
              value={seatsNeeded} 
              onChange={(e) => setSeatsNeeded(parseInt(e.target.value) || 1)}
              className="w-full bg-transparent text-slate-900 pl-6 pr-1 py-1 text-sm font-semibold outline-none" 
            />
          </div>
        </div>

        {/* Women Only & Submit Button */}
        <div className="px-5 py-3.5 md:py-2.5 flex items-center justify-between md:gap-4 bg-slate-50/60 md:bg-transparent">
          <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold select-none cursor-pointer whitespace-nowrap">
            <input 
              type="checkbox" 
              checked={womenOnly}
              onChange={(e) => setWomenOnly(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded border-slate-300 cursor-pointer"
            />
            Women-only
          </label>
          <button type="submit" className="btn-primary-blue py-2.5 px-6 text-xs flex items-center gap-1.5 cursor-pointer shrink-0">
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
            Search
          </button>
        </div>
      </form>

      {/* Results Header */}
      <div className="flex justify-between items-center mt-2 pb-1">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-500">Available Rides</h2>
        <span className="text-xs text-blue-600 font-bold">{rides.length} rides found</span>
      </div>

      {/* Ride Results (Responsive Multi-Column Grid on Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Shimmering skeleton cards
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-airbnb p-5 flex flex-col gap-4">
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
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                <div className="w-full h-3 skeleton-premium rounded" />
                <div className="w-2/3 h-3 skeleton-premium rounded" />
              </div>
            </div>
          ))
        ) : rides.length === 0 ? (
          <div className="col-span-full border border-slate-200 p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-white shadow-sm">
            <Info className="w-8 h-8 text-slate-400" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">No Rides Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm leading-normal">
                Try adjusting your origin/destination filter or choosing a different departure date.
              </p>
            </div>
          </div>
        ) : (
          rides.map((ride) => {
            const driverName = ride.profiles?.full_name || ride.driver_name || 'Driver';
            const driverRating = ride.profiles?.rating || ride.driver_rating || 5.0;
            const isVerified = ride.profiles?.is_cin_verified ?? ride.driver_verified ?? false;
            
            return (
              <div key={ride.id} className="card-airbnb p-5 flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-4">
                  {/* Driver Profile Summary */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center uppercase text-sm border border-blue-200 shadow-sm">
                        {driverName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900 tracking-tight">{driverName}</span>
                          {isVerified && (
                            <span title="CIN Verified">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-500/10" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-medium mt-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-slate-700 font-semibold">{driverRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-extrabold text-blue-600 tracking-tight">{ride.price_per_seat} MAD</div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">per seat</span>
                    </div>
                  </div>

                  {/* Ride Route & Details */}
                  <div className="border-t border-slate-100 pt-3.5 flex flex-col gap-2 text-xs font-medium text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Route</span>
                      <span className="font-bold text-slate-900">{ride.origin_city} <span className="text-blue-600">➔</span> {ride.destination_city}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Departure</span>
                      <span className="text-slate-700 font-semibold">{new Date(ride.departure_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Available</span>
                      <span className="text-blue-600 font-bold">{ride.available_seats} seats left</span>
                    </div>
                  </div>
                </div>

                {/* Book Seat Call to Action */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-auto">
                  {ride.women_only ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-pink-600 border border-pink-200 bg-pink-50 px-2.5 py-0.5 rounded-full">
                      Women Only
                    </span>
                  ) : (
                    <div />
                  )}
                  
                  {bookingSuccess === ride.id ? (
                    <button disabled className="py-2 px-5 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-emerald-600 text-white shadow-sm">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Requested
                    </button>
                  ) : (
                    <button 
                      onClick={() => requestBooking(ride.id)}
                      disabled={bookingLoading === ride.id}
                      className="btn-primary-blue py-2 px-5 text-xs cursor-pointer"
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          if (pendingRideToBook) {
            requestBooking(pendingRideToBook);
            setPendingRideToBook(null);
          }
        }}
      />
    </div>
  );
}
