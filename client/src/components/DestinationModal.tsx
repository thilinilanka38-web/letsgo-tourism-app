import React from 'react';
import { Destination } from '../types';
import { X, MapPin, Clock, Compass, Phone, Navigation, Check, Plus } from 'lucide-react';
import { MADAKUMBURA_CENTER } from '../utils/haversine';

interface DestinationModalProps {
  destination: Destination | null;
  onClose: () => void;
  isInQueue: boolean;
  onToggleQueue: (dest: Destination) => void;
}

export const DestinationModal: React.FC<DestinationModalProps> = ({
  destination,
  onClose,
  isInQueue,
  onToggleQueue,
}) => {
  if (!destination) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Image */}
        <div className="relative h-64 w-full bg-slate-100 shrink-0">
          <img
            src={destination.imageUrl}
            alt={destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white mb-2">
              {destination.categoryId}
            </span>
            <h2 className="text-2xl font-bold">{destination.name}</h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              About Destination
            </h4>
            <p className="text-slate-700 leading-relaxed text-sm">
              {destination.description}
            </p>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Distance from Center</div>
                <div className="text-slate-600">
                  {destination.distanceFromMadakumburaKm} km (within 25km radius)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Operating Hours</div>
                <div className="text-slate-600">{destination.operatingHours}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Spatial Coordinates</div>
                <div className="text-slate-600">
                  {destination.latitude.toFixed(4)}° N, {destination.longitude.toFixed(4)}° E
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-900">Recommended Visit Time</div>
                <div className="text-slate-600">
                  {destination.recommendedStayMinutes} minutes (~{(destination.recommendedStayMinutes / 60).toFixed(1)} hrs)
                </div>
              </div>
            </div>
          </div>

          {destination.address && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-800">Physical Address: </span>
              {destination.address}
              {destination.contactNumber && (
                <div className="mt-1 flex items-center gap-1.5 text-sky-700">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{destination.contactNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => onToggleQueue(destination)}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                isInQueue
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  : 'bg-sky-600 text-white hover:bg-sky-700 shadow-md shadow-sky-600/20'
              }`}
            >
              {isInQueue ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Remove from Itinerary Queue</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to 1-Day Itinerary Queue</span>
                </>
              )}
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl font-semibold text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-2 transition-colors"
            >
              <Navigation className="w-4 h-4 text-sky-600" />
              <span>External GPS Route</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
