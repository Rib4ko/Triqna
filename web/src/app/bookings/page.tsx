'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Calendar, MapPin, Check, X, ShieldAlert, AlertCircle } from 'lucide-react';

interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  passenger_name?: string;
  ride?: {
    origin_city: string;
    destination_city: string;
    departure_time: string;
    price_per_seat: number;
    driver_id: string;
    driver_name?: string;
  };
}

interface OfferedRide {
  id: string;
  origin_city: string;
  destination_city: string;
  departure_time: string;
  price_per_seat: number;
  available_seats: number;
  bookings: Booking[];
}

const MOCK_MY_BOOKINGS: Booking[] = [
  {
    id: 'b-101',
    ride_id: 'ride-abc',
    passenger_id: 'me',
    seats_booked: 1,
    status: 'confirmed',
    ride: {
      origin_city: 'Casablanca',
      destination_city: 'Marrakech',
      departure_time: new Date(Date.now() + 86400000).toISOString(),
      price_per_seat: 80,
      driver_id: 'driver-999',
      driver_name: 'Youssef El Alami'
    }
  },
  {
    id: 'b-102',
    ride_id: 'ride-xyz',
    passenger_id: 'me',
    seats_booked: 2,
    status: 'pending',
    ride: {
      origin_city: 'Rabat',
      destination_city: 'Casablanca',
      departure_time: new Date(Date.now() + 86400000 * 2).toISOString(),
      price_per_seat: 35,
      driver_id: 'driver-888',
      driver_name: 'Fatima-Zahra'
    }
  }
];

const MOCK_OFFERED_RIDES: OfferedRide[] = [
  {
    id: 'my-ride-1',
    origin_city: 'Casablanca',
    destination_city: 'Tangier',
    departure_time: new Date(Date.now() + 86400000 * 1.5).toISOString(),
    price_per_seat: 120,
    available_seats: 4,
    bookings: [
      {
        id: 'b-201',
        ride_id: 'my-ride-1',
        passenger_id: 'pass-1',
        seats_booked: 2,
        status: 'pending',
        passenger_name: 'Amine Bennani'
      },
      {
        id: 'b-202',
        ride_id: 'my-ride-1',
        passenger_id: 'pass-2',
        seats_booked: 1,
        status: 'confirmed',
        passenger_name: 'Sara Kabbaj'
      }
    ]
  }
];

export default function BookingsHub() {
  const [activeTab, setActiveTab] = useState<'passenger' | 'driver'>('passenger');
  const [passengerBookings, setPassengerBookings] = useState<Booking[]>([]);
  const [offeredRides, setOfferedRides] = useState<OfferedRide[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Booking Details
  const fetchBookingsData = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || 'me';

      // 1. Fetch passenger bookings
      const { data: passData, error: passErr } = await supabase
        .from('bookings')
        .select(`
          *,
          ride:ride_id (
            origin_city,
            destination_city,
            departure_time,
            price_per_seat,
            driver_id
          )
        `)
        .eq('passenger_id', userId);

      // 2. Fetch driver rides & related bookings
      const { data: driverData, error: driverErr } = await supabase
        .from('rides')
        .select(`
          *,
          bookings (
            *
          )
        `)
        .eq('driver_id', userId);

      if (passErr || driverErr || !passData) {
        setPassengerBookings(MOCK_MY_BOOKINGS);
        setOfferedRides(MOCK_OFFERED_RIDES);
      } else {
        setPassengerBookings(passData as any);
        setOfferedRides(driverData as any);
      }
    } catch (err) {
      setPassengerBookings(MOCK_MY_BOOKINGS);
      setOfferedRides(MOCK_OFFERED_RIDES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsData();
  }, []);

  const updateBookingStatus = async (bookingId: string, status: 'confirmed' | 'rejected', isPassengerTab: boolean) => {
    try {
      await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (isPassengerTab) {
        setPassengerBookings(prev => 
          prev.map(b => b.id === bookingId ? { ...b, status } : b)
        );
      } else {
        setOfferedRides(prev => 
          prev.map(ride => ({
            ...ride,
            bookings: ride.bookings.map(b => b.id === bookingId ? { ...b, status } : b)
          }))
        );
      }
    } catch (err) {
      if (isPassengerTab) {
        setPassengerBookings(prev => 
          prev.map(b => b.id === bookingId ? { ...b, status } : b)
        );
      } else {
        setOfferedRides(prev => 
          prev.map(ride => ({
            ...ride,
            bookings: ride.bookings.map(b => b.id === bookingId ? { ...b, status } : b)
          }))
        );
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-1 mt-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">Ride Hub</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Manage bookings, coordination, and requests</p>
      </div>

      {/* Airbnb Segmented Tab Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner max-w-md mx-auto w-full">
        <button
          onClick={() => setActiveTab('passenger')}
          className={`flex-1 py-2 text-xs font-bold text-center rounded-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'passenger' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          My Bookings
        </button>
        <button
          onClick={() => setActiveTab('driver')}
          className={`flex-1 py-2 text-xs font-bold text-center rounded-lg transition-all duration-200 cursor-pointer ${
            activeTab === 'driver' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Offered Rides
        </button>
      </div>

      {/* Content Grid */}
      <div className="w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card-airbnb p-5 h-36 skeleton-premium" />
            ))}
          </div>
        ) : activeTab === 'passenger' ? (
          passengerBookings.length === 0 ? (
            <div className="border border-slate-200 p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-white shadow-sm max-w-md mx-auto">
              <Calendar className="w-8 h-8 text-slate-400" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">No Bookings</h3>
                <p className="text-xs text-slate-500 mt-1">You haven't requested any rides yet.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {passengerBookings.map((booking) => {
                const ride = booking.ride;
                if (!ride) return null;
                
                const statusStyles = {
                  pending: 'text-amber-700 border-amber-200 bg-amber-50',
                  confirmed: 'text-emerald-700 border-emerald-200 bg-emerald-50',
                  rejected: 'text-red-700 border-red-200 bg-red-50',
                  cancelled: 'text-slate-500 border-slate-200 bg-slate-100'
                };

                return (
                  <div key={booking.id} className="card-airbnb p-5 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 tracking-tight">
                            {ride.origin_city} <span className="text-blue-600">➔</span> {ride.destination_city}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                            {new Date(ride.departure_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider border px-2.5 py-0.5 rounded-full ${statusStyles[booking.status]}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-medium text-slate-600">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Driver:</span>
                          <span className="font-bold text-slate-800 ml-1.5">{ride.driver_name || 'Driver'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-blue-600 font-extrabold">{ride.price_per_seat * booking.seats_booked} MAD</span>
                          <span className="text-slate-400 text-[10px] font-semibold"> ({booking.seats_booked} seats)</span>
                        </div>
                      </div>
                    </div>

                    {booking.status === 'confirmed' && (
                      <Link 
                        href={`/chat/${booking.id}`}
                        className="w-full py-2.5 text-xs flex items-center justify-center gap-2 font-semibold btn-primary-blue rounded-xl shadow-sm transition-all mt-auto"
                      >
                        <MessageSquare className="w-4 h-4 text-white" />
                        Coordinate Pickup (Chat)
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          offeredRides.length === 0 ? (
            <div className="border border-slate-200 p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-3 bg-white shadow-sm max-w-md mx-auto">
              <Calendar className="w-8 h-8 text-slate-400" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">No Offered Rides</h3>
                <p className="text-xs text-slate-500 mt-1">You haven't offered any rides yet.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {offeredRides.map((ride) => (
                <div key={ride.id} className="card-airbnb p-5 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 tracking-tight">
                          {ride.origin_city} <span className="text-blue-600">➔</span> {ride.destination_city}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                          {new Date(ride.departure_time).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Seats Left: </span>
                        <span className="text-blue-600 font-extrabold">{ride.available_seats}</span>
                      </div>
                    </div>

                    {/* List requests for this ride */}
                    <div className="border-t border-slate-100 pt-3 flex flex-col gap-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Booking Requests</span>
                      
                      {ride.bookings.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No pending passenger requests.</span>
                      ) : (
                        ride.bookings.map((booking) => (
                          <div key={booking.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col gap-2 shadow-xs">
                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-slate-800">{booking.passenger_name || 'Passenger'}</span>
                                <span className="text-slate-500 font-normal"> wants {booking.seats_booked} seat(s)</span>
                              </div>
                              
                              {booking.status === 'pending' ? (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => updateBookingStatus(booking.id, 'rejected', false)}
                                    className="p-1.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Reject Request"
                                  >
                                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                  <button 
                                    onClick={() => updateBookingStatus(booking.id, 'confirmed', false)}
                                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                                    title="Approve Request"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                </div>
                              ) : (
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  booking.status === 'confirmed' 
                                    ? 'text-emerald-700 border-emerald-200 bg-emerald-50' 
                                    : 'text-red-700 border-red-200 bg-red-50'
                                }`}>
                                  {booking.status}
                                </span>
                              )}
                            </div>

                            {booking.status === 'confirmed' && (
                              <Link 
                                href={`/chat/${booking.id}`}
                                className="text-[11px] font-bold text-blue-600 flex items-center gap-1 hover:underline mt-0.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                                Open pickup chat
                              </Link>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
