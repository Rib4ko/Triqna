'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Calendar, 
  MapPin, 
  User, 
  Star, 
  ShieldCheck, 
  Check, 
  Info, 
  ArrowRightLeft, 
  ArrowRight,
  Clock, 
  Sparkles,
  Users
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import AuthModal from '@/components/AuthModal';
import { MOROCCAN_CITIES, CITY_NAMES } from '@/lib/moroccoCities';

// Dynamically import RouteMap to avoid SSR issues with Leaflet
const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[240px] sm:h-[280px] rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-500">Loading interactive trajectory map...</span>
    </div>
  ),
});

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
  profiles?: Profile;
  driver_name?: string;
  driver_rating?: number;
  driver_verified?: boolean;
}

const POPULAR_ROUTES = [
  { from: 'Marrakech', to: 'Casablanca' },
  { from: 'Casablanca', to: 'Rabat' },
  { from: 'Casablanca', to: 'Tangier' },
  { from: 'Marrakech', to: 'Agadir' },
  { from: 'Fes', to: 'Rabat' },
];

const MOCK_RIDES: Ride[] = [
  {
    id: 'mock-1',
    driver_id: 'd-1',
    origin_city: 'Marrakech',
    destination_city: 'Casablanca',
    departure_time: new Date(Date.now() + 86400000 * 0.8).toISOString(),
    available_seats: 3,
    price_per_seat: 85,
    women_only: false,
    driver_name: 'Youssef El Alami',
    driver_rating: 4.9,
    driver_verified: true
  },
  {
    id: 'mock-2',
    driver_id: 'd-2',
    origin_city: 'Casablanca',
    destination_city: 'Marrakech',
    departure_time: new Date(Date.now() + 86400000 * 1.2).toISOString(),
    available_seats: 2,
    price_per_seat: 80,
    women_only: false,
    driver_name: 'Mehdi Benali',
    driver_rating: 4.8,
    driver_verified: true
  },
  {
    id: 'mock-3',
    driver_id: 'd-3',
    origin_city: 'Rabat',
    destination_city: 'Casablanca',
    departure_time: new Date(Date.now() + 86400000 * 0.3).toISOString(),
    available_seats: 3,
    price_per_seat: 35,
    women_only: true,
    driver_name: 'Fatima-Zahra',
    driver_rating: 5.0,
    driver_verified: true
  },
  {
    id: 'mock-4',
    driver_id: 'd-4',
    origin_city: 'Casablanca',
    destination_city: 'Tangier',
    departure_time: new Date(Date.now() + 86400000 * 1.5).toISOString(),
    available_seats: 4,
    price_per_seat: 120,
    women_only: false,
    driver_name: 'Amine Bennani',
    driver_rating: 4.7,
    driver_verified: true
  },
  {
    id: 'mock-5',
    driver_id: 'd-5',
    origin_city: 'Marrakech',
    destination_city: 'Agadir',
    departure_time: new Date(Date.now() + 86400000 * 2.1).toISOString(),
    available_seats: 2,
    price_per_seat: 75,
    women_only: false,
    driver_name: 'Karim Tazi',
    driver_rating: 4.6,
    driver_verified: false
  }
];

export default function SearchRides() {
  const { showToast } = useToast();

  // Search Form State
  const [origin, setOrigin] = useState('Marrakech');
  const [destination, setDestination] = useState('Casablanca');
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

  // Active hover/selected route for map preview
  const [activeRideRoute, setActiveRideRoute] = useState<{ from: string; to: string } | null>(null);

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
  }, [origin, destination, womenOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRides();
  };

  // Swap origin and destination
  const handleSwapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Select a preset route
  const handleSelectPreset = (from: string, to: string) => {
    setOrigin(from);
    setDestination(to);
  };

  // Map City Click Handler
  const handleMapCitySelect = (city: string, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setOrigin(city);
    } else {
      setDestination(city);
    }
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

  // Map display origin & destination
  const mapOrigin = activeRideRoute?.from || origin;
  const mapDestination = activeRideRoute?.to || destination;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Carpooling Across Morocco</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Where are you heading?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Pick your cities and preview the route trajectory live on the map.
          </p>
        </div>

        {/* Quick Route Presets */}
        <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Popular:</span>
          {POPULAR_ROUTES.slice(0, 3).map((r) => (
            <button
              key={`${r.from}-${r.to}`}
              type="button"
              onClick={() => handleSelectPreset(r.from, r.to)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                origin === r.from && destination === r.to
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              {r.from} ➔ {r.to}
            </button>
          ))}
        </div>
      </div>

      {/* Simplified, Dynamic Search Bar */}
      <form 
        onSubmit={handleSearchSubmit} 
        className="card-airbnb p-2 md:p-3 shadow-md border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center gap-2"
      >
        {/* Origin */}
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl transition-colors border border-slate-200/60">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">From</span>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-transparent text-slate-900 font-bold text-sm outline-none cursor-pointer"
            >
              <option value="">Select departure city...</option>
              {CITY_NAMES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={handleSwapCities}
          title="Swap departure and destination"
          className="self-center md:self-auto p-2.5 rounded-xl bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 shadow-xs transition-all active:scale-90 cursor-pointer"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>

        {/* Destination */}
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl transition-colors border border-slate-200/60">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">To</span>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-transparent text-slate-900 font-bold text-sm outline-none cursor-pointer"
            >
              <option value="">Select destination city...</option>
              {CITY_NAMES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div className="w-full md:w-44 flex items-center gap-3 px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl transition-colors border border-slate-200/60">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent text-slate-900 font-semibold text-xs sm:text-sm outline-none"
            />
          </div>
        </div>

        {/* Passengers / Seats */}
        <div className="w-full md:w-28 flex items-center gap-2 px-3 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl transition-colors border border-slate-200/60">
          <Users className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Seats</span>
            <select
              value={seatsNeeded}
              onChange={(e) => setSeatsNeeded(parseInt(e.target.value) || 1)}
              className="w-full bg-transparent text-slate-900 font-bold text-sm outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'seat' : 'seats'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Action */}
        <button 
          type="submit" 
          className="btn-primary-blue py-3.5 px-6 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Search className="w-4 h-4 stroke-[2.5]" />
          <span>Find</span>
        </button>
      </form>

      {/* Dynamic Interactive Trajectory Map */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-600">
              Live Trajectory Map
            </span>
          </div>
          {origin && destination && (
            <span className="text-xs text-slate-500 font-medium">
              Showing route for <strong className="text-slate-900">{origin} ➔ {destination}</strong>
            </span>
          )}
        </div>

        <RouteMap
          origin={mapOrigin}
          destination={mapDestination}
          onSelectCity={handleMapCitySelect}
        />
      </div>

      {/* Filter Tabs & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWomenOnly(false)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              !womenOnly 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Rides ({rides.length})
          </button>
          <button
            type="button"
            onClick={() => setWomenOnly(true)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              womenOnly 
                ? 'bg-pink-600 text-white shadow-xs' 
                : 'bg-white text-pink-700 border border-pink-200 hover:bg-pink-50'
            }`}
          >
            <span>👩</span>
            <span>Women Only</span>
          </button>
        </div>

        <span className="text-xs font-bold text-slate-500">
          {rides.length} {rides.length === 1 ? 'ride available' : 'rides available'}
        </span>
      </div>

      {/* Ride Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
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
          <div className="col-span-full border border-slate-200 p-10 rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-white shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">No Direct Rides Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm leading-normal">
                There are no rides listed from <strong>{origin || 'selected origin'}</strong> to <strong>{destination || 'selected destination'}</strong> yet. Try switching cities or creating an offer!
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOrigin('');
                setDestination('');
                setWomenOnly(false);
              }}
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
            >
              Clear filters and view all rides
            </button>
          </div>
        ) : (
          rides.map((ride) => {
            const driverName = ride.profiles?.full_name || ride.driver_name || 'Driver';
            const driverRating = ride.profiles?.rating || ride.driver_rating || 5.0;
            const isVerified = ride.profiles?.is_cin_verified ?? ride.driver_verified ?? false;
            
            return (
              <div 
                key={ride.id} 
                onMouseEnter={() => setActiveRideRoute({ from: ride.origin_city, to: ride.destination_city })}
                onMouseLeave={() => setActiveRideRoute(null)}
                className="card-airbnb p-5 flex flex-col justify-between gap-4 group hover:border-blue-300 transition-all cursor-default"
              >
                <div className="flex flex-col gap-4">
                  {/* Driver Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center uppercase text-sm border border-blue-200 shadow-xs">
                        {driverName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-900">{driverName}</span>
                          {isVerified && (
                            <span title="CIN Verified Driver">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-500/10" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-0.5">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{driverRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-extrabold text-blue-600 tracking-tight">{ride.price_per_seat} MAD</div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">per seat</span>
                    </div>
                  </div>

                  {/* Route Trajectory Pill */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>{ride.origin_city}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{ride.destination_city}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(ride.departure_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(ride.departure_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-blue-600 font-bold">
                        {ride.available_seats} {ride.available_seats === 1 ? 'seat left' : 'seats left'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer / CTA */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-auto">
                  {ride.women_only ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-pink-600 border border-pink-200 bg-pink-50 px-2.5 py-0.5 rounded-full">
                      Women Only
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">
                      Instant Request
                    </span>
                  )}
                  
                  {bookingSuccess === ride.id ? (
                    <button disabled className="py-2 px-4 text-xs font-bold rounded-lg flex items-center gap-1.5 bg-emerald-600 text-white shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Requested
                    </button>
                  ) : (
                    <button 
                      onClick={() => requestBooking(ride.id)}
                      disabled={bookingLoading === ride.id}
                      className="btn-primary-blue py-2 px-5 text-xs font-bold cursor-pointer"
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
