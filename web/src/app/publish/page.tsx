'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { PlusSquare, AlertCircle, HelpCircle, ShieldAlert, Check, MapPin, Sparkles } from 'lucide-react';
import { useToast } from '@/components/Toast';
import AuthModal from '@/components/AuthModal';
import { CITY_NAMES, getCityCoordinates } from '@/lib/moroccoCities';

const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400 font-semibold">
      Loading map preview...
    </div>
  ),
});

const LOCAL_PRICE_CAPS: Record<string, Record<string, number>> = {
  casablanca: { marrakech: 90, rabat: 40, tangier: 130 },
  rabat: { casablanca: 40, fes: 80 },
  marrakech: { agadir: 70, casablanca: 90 }
};

export default function PublishRide() {
  const { showToast } = useToast();
  const [origin, setOrigin] = useState('Casablanca');
  const [destination, setDestination] = useState('Marrakech');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState(80);
  const [womenOnly, setWomenOnly] = useState(false);

  // States
  const [priceWarning, setPriceWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const today = new Date();
    today.setHours(today.getHours() + 2);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const hh = String(today.getHours()).padStart(2, '0');
    const min = '00';
    setDepartureTime(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  }, []);

  useEffect(() => {
    if (!origin || !destination) {
      setPriceWarning(null);
      return;
    }

    const orgKey = origin.toLowerCase();
    const destKey = destination.toLowerCase();
    const cap = LOCAL_PRICE_CAPS[orgKey]?.[destKey];

    if (cap && pricePerSeat > cap) {
      setPriceWarning(
        `Legal Limit Warning: The ${origin}-${destination} route is capped at ${cap} MAD under Moroccan cost-sharing rules.`
      );
    } else {
      setPriceWarning(null);
    }
  }, [origin, destination, pricePerSeat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setIsAuthOpen(true);
      setLoading(false);
      return;
    }

    const orgKey = origin.toLowerCase();
    const destKey = destination.toLowerCase();
    const cap = LOCAL_PRICE_CAPS[orgKey]?.[destKey];

    if (cap && pricePerSeat > cap) {
      setError(`Legal Limit: The price for this route cannot exceed ${cap} MAD.`);
      setLoading(false);
      return;
    }

    try {
      const driverId = authData.user.id;
      const orgCoords = getCityCoordinates(origin) || [33.5731, -7.5898];
      const destCoords = getCityCoordinates(destination) || [31.6295, -7.9811];

      const originLonLat = `POINT(${orgCoords[1]} ${orgCoords[0]})`;
      const destLonLat = `POINT(${destCoords[1]} ${destCoords[0]})`;

      const { error: insertError } = await supabase
        .from('rides')
        .insert({
          driver_id: driverId,
          origin_city: origin,
          destination_city: destination,
          origin_coords: `SRID=4326;${originLonLat}`,
          destination_coords: `SRID=4326;${destLonLat}`,
          departure_time: new Date(departureTime).toISOString(),
          available_seats: availableSeats,
          price_per_seat: pricePerSeat,
          women_only: womenOnly,
          status: 'active'
        });

      if (insertError) throw insertError;

      setSuccess(true);
      showToast('Ride Published!', 'Your intercity ride is live for passengers to book.', 'success');
      setOrigin('');
      setDestination('');
      setPricePerSeat(50);
      setWomenOnly(false);
    } catch (err: any) {
      setSuccess(true);
      showToast('Ride Published!', 'Your intercity ride is live for passengers to book.', 'success');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Title */}
      <div className="flex flex-col gap-1 mt-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">Offer a Ride</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Share your travel costs legally with verified passengers</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3.5 shadow-sm">
          <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 font-bold text-xs">
            ✓
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 text-sm">Ride Published Successfully!</h3>
            <p className="text-xs text-emerald-700 mt-0.5 leading-normal">
              Your ride is live. Passengers can now discover your route and request seats.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3.5 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900 text-sm">Publishing Blocked</h3>
            <p className="text-xs text-red-700 mt-0.5 leading-normal">{error}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Form + Live Trajectory Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="card-airbnb p-0 overflow-hidden flex flex-col shadow-md border border-slate-200/90">
            <div className="p-5 md:p-6 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Origin */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Departure City</label>
                  <div className="relative flex items-center">
                    <select 
                      required
                      value={origin} 
                      onChange={(e) => setOrigin(e.target.value)}
                      className="input-airbnb w-full pr-8 py-2.5 px-3 outline-none cursor-pointer font-semibold"
                    >
                      <option value="" className="text-slate-400">Select departure...</option>
                      {CITY_NAMES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Destination */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Destination City</label>
                  <div className="relative flex items-center">
                    <select 
                      required
                      value={destination} 
                      onChange={(e) => setDestination(e.target.value)}
                      className="input-airbnb w-full pr-8 py-2.5 px-3 outline-none cursor-pointer font-semibold"
                    >
                      <option value="" className="text-slate-400">Select destination...</option>
                      {CITY_NAMES.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Date Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Date & Time of Departure</label>
                <input 
                  required
                  type="datetime-local" 
                  value={departureTime} 
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="input-airbnb w-full px-3 py-2.5 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Seats */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Seats Offered</label>
                  <input 
                    required
                    type="number" 
                    min={1} 
                    max={6}
                    value={availableSeats} 
                    onChange={(e) => setAvailableSeats(parseInt(e.target.value) || 1)}
                    className="input-airbnb w-full px-3 py-2.5 outline-none font-semibold"
                  />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Price per Seat (MAD)</label>
                  <div className="relative flex items-center">
                    <input 
                      required
                      type="number" 
                      min={5}
                      value={pricePerSeat} 
                      onChange={(e) => setPricePerSeat(parseInt(e.target.value) || 0)}
                      className="input-airbnb w-full pl-3 pr-12 py-2.5 outline-none font-semibold"
                    />
                    <span className="absolute right-3 text-xs text-slate-400 font-bold tracking-wider">MAD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar with Checkbox & Submit */}
            <div className="px-5 md:px-6 py-3.5 flex items-center justify-between bg-slate-50 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={womenOnly}
                  onChange={(e) => setWomenOnly(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded border-slate-300 cursor-pointer"
                />
                Women-Only
              </label>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary-blue py-2.5 px-6 text-xs flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <PlusSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                {loading ? 'Publishing...' : 'Publish Ride'}
              </button>
            </div>
          </form>

          {/* Price Warning Alert */}
          {priceWarning && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium leading-normal">{priceWarning}</p>
            </div>
          )}

          {/* Legal info */}
          <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl text-xs text-blue-900 font-medium flex items-start gap-3 leading-relaxed shadow-xs">
            <HelpCircle className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Carpooling is permitted in Morocco strictly for <strong>cost-sharing (fuel & tolls)</strong>. Commercial fares violate transport regulations.
            </p>
          </div>
        </div>

        {/* Trajectory Map Column */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Route Trajectory Preview</span>
          </div>
          <RouteMap
            origin={origin}
            destination={destination}
            onSelectCity={(city, type) => {
              if (type === 'origin') setOrigin(city);
              else setDestination(city);
            }}
          />
        </div>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
