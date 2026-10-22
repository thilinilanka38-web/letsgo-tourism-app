import React from 'react';
import { Destination } from '../types';
import { MapPin, Clock, Plus, Check, ExternalLink, Eye } from 'lucide-react';

interface DestinationCardProps {
  destination: Destination;
  isInQueue: boolean;
  onToggleQueue: (dest: Destination) => void;
  onViewDetails: (dest: Destination) => void;
  onViewOnMap: (dest: Destination) => void;
  queueOrder?: number;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  isInQueue,
  onToggleQueue,
  onViewDetails,
  onViewOnMap,
  queueOrder,
}) => {
  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'Religious / Heritage':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cultural / Museum':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Restaurant / Cafe':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Waterfall / Natural':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Beach':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full">
      {/* Image Thumbnail with badges */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={destination.imageUrl}
          alt={destination.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm backdrop-blur-md ${getBadgeStyle(
              destination.categoryId
            )}`}
          >
            {destination.categoryId}
          </span>
        </div>

        {queueOrder !== undefined && (
          <div className="absolute top-3 right-3 bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <span>Stop #{queueOrder}</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="flex items-center gap-1 font-medium bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            {destination.distanceFromMadakumburaKm} km away
          </span>
          <span className="flex items-center gap-1 font-medium bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            {destination.recommendedStayMinutes} min stay
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 text-base mb-1.5 line-clamp-1 group-hover:text-sky-600 transition-colors">
          {destination.name}
        </h3>

        <p className="text-slate-600 text-xs line-clamp-2 mb-3 flex-1 leading-relaxed">
          {destination.description}
        </p>

        <div className="text-[11px] text-slate-500 mb-3 space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-600">Hours:</span>
            <span>{destination.operatingHours}</span>
          </div>
          {destination.address && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-600">Location:</span>
              <span className="truncate max-w-[170px] text-right">{destination.address}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-auto">
          <button
            onClick={() => onToggleQueue(destination)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              isInQueue
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                : 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm'
            }`}
          >
            {isInQueue ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Added to Plan</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Plan</span>
              </>
            )}
          </button>

          <button
            onClick={() => onViewDetails(destination)}
            title="View Details"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => onViewOnMap(destination)}
            title="Focus on Map"
            className="p-2 text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
