import React, { useState } from 'react';
import { Destination, Itinerary } from '../types';
import {
  sequenceNearestNeighbor,
  buildItinerarySchedule,
  MADAKUMBURA_CENTER,
} from '../utils/haversine';
import {
  Calendar,
  Clock,
  Compass,
  AlertCircle,
  Trash2,
  Sparkles,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Share2,
  Printer,
  RotateCcw,
} from 'lucide-react';

interface ItineraryPlannerProps {
  planQueue: Destination[];
  onRemoveFromQueue: (destId: string) => void;
  onClearQueue: () => void;
  currentItinerary: Itinerary | null;
  onItineraryGenerated: (itinerary: Itinerary | null) => void;
  onFocusOnMap: () => void;
}

export const ItineraryPlanner: React.FC<ItineraryPlannerProps> = ({
  planQueue,
  onRemoveFromQueue,
  onClearQueue,
  currentItinerary,
  onItineraryGenerated,
  onFocusOnMap,
}) => {
  const [startTime, setStartTime] = useState<string>('08:30 AM');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Generate Itinerary using Nearest-Neighbor + Haversine (REQ-10, REQ-11, REQ-12, REQ-13)
  const handleGenerateItinerary = () => {
    // REQ-13 Validation: Minimum 2 destinations, Maximum 6
    if (planQueue.length < 2) {
      setErrorMessage(
        'Please select at least 2 destinations to construct an optimized one-day itinerary. Current queue has ' +
          planQueue.length +
          '.'
      );
      return;
    }

    if (planQueue.length > 6) {
      setErrorMessage(
        'Maximum 6 destinations allowed per single-day plan (REQ-10) to ensure realistic travel and visiting hours. Please remove ' +
          (planQueue.length - 6) +
          ' spot(s).'
      );
      return;
    }

    setErrorMessage(null);
    setIsCalculating(true);

    try {
      // Step 1: Evaluate spatial proximity & sequence stops using Nearest-Neighbor algorithm
      const ordered = sequenceNearestNeighbor(planQueue, MADAKUMBURA_CENTER);

      // Step 2: Build chronological time-sequenced schedule
      const itinerary = buildItinerarySchedule(
        ordered,
        startTime,
        MADAKUMBURA_CENTER
      );

      onItineraryGenerated(itinerary);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        'Failed to compute optimal trajectory. Please verify coordinate data.'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>Automated Spatial TSP Algorithm (Nearest-Neighbor & Haversine)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            1-Day Itinerary Optimizer
          </h2>
          <p className="text-sky-100/90 text-sm mt-2 leading-relaxed">
            Select 2 to 6 destinations within the 25 km Madakumbura radius. The
            system calculates pairwise Haversine distances and sequences your day
            chronologically to minimize travel fatigue and road mileage.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <MapPin className="w-4 h-4 text-sky-300" />
              <span>Base Hub: Madakumbura Center</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>Constraint: 2 - 6 Spots / Day</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Avg Speed: 30 km/h (Local Roads)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue on Left, Schedule on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Plan Queue & Generation Settings (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>Selected Destinations Queue</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      planQueue.length >= 2 && planQueue.length <= 6
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {planQueue.length} / 6
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Minimum 2, maximum 6 destinations required.
                </p>
              </div>

              {planQueue.length > 0 && (
                <button
                  onClick={onClearQueue}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Error / Validation Alert (REQ-13) */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Queue List */}
            {planQueue.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl px-4">
                <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-700">
                  Your planning queue is empty
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Browse destinations from the Explorer or Map and click &quot;+ Add to Plan&quot;.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {planQueue.map((dest, idx) => (
                  <div
                    key={dest.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center gap-3 transition-colors"
                  >
                    <img
                      src={dest.imageUrl}
                      alt={dest.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 truncate">
                        {dest.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{dest.categoryId.split('/')[0]}</span>
                        <span>•</span>
                        <span>{dest.distanceFromMadakumburaKm} km</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveFromQueue(dest.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Settings & Generate Button */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Day Trip Departure Time:
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="07:30 AM">07:30 AM (Early Bird)</option>
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="08:30 AM">08:30 AM (Recommended)</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                </select>
              </div>

              <button
                onClick={handleGenerateItinerary}
                disabled={isCalculating || planQueue.length < 2 || planQueue.length > 6}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  planQueue.length >= 2 && planQueue.length <= 6
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isCalculating ? (
                  <span>Computing Nearest-Neighbor Path...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Optimized Itinerary</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Generated Itinerary Timetable (8 Cols) */}
        <div className="lg:col-span-8">
          {!currentItinerary ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">
                No Itinerary Generated Yet
              </h3>
              <p className="text-slate-500 text-xs max-w-md leading-relaxed mb-6">
                Add at least 2 attractions to your queue on the left and click
                &quot;Generate Optimized Itinerary&quot; to see your time-sequenced travel
                schedule and mileage breakdown.
              </p>
              <div className="flex items-center gap-2 text-xs text-sky-700 bg-sky-50 px-3.5 py-2 rounded-xl">
                <span>Tip: You can re-optimize any time by changing your departure time or queue spots.</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              {/* Itinerary Summary Metrics Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">
                      Trip Overview ({currentItinerary.stops.length} Waypoints)
                    </div>
                    <div className="text-lg font-bold">
                      {currentItinerary.startTime} → {currentItinerary.endTime}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs divide-x divide-slate-800">
                  <div className="pl-4">
                    <div className="text-slate-400">Total Travel Trajectory</div>
                    <div className="text-base font-bold text-sky-400">
                      {currentItinerary.totalDistanceKm} km
                    </div>
                  </div>
                  <div className="pl-4">
                    <div className="text-slate-400">Road Travel Time</div>
                    <div className="text-base font-bold text-amber-400">
                      {currentItinerary.totalTravelMinutes} mins
                    </div>
                  </div>
                  <div className="pl-4">
                    <div className="text-slate-400">Total Tour Span</div>
                    <div className="text-base font-bold text-emerald-400">
                      ~{currentItinerary.totalVisitHours} hrs
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onFocusOnMap}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>View Path on Map</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="Print Itinerary"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chronological Timeline Stops (REQ-12) */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Starting Reference Point */}
                <div className="relative flex items-start gap-4">
                  <div className="absolute -left-6 mt-1 w-6 h-6 rounded-full bg-slate-900 border-4 border-white shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                    S
                  </div>
                  <div className="flex-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                    <div className="font-bold text-slate-900">
                      Start at {currentItinerary.startLocation.name}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Depart promptly at {currentItinerary.startTime} • Coordinates: 6.2300° N, 80.0500° E
                    </div>
                  </div>
                </div>

                {/* Ordered Stops */}
                {currentItinerary.stops.map((stop, idx) => (
                  <div key={stop.destination.id} className="relative flex items-start gap-4">
                    {/* Leg indicator */}
                    <div className="absolute -left-6 mt-1 w-6 h-6 rounded-full bg-emerald-600 border-4 border-white shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                      {stop.order}
                    </div>

                    <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      {/* Transit Leg Info */}
                      <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-100 text-slate-500">
                        <span className="flex items-center gap-1 text-sky-700 font-medium">
                          <ArrowRight className="w-3.5 h-3.5 text-sky-500" />
                          Leg {stop.order}: Travel {stop.legDistanceKm} km (~{stop.travelMinutes} mins drive)
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          Arrive: {stop.arrivalTime}
                        </span>
                      </div>

                      {/* Destination Details */}
                      <div className="flex items-start gap-3">
                        <img
                          src={stop.destination.imageUrl}
                          alt={stop.destination.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              {stop.destination.categoryId}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">
                            {stop.destination.name}
                          </h4>
                          <p className="text-slate-600 text-xs line-clamp-1 mt-0.5">
                            {stop.destination.description}
                          </p>
                        </div>
                      </div>

                      {/* Stay & Departure Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Operating Hours</span>
                          <span className="font-medium text-slate-800 text-[11px]">
                            {stop.destination.operatingHours}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Recommended Stay</span>
                          <span className="font-medium text-slate-800 text-[11px]">
                            {stop.stayMinutes} mins
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Depart For Next Stop</span>
                          <span className="font-bold text-emerald-700 text-[11px]">
                            {stop.departureTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
