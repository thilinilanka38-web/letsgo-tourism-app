import React, { useState } from 'react';
import { Destination, Itinerary, OptimizationMode } from '../types';
import {
  sequenceNearestNeighbor,
  sequenceSmartDaylight,
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
  Printer,
  ChevronUp,
  ChevronDown,
  Sun,
  Sunset,
  ShieldAlert,
  SlidersHorizontal,
  Compass as NavigationIcon,
} from 'lucide-react';

interface ItineraryPlannerProps {
  planQueue: Destination[];
  onReorderQueue?: (newQueue: Destination[]) => void;
  onRemoveFromQueue: (destId: string) => void;
  onClearQueue: () => void;
  currentItinerary: Itinerary | null;
  onItineraryGenerated: (itinerary: Itinerary | null) => void;
  onFocusOnMap: () => void;
}

export const ItineraryPlanner: React.FC<ItineraryPlannerProps> = ({
  planQueue,
  onReorderQueue,
  onRemoveFromQueue,
  onClearQueue,
  currentItinerary,
  onItineraryGenerated,
  onFocusOnMap,
}) => {
  const [startTime, setStartTime] = useState<string>('08:30 AM');
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>('smart-daylight');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Generate Itinerary using selected algorithm strategy
  const handleGenerateItinerary = (modeOverride?: OptimizationMode) => {
    const activeMode = modeOverride || optimizationMode;

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
      let ordered: Destination[];

      if (activeMode === 'smart-daylight') {
        // Smart Daylight & Practical Tour Optimizer
        ordered = sequenceSmartDaylight(planQueue, startTime, MADAKUMBURA_CENTER);
      } else if (activeMode === 'shortest-distance') {
        // Pure Spatial Nearest-Neighbor TSP
        ordered = sequenceNearestNeighbor(planQueue, MADAKUMBURA_CENTER);
      } else {
        // Manual custom order as arranged in the queue
        ordered = [...planQueue];
      }

      // Build chronological timetable
      const itinerary = buildItinerarySchedule(
        ordered,
        startTime,
        MADAKUMBURA_CENTER,
        activeMode
      );

      onItineraryGenerated(itinerary);

      // Synchronize the queue array order so user sees the exact sequence
      if (onReorderQueue && activeMode !== 'manual-custom') {
        onReorderQueue(ordered);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        'Failed to compute optimal trajectory. Please verify coordinate data.'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  // Reorder items in the Queue
  const handleMoveQueueItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === planQueue.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...planQueue];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    if (onReorderQueue) {
      onReorderQueue(updated);
    }

    setOptimizationMode('manual-custom');

    if (currentItinerary) {
      const itin = buildItinerarySchedule(
        updated,
        startTime,
        MADAKUMBURA_CENTER,
        'manual-custom'
      );
      onItineraryGenerated(itin);
    }
  };

  // Reorder stops directly from the timetable
  const handleMoveScheduleStop = (stopIndex: number, direction: 'up' | 'down') => {
    if (!currentItinerary) return;
    if (direction === 'up' && stopIndex === 0) return;
    if (direction === 'down' && stopIndex === currentItinerary.stops.length - 1) return;

    const targetIndex = direction === 'up' ? stopIndex - 1 : stopIndex + 1;
    const updated = currentItinerary.stops.map((s) => s.destination);
    const [moved] = updated.splice(stopIndex, 1);
    updated.splice(targetIndex, 0, moved);

    if (onReorderQueue) {
      onReorderQueue(updated);
    }

    setOptimizationMode('manual-custom');
    const itin = buildItinerarySchedule(
      updated,
      startTime,
      MADAKUMBURA_CENTER,
      'manual-custom'
    );
    onItineraryGenerated(itin);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to detect if a destination is a waterfall or nature spot
  const isWaterfallOrNature = (dest: Destination) => {
    return (
      dest.categoryId === 'Waterfall / Natural' ||
      /ella|waterfall|falls|forest|nature|safari|river/i.test(dest.name)
    );
  };

  // Helper to detect if a destination is a coastal beach
  const isBeach = (dest: Destination) => {
    return (
      dest.categoryId === 'Beach' ||
      /beach|coast|coral|marine|surf/i.test(dest.name)
    );
  };

  // Check if current generated itinerary has a late waterfall warning
  const hasLateWaterfallHazard = currentItinerary?.stops.some(
    (stop) =>
      isWaterfallOrNature(stop.destination) &&
      stop.daylightWarning &&
      stop.daylightWarning.includes('⚠️')
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-sky-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold mb-3">
            <Sun className="w-3.5 h-3.5 text-amber-300" />
            <span>Smart Daylight-Aware Tour Optimizer • Practical Real-World Travel</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            1-Day Itinerary Planner
          </h2>
          <p className="text-sky-100/90 text-sm mt-2 leading-relaxed">
            Select 2 to 6 destinations within the 25 km Madakumbura radius. The
            system optimizes your journey chronologically by balancing road distance
            with real-world daylight safety: ensuring waterfalls and nature trails are visited
            in bright daylight, and coastal beaches during golden-hour sunset.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <MapPin className="w-4 h-4 text-sky-300" />
              <span>Base Hub: Madakumbura Center</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Sun className="w-4 h-4 text-amber-300" />
              <span>Waterfalls: Morning Daylight</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Sunset className="w-4 h-4 text-rose-300" />
              <span>Beaches: Golden Hour Sunset</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Clock className="w-4 h-4 text-emerald-300" />
              <span>Avg Speed: 30 km/h (Local Roads)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue on Left, Schedule on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Plan Queue & Generation Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Selected Destinations</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      planQueue.length >= 2 && planQueue.length <= 6
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {planQueue.length} / 6
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Reorder using ▲ and ▼ arrows to customize visit sequence.
                </p>
              </div>

              {planQueue.length > 0 && (
                <button
                  onClick={onClearQueue}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Error / Validation Alert (REQ-13) */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Queue List with Move Up / Move Down */}
            {planQueue.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl px-4">
                <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-700">
                  Your planning queue is empty
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Browse destinations from the Explore Places or Map view and click &quot;+ Add to Plan&quot;.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {planQueue.map((dest, idx) => (
                  <div
                    key={dest.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200/90 flex items-center gap-2.5 transition-colors"
                  >
                    {/* Reorder Buttons (Move Up / Down) */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <button
                        onClick={() => handleMoveQueueItem(idx, 'up')}
                        disabled={idx === 0}
                        title="Move earlier in itinerary"
                        className={`p-1 rounded hover:bg-white transition-colors cursor-pointer ${
                          idx === 0
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:text-sky-600'
                        }`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <button
                        onClick={() => handleMoveQueueItem(idx, 'down')}
                        disabled={idx === planQueue.length - 1}
                        title="Move later in itinerary"
                        className={`p-1 rounded hover:bg-white transition-colors cursor-pointer ${
                          idx === planQueue.length - 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:text-sky-600'
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <img
                      src={dest.imageUrl}
                      alt={dest.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-slate-800 truncate">
                        {dest.name}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
                          {dest.categoryId.split('/')[0]}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {dest.distanceFromMadakumburaKm} km
                        </span>

                        {isWaterfallOrNature(dest) && (
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            ☀️ Daylight Safe
                          </span>
                        )}
                        {isBeach(dest) && (
                          <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            🌅 Sunset Spot
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveFromQueue(dest.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Algorithm Optimization Strategy Selector */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                  <span>Itinerary Sequencing Strategy:</span>
                </label>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOptimizationMode('smart-daylight');
                      if (planQueue.length >= 2) handleGenerateItinerary('smart-daylight');
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      optimizationMode === 'smart-daylight'
                        ? 'border-sky-500 bg-sky-50/80 text-sky-950 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Smart Daylight &amp; Safety (Recommended)</span>
                      </span>
                      {optimizationMode === 'smart-daylight' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Prioritizes waterfalls and inland nature in early daylight; schedules beaches &amp; viewpoints for sunset.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOptimizationMode('shortest-distance');
                      if (planQueue.length >= 2) handleGenerateItinerary('shortest-distance');
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      optimizationMode === 'shortest-distance'
                        ? 'border-sky-500 bg-sky-50/80 text-sky-950 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <NavigationIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Shortest Driving Route (Direct TSP)</span>
                      </span>
                      {optimizationMode === 'shortest-distance' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Pure geographic distance minimizer via Nearest-Neighbor algorithm.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOptimizationMode('manual-custom');
                      if (planQueue.length >= 2) handleGenerateItinerary('manual-custom');
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      optimizationMode === 'manual-custom'
                        ? 'border-sky-500 bg-sky-50/80 text-sky-950 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Custom Manual Order</span>
                      </span>
                      {optimizationMode === 'manual-custom' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Preserves your exact order arranged with the ▲ and ▼ buttons above.
                    </p>
                  </button>
                </div>
              </div>

              {/* Start Time Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trip Departure Time:
                </label>
                <select
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    if (currentItinerary) {
                      const updated = buildItinerarySchedule(
                        currentItinerary.stops.map((s) => s.destination),
                        e.target.value,
                        MADAKUMBURA_CENTER,
                        optimizationMode
                      );
                      onItineraryGenerated(updated);
                    }
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="07:30 AM">07:30 AM (Early Bird Departure)</option>
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="08:30 AM">08:30 AM (Recommended Departure)</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerateItinerary()}
                disabled={isCalculating || planQueue.length < 2 || planQueue.length > 6}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  planQueue.length >= 2 && planQueue.length <= 6
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/25 active:scale-[0.99]'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isCalculating ? (
                  <span>Computing Optimal Itinerary...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Optimized Itinerary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Practical Field Travel Advice Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Southern Province Daylight Guidance</span>
            </div>
            <p className="text-[11px] text-amber-900/90 leading-relaxed">
              In inland Southern Province (Elpitiya &amp; Madakumbura rainforest zones), daylight fades 30-40 minutes earlier under dense tree canopies. Visiting waterfalls after 4:30 PM poses slip and visibility risks. The <strong>Smart Daylight Optimizer</strong> automatically schedules waterfalls in the morning or early afternoon.
            </p>
          </div>
        </div>

        {/* Right Column: Generated Itinerary Timetable (7 Cols) */}
        <div className="lg:col-span-7">
          {!currentItinerary ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 mb-4 shadow-inner">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">
                No Itinerary Generated Yet
              </h3>
              <p className="text-slate-500 text-xs max-w-md leading-relaxed mb-6">
                Add 2 to 6 attractions to your queue on the left and click
                &quot;Generate Optimized Itinerary&quot; to review the daylight-balanced
                schedule, travel times, and driving distances.
              </p>
              <div className="flex items-center gap-2 text-xs text-sky-700 bg-sky-50 px-4 py-2.5 rounded-2xl border border-sky-100">
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Tip: Waterfalls will automatically be scheduled in safe morning daylight!</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-6">
              {/* Itinerary Summary Metrics Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                          {currentItinerary.optimizationMode === 'smart-daylight'
                            ? '☀️ Smart Daylight Route'
                            : currentItinerary.optimizationMode === 'manual-custom'
                            ? '✏️ Custom Sequence'
                            : '📍 Shortest Driving Path'}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                          {currentItinerary.stops.length} Stops
                        </span>
                      </div>
                      <div className="text-lg font-bold">
                        {currentItinerary.startTime} → {currentItinerary.endTime}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={onFocusOnMap}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View Map Route</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                      title="Print or Save PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-slate-800/60">
                    <div className="text-[10px] text-slate-400">Total Mileage</div>
                    <div className="text-sm sm:text-base font-bold text-sky-400">
                      {currentItinerary.totalDistanceKm} km
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/60">
                    <div className="text-[10px] text-slate-400">Road Drive Time</div>
                    <div className="text-sm sm:text-base font-bold text-amber-400">
                      {currentItinerary.totalTravelMinutes} mins
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/60">
                    <div className="text-[10px] text-slate-400">Total Tour Span</div>
                    <div className="text-sm sm:text-base font-bold text-emerald-400">
                      ~{currentItinerary.totalVisitHours} hrs
                    </div>
                  </div>
                </div>
              </div>

              {/* Late Waterfall Hazard Callout Banner if detected in manual mode */}
              {hasLateWaterfallHazard && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Daylight Safety Advisory</div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        One or more waterfalls or nature trails are currently scheduled in the late afternoon / dusk.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setOptimizationMode('smart-daylight');
                      handleGenerateItinerary('smart-daylight');
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs whitespace-nowrap shadow-xs cursor-pointer"
                  >
                    Switch to Smart Daylight
                  </button>
                </div>
              )}

              {/* Chronological Timeline Stops (REQ-12) */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Starting Reference Point */}
                <div className="relative flex items-start gap-4">
                  <div className="absolute -left-6 mt-1 w-6 h-6 rounded-full bg-slate-900 border-4 border-white shadow-sm flex items-center justify-center text-[10px] text-white font-bold">
                    S
                  </div>
                  <div className="flex-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
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

                    <div className="flex-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      {/* Transit Leg Info & Reorder Controls */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] pb-2 border-b border-slate-100 text-slate-500 gap-2">
                        <span className="flex items-center gap-1 text-sky-700 font-medium">
                          <ArrowRight className="w-3.5 h-3.5 text-sky-500" />
                          Leg {stop.order}: Drive {stop.legDistanceKm} km (~{stop.travelMinutes} mins)
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                            Arrive: {stop.arrivalTime}
                          </span>

                          {/* Quick Swap Buttons */}
                          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                            <button
                              onClick={() => handleMoveScheduleStop(idx, 'up')}
                              disabled={idx === 0}
                              title="Move this stop earlier"
                              className={`p-1 rounded cursor-pointer ${
                                idx === 0
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-600 hover:text-sky-600 hover:bg-white'
                              }`}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveScheduleStop(idx, 'down')}
                              disabled={idx === currentItinerary.stops.length - 1}
                              title="Move this stop later"
                              className={`p-1 cursor-pointer ${
                                idx === currentItinerary.stops.length - 1
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-600 hover:text-sky-600 hover:bg-white'
                              }`}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Destination Details */}
                      <div className="flex items-start gap-3">
                        <img
                          src={stop.destination.imageUrl}
                          alt={stop.destination.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-xs"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              {stop.destination.categoryId}
                            </span>
                            {isWaterfallOrNature(stop.destination) && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                                <Sun className="w-3 h-3 text-amber-500" />
                                <span>Daylight Sensitive</span>
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm mt-1 truncate">
                            {stop.destination.name}
                          </h4>
                          <p className="text-slate-600 text-xs line-clamp-1 mt-0.5">
                            {stop.destination.description}
                          </p>
                        </div>
                      </div>

                      {/* Daylight or Operating Hours Notice */}
                      {stop.daylightWarning && (
                        <div
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                            stop.daylightWarning.includes('⚠️')
                              ? 'bg-amber-50 border border-amber-200 text-amber-900 font-medium'
                              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          }`}
                        >
                          <Sun className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] leading-relaxed">{stop.daylightWarning}</span>
                        </div>
                      )}

                      {stop.operatingHoursWarning && (
                        <div className="p-2.5 rounded-xl text-xs bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span className="text-[11px] leading-relaxed font-medium">
                            {stop.operatingHoursWarning}
                          </span>
                        </div>
                      )}

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