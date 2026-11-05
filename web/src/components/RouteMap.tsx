'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MOROCCAN_CITIES, getCityCoordinates, fetchOSRMRoute, RouteGeometryInfo } from '@/lib/moroccoCities';
import { Navigation2, Clock, Route as RouteIcon, Sparkles, MapPin, Maximize2, Minimize2 } from 'lucide-react';

interface RouteMapProps {
  origin: string;
  destination: string;
  onSelectCity?: (city: string, type: 'origin' | 'destination') => void;
  interactive?: boolean;
}

export default function RouteMap({
  origin,
  destination,
  onSelectCity,
  interactive = true,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);

  const [routeInfo, setRouteInfo] = useState<RouteGeometryInfo | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        // Default center on Morocco (between Casablanca and Marrakech)
        const map = L.map(mapContainerRef.current, {
          center: [31.7917, -7.0926],
          zoom: 6,
          zoomControl: false,
          attributionControl: false,
        });

        // Add subtle CartoDB Voyager tiles (modern, clean, elegant)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        // Add zoom control top-right
        L.control.zoom({ position: 'topright' }).addTo(map);

        const layersGroup = L.layerGroup().addTo(map);
        layersGroupRef.current = layersGroup;
        mapInstanceRef.current = map;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Trajectory / Markers whenever origin or destination changes
  useEffect(() => {
    async function updateTrajectory() {
      if (!mapInstanceRef.current) return;
      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      if (!layersGroupRef.current) {
        layersGroupRef.current = L.layerGroup().addTo(map);
      }
      const group = layersGroupRef.current;
      group.clearLayers();

      const originCoords = getCityCoordinates(origin);
      const destCoords = getCityCoordinates(destination);

      // Custom DivIcons
      const createCityIcon = (cityName: string, isOrigin: boolean, isDest: boolean) => {
        let bgClass = 'bg-white border-slate-300 text-slate-700 shadow-sm';
        let dotClass = 'bg-slate-400';
        let ringEffect = '';

        if (isOrigin) {
          bgClass = 'bg-blue-600 border-blue-700 text-white shadow-lg ring-4 ring-blue-500/20';
          dotClass = 'bg-white';
          ringEffect = '<span class="absolute -inset-1 rounded-full animate-ping bg-blue-400 opacity-40"></span>';
        } else if (isDest) {
          bgClass = 'bg-emerald-600 border-emerald-700 text-white shadow-lg ring-4 ring-emerald-500/20';
          dotClass = 'bg-white';
          ringEffect = '<span class="absolute -inset-1 rounded-full animate-ping bg-emerald-400 opacity-40"></span>';
        }

        return L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div class="relative flex flex-col items-center group cursor-pointer select-none">
              ${ringEffect}
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight border transition-all duration-300 ${bgClass}">
                <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
                <span>${cityName}</span>
              </div>
              <div class="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-0.5 opacity-60"></div>
            </div>
          `,
          iconSize: [100, 30],
          iconAnchor: [50, 28],
        });
      };

      // 1. Both Origin & Destination Selected: Draw Dynamic Trajectory
      if (originCoords && destCoords) {
        setLoadingRoute(true);
        const routeData = await fetchOSRMRoute(originCoords, destCoords);
        setRouteInfo(routeData);
        setLoadingRoute(false);

        // Glow line under trajectory
        const glowLine = L.polyline(routeData.coordinates, {
          color: '#3b82f6',
          weight: 10,
          opacity: 0.25,
          lineCap: 'round',
          lineJoin: 'round',
        });
        group.addLayer(glowLine);

        // Main Route Trajectory (Solid Blue)
        const mainLine = L.polyline(routeData.coordinates, {
          color: '#2563eb',
          weight: 4.5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        });
        group.addLayer(mainLine);

        // Trajectory animated dash line
        const dashLine = L.polyline(routeData.coordinates, {
          color: '#93c5fd',
          weight: 2,
          opacity: 0.85,
          dashArray: '8, 12',
          dashOffset: '0',
          lineCap: 'round',
        });
        group.addLayer(dashLine);

        // Add Origin Marker
        const originMarker = L.marker(originCoords, {
          icon: createCityIcon(origin, true, false),
          zIndexOffset: 1000,
        });
        originMarker.on('click', () => onSelectCity && onSelectCity(origin, 'origin'));
        group.addLayer(originMarker);

        // Add Destination Marker
        const destMarker = L.marker(destCoords, {
          icon: createCityIcon(destination, false, true),
          zIndexOffset: 1000,
        });
        destMarker.on('click', () => onSelectCity && onSelectCity(destination, 'destination'));
        group.addLayer(destMarker);

        // Fit map bounds smoothly to include the full trajectory
        const bounds = L.latLngBounds(routeData.coordinates);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 11,
          animate: true,
          duration: 1,
        });
      } else {
        setRouteInfo(null);
        setLoadingRoute(false);

        // 2. Either Origin or Destination or Default Overview
        MOROCCAN_CITIES.forEach((city) => {
          const isOrigin = city.name.toLowerCase() === origin.toLowerCase();
          const isDest = city.name.toLowerCase() === destination.toLowerCase();

          // Only render major hubs unless focused
          const marker = L.marker([city.lat, city.lng], {
            icon: createCityIcon(city.name, isOrigin, isDest),
            zIndexOffset: isOrigin || isDest ? 1000 : 100,
          });

          marker.on('click', () => {
            if (!onSelectCity) return;
            if (!origin) {
              onSelectCity(city.name, 'origin');
            } else if (!destination && city.name.toLowerCase() !== origin.toLowerCase()) {
              onSelectCity(city.name, 'destination');
            } else {
              onSelectCity(city.name, 'origin');
            }
          });

          group.addLayer(marker);
        });

        if (originCoords) {
          map.flyTo(originCoords, 8, { duration: 1 });
        } else if (destCoords) {
          map.flyTo(destCoords, 8, { duration: 1 });
        } else {
          map.flyTo([32.2, -6.8], 6, { duration: 1 });
        }
      }
    }

    const timer = setTimeout(() => {
      updateTrajectory();
    }, 150);

    return () => clearTimeout(timer);
  }, [origin, destination]);

  // Handle Resize / Fullscreen toggle
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 300);
    }
  }, [isExpanded]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-sm transition-all duration-300 ${
        isExpanded ? 'h-[460px] md:h-[540px]' : 'h-[240px] sm:h-[280px] md:h-[320px]'
      }`}
    >
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Overlay Badge / Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2">
        {/* Dynamic Trajectory Summary Card */}
        {origin && destination && routeInfo ? (
          <div className="pointer-events-auto flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md animate-fade-in text-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <RouteIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                <span>{origin}</span>
                <span className="text-blue-600">➔</span>
                <span>{destination}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <Navigation2 className="w-3 h-3 text-blue-600 fill-blue-600" />
                  {routeInfo.distanceKm} km
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  ~{Math.floor(routeInfo.durationMinutes / 60)}h {routeInfo.durationMinutes % 60}m
                </span>
              </div>
            </div>
          </div>
        ) : origin ? (
          <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Leaving from <strong className="text-blue-600 font-bold">{origin}</strong>. Pick a destination!</span>
          </div>
        ) : (
          <div className="pointer-events-auto hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Click any city or choose from the search bar to preview route</span>
          </div>
        )}

        {/* Expand / Minimize Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="pointer-events-auto ml-auto bg-white/95 hover:bg-white text-slate-700 p-2 rounded-xl border border-slate-200 shadow-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          title={isExpanded ? 'Collapse map' : 'Expand map'}
        >
          {isExpanded ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Minimize</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expand Map</span>
            </>
          )}
        </button>
      </div>

      {/* Loading Overlay */}
      {loadingRoute && (
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 px-4 py-2 rounded-full border border-slate-200 shadow-lg flex items-center gap-2 text-xs font-bold text-blue-600">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Calculating optimal trajectory...</span>
          </div>
        </div>
      )}

      {/* Quick Interactive Map Badge Bottom-Right */}
      <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200/80 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          Interactive Trajectory
        </div>
      </div>
    </div>
  );
}
