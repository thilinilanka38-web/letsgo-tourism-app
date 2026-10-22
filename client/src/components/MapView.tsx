import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Destination, Itinerary } from '../types';
import { MADAKUMBURA_CENTER } from '../utils/haversine';
import { Navigation, ZoomIn, ZoomOut, RotateCcw, MapPin, Compass } from 'lucide-react';

interface MapViewProps {
  destinations: Destination[];
  selectedDestination: Destination | null;
  onSelectDestination: (dest: Destination) => void;
  planQueue: Destination[];
  onToggleQueue: (dest: Destination) => void;
  currentItinerary: Itinerary | null;
}

export const MapView: React.FC<MapViewProps> = ({
  destinations,
  selectedDestination,
  onSelectDestination,
  planQueue,
  onToggleQueue,
  currentItinerary,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const centerCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [MADAKUMBURA_CENTER.latitude, MADAKUMBURA_CENTER.longitude],
      zoom: 11,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // 25 km Operational Radius Circle (SRS Section 1.4 & BR-001)
    const circle = L.circle(
      [MADAKUMBURA_CENTER.latitude, MADAKUMBURA_CENTER.longitude],
      {
        radius: MADAKUMBURA_CENTER.radiusKm * 1000,
        color: '#0ea5e9',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#38bdf8',
        fillOpacity: 0.05,
      }
    ).addTo(map);

    // Madakumbura Center Pin
    const centerIcon = L.divIcon({
      className: 'custom-center-marker',
      html: `
        <div style="background-color: #0f172a; color: white; border: 2px solid #38bdf8; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          📍
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    L.marker([MADAKUMBURA_CENTER.latitude, MADAKUMBURA_CENTER.longitude], {
      icon: centerIcon,
    })
      .bindPopup(`
        <div style="font-family: sans-serif; padding: 4px;">
          <div style="font-size: 12px; font-weight: bold; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em;">Center Reference</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${MADAKUMBURA_CENTER.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">25 km operational radius reference point</div>
          <div style="font-size: 11px; color: #0284c7; margin-top: 4px; font-weight: 500;">Coordinates: 6.2300° N, 80.0500° E</div>
        </div>
      `)
      .addTo(map);

    const markersGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersGroupRef.current = markersGroup;
    centerCircleRef.current = circle;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Color mapper for categories
    const getCategoryColor = (cat: string) => {
      switch (cat) {
        case 'Religious / Heritage':
          return '#d97706'; // amber-600
        case 'Cultural / Museum':
          return '#059669'; // emerald-600
        case 'Restaurant / Cafe':
          return '#e11d48'; // rose-600
        case 'Waterfall / Natural':
          return '#0d9488'; // teal-600
        case 'Beach':
          return '#2563eb'; // blue-600
        default:
          return '#4f46e5';
      }
    };

    // Plot destination pins
    destinations.forEach((dest) => {
      // Validate coordinates (REQ-9 Error handling)
      if (
        typeof dest.latitude !== 'number' ||
        typeof dest.longitude !== 'number' ||
        isNaN(dest.latitude) ||
        isNaN(dest.longitude)
      ) {
        console.warn('Skipping invalid coordinates for destination:', dest.name);
        return;
      }

      const isInQueue = planQueue.some((q) => q.id === dest.id);
      const isSelected = selectedDestination?.id === dest.id;

      // Check if this destination is part of the ordered itinerary
      const itineraryIndex = currentItinerary?.stops.findIndex(
        (s) => s.destination.id === dest.id
      );
      const hasOrder = itineraryIndex !== undefined && itineraryIndex !== -1;
      const orderNumber = hasOrder ? itineraryIndex + 1 : null;

      const markerColor = getCategoryColor(dest.categoryId);

      const markerHtml = `
        <div style="position: relative; cursor: pointer; transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; transition: transform 0.2s;">
          <div style="
            background-color: ${hasOrder ? '#059669' : isInQueue ? '#2563eb' : markerColor};
            color: white;
            border: 2px solid white;
            border-radius: 9999px;
            width: ${hasOrder ? '36px' : '30px'};
            height: ${hasOrder ? '36px' : '30px'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${hasOrder ? '14px' : '12px'};
            font-weight: 700;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          ">
            ${hasOrder ? `#${orderNumber}` : isInQueue ? '✓' : '📍'}
          </div>
          ${
            isInQueue && !hasOrder
              ? `<span style="position: absolute; top: -4px; right: -4px; width: 10px; height: 10px; background-color: #ef4444; border-radius: 50%; border: 1.5px solid white;"></span>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([dest.latitude, dest.longitude], {
        icon: customIcon,
      });

      const popupContent = `
        <div style="width: 240px; font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; color: #1e293b;">
          <img src="${dest.imageUrl}" alt="${dest.name}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
          <div style="font-size: 10px; font-weight: 700; color: ${markerColor}; text-transform: uppercase; margin-bottom: 2px;">
            ${dest.categoryId}
          </div>
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #0f172a;">${dest.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            ⏱ Hours: ${dest.operatingHours}<br/>
            📍 ${dest.distanceFromMadakumburaKm} km from Madakumbura
          </div>
          <p style="font-size: 11px; color: #475569; margin: 0 0 10px 0; max-height: 50px; overflow: hidden; text-overflow: ellipsis;">
            ${dest.description.substring(0, 90)}...
          </p>
          <div style="display: flex; gap: 6px;">
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${dest.latitude},${dest.longitude}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="flex: 1; text-align: center; background-color: #f1f5f9; color: #0f172a; padding: 6px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 600; border: 1px solid #e2e8f0; display: inline-block;"
            >
              Directions ↗
            </a>
            <button 
              id="btn-queue-${dest.id}" 
              style="flex: 1; background-color: ${isInQueue ? '#fee2e2' : '#e0f2fe'}; color: ${isInQueue ? '#991b1b' : '#0369a1'}; padding: 6px; border-radius: 6px; border: none; font-size: 11px; font-weight: 600; cursor: pointer;"
            >
              ${isInQueue ? 'Remove Plan' : '+ Add Plan'}
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-queue-${dest.id}`);
        if (btn) {
          btn.onclick = () => {
            onToggleQueue(dest);
            marker.closePopup();
          };
        }
      });

      marker.on('click', () => {
        onSelectDestination(dest);
      });

      marker.addTo(markersGroup);
    });

    // Draw Route Polyline if Itinerary exists
    if (currentItinerary && currentItinerary.stops.length >= 2) {
      const latlngs: L.LatLngExpression[] = [
        [
          currentItinerary.startLocation.latitude,
          currentItinerary.startLocation.longitude,
        ],
        ...currentItinerary.stops.map(
          (s) =>
            [s.destination.latitude, s.destination.longitude] as [
              number,
              number,
            ]
        ),
      ];

      const polyline = L.polyline(latlngs, {
        color: '#059669',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      routeLayerRef.current = polyline;

      // Fit map to show all itinerary points nicely
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }
  }, [
    destinations,
    selectedDestination,
    planQueue,
    currentItinerary,
    onSelectDestination,
    onToggleQueue,
  ]);

  // Map Controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    mapInstanceRef.current?.setView(
      [MADAKUMBURA_CENTER.latitude, MADAKUMBURA_CENTER.longitude],
      11
    );
  };
  const handleFitAll = () => {
    if (destinations.length === 0 || !mapInstanceRef.current) return;
    const bounds = L.latLngBounds(
      destinations.map((d) => [d.latitude, d.longitude])
    );
    bounds.extend([MADAKUMBURA_CENTER.latitude, MADAKUMBURA_CENTER.longitude]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
  };

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2.5 bg-white/90 backdrop-blur-md text-slate-700 hover:text-slate-900 rounded-xl shadow-md border border-slate-200 transition-all hover:bg-white"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2.5 bg-white/90 backdrop-blur-md text-slate-700 hover:text-slate-900 rounded-xl shadow-md border border-slate-200 transition-all hover:bg-white"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Center on Madakumbura"
          className="p-2.5 bg-white/90 backdrop-blur-md text-sky-600 hover:text-sky-700 rounded-xl shadow-md border border-slate-200 transition-all hover:bg-white"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitAll}
          title="Fit All Locations"
          className="p-2.5 bg-white/90 backdrop-blur-md text-emerald-600 hover:text-emerald-700 rounded-xl shadow-md border border-slate-200 transition-all hover:bg-white"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200 text-xs text-slate-600 max-w-xs">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
          <MapPin className="w-3.5 h-3.5 text-sky-600" />
          <span>Madakumbura 25 km Operational Zone</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Religious / Temple</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Cultural / Museum</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Restaurant / Cafe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
            <span>Nature / Waterfall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Beach Coastline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>
            <span>Itinerary Stops (#)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
