/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Destination, CategoryType, Itinerary } from './types';
import { CATEGORIES, getInitialDestinations } from './data/seedDestinations';
import { Navbar } from './components/Navbar';
import { DestinationCard } from './components/DestinationCard';
import { DestinationModal } from './components/DestinationModal';
import { MapView } from './components/MapView';
import { ItineraryPlanner } from './components/ItineraryPlanner';
import { AdminCMS } from './components/AdminCMS';
import {
  Search,
  Filter,
  MapPin,
  Sparkles,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  // Persistent Destinations State (NFR-SAF-001 & Database State)
  const [destinations, setDestinations] = useState<Destination[]>(() => {
    const saved = localStorage.getItem('letsgo_destinations_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved destinations:', e);
      }
    }
    return getInitialDestinations();
  });

  // Persistent Plan Queue State (NFR-SAF-001)
  const [planQueue, setPlanQueue] = useState<Destination[]>(() => {
    const saved = localStorage.getItem('letsgo_plan_queue_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved plan queue:', e);
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'explore' | 'map' | 'itinerary' | 'admin'>('explore');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('letsgo_destinations_v1', JSON.stringify(destinations));
  }, [destinations]);

  useEffect(() => {
    localStorage.setItem('letsgo_plan_queue_v1', JSON.stringify(planQueue));
  }, [planQueue]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Add / Remove from Itinerary Queue
  const toggleQueue = (dest: Destination) => {
    const exists = planQueue.some((item) => item.id === dest.id);
    if (exists) {
      setPlanQueue(planQueue.filter((item) => item.id !== dest.id));
      showToast(`Removed "${dest.name}" from itinerary plan.`);
    } else {
      if (planQueue.length >= 6) {
        showToast('Maximum 6 destinations allowed in a 1-day itinerary queue (REQ-10).');
        return;
      }
      setPlanQueue([...planQueue, dest]);
      showToast(`Added "${dest.name}" to 1-day itinerary plan.`);
    }
  };

  const removeFromQueue = (destId: string) => {
    setPlanQueue(planQueue.filter((item) => item.id !== destId));
    showToast('Removed from itinerary queue.');
  };

  const clearQueue = () => {
    setPlanQueue([]);
    setCurrentItinerary(null);
    showToast('Cleared all queued destinations.');
  };

  // Admin CRUD Handlers (REQ-15)
  const handleAddDestination = (newDest: Destination) => {
    setDestinations([newDest, ...destinations]);
    showToast(`Destination "${newDest.name}" added successfully.`);
  };

  const handleUpdateDestination = (updatedDest: Destination) => {
    setDestinations(
      destinations.map((d) => (d.id === updatedDest.id ? updatedDest : d))
    );
    setPlanQueue(
      planQueue.map((d) => (d.id === updatedDest.id ? updatedDest : d))
    );
    showToast(`Destination "${updatedDest.name}" updated successfully.`);
  };

  const handleDeleteDestination = (destId: string) => {
    setDestinations(destinations.filter((d) => d.id !== destId));
    setPlanQueue(planQueue.filter((d) => d.id !== destId));
    showToast('Destination deleted from database.');
  };

  const handleResetToDefault = () => {
    const defaults = getInitialDestinations();
    setDestinations(defaults);
    setPlanQueue([]);
    setCurrentItinerary(null);
    showToast('Database reset to original 10 curated locations.');
  };

  // Filtered Destinations (REQ-1, REQ-2, REQ-3)
  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      const matchesCategory =
        selectedCategory === 'All' || dest.categoryId === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        dest.name.toLowerCase().includes(q) ||
        dest.description.toLowerCase().includes(q) ||
        dest.categoryId.toLowerCase().includes(q) ||
        (dest.address && dest.address.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [destinations, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Navigation Header (Clean, No Sign In / Register buttons) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueCount={planQueue.length}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: Explore & Search (REQ-1, REQ-2, REQ-3, REQ-4, REQ-5) */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-semibold mb-4">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>Madakumbura, Southern Province • 25 km Operational Radius</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  Discover & Plan Your Ideal South Coast Journey
                </h1>
                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                  Centralized, verified tourism information for historical temples,
                  mangrove river safaris, traditional mask museums, waterfalls, and
                  coastal beaches within 25 km of Madakumbura.
                </p>

                {/* Quick Info Badges */}
                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
                  <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>10 Curated SLTDA-Verified Sites</span>
                  </span>
                  <span className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    <span>Automated Nearest-Neighbor TSP Routing</span>
                  </span>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Decorative Background Glow */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
            </div>

            {/* Filter and Search Bar Row (REQ-2 & REQ-3) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Field */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destinations, keywords, places..."
                  className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills (REQ-2) */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  All Places ({destinations.length})
                </button>
                {CATEGORIES.map((cat) => {
                  const count = destinations.filter(
                    (d) => d.categoryId === cat.categoryName
                  ).length;
                  return (
                    <button
                      key={cat.categoryId}
                      onClick={() => setSelectedCategory(cat.categoryName)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat.categoryName
                          ? 'bg-sky-600 text-white shadow-xs font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat.categoryName} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Destinations Grid or Empty State (REQ-5) */}
            {filteredDestinations.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  No Destinations Found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  No attractions match your current filter or query within the 25
                  km Madakumbura radius. Try resetting active filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredDestinations.map((dest) => {
                  const isInQueue = planQueue.some((q) => q.id === dest.id);
                  const queueIndex = planQueue.findIndex((q) => q.id === dest.id);
                  return (
                    <DestinationCard
                      key={dest.id}
                      destination={dest}
                      isInQueue={isInQueue}
                      queueOrder={queueIndex !== -1 ? queueIndex + 1 : undefined}
                      onToggleQueue={toggleQueue}
                      onViewDetails={(d) => setSelectedDestination(d)}
                      onViewOnMap={(d) => {
                        setSelectedDestination(d);
                        setActiveTab('map');
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Interactive Map View (REQ-6, REQ-7, REQ-8, REQ-9) */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>Interactive OpenStreetMap & Spatial View</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Showing {filteredDestinations.length} verified tourist destinations
                  bounded within the 25 km radius of Madakumbura
                </p>
              </div>

              {/* Category Filter shortcut */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
                >
                  <option value="All">All Categories ({destinations.length})</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.categoryId} value={c.categoryName}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>

                {currentItinerary && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    Route Line Active ({currentItinerary.stops.length} stops)
                  </span>
                )}
              </div>
            </div>

            <div className="h-[620px] w-full">
              <MapView
                destinations={filteredDestinations}
                selectedDestination={selectedDestination}
                onSelectDestination={(d) => setSelectedDestination(d)}
                planQueue={planQueue}
                onToggleQueue={toggleQueue}
                currentItinerary={currentItinerary}
              />
            </div>
          </div>
        )}

        {/* TAB 3: Automated 1-Day Itinerary Planner (REQ-10, REQ-11, REQ-12, REQ-13) */}
        {activeTab === 'itinerary' && (
          <ItineraryPlanner
            planQueue={planQueue}
            onRemoveFromQueue={removeFromQueue}
            onClearQueue={clearQueue}
            currentItinerary={currentItinerary}
            onItineraryGenerated={(itin) => setCurrentItinerary(itin)}
            onFocusOnMap={() => setActiveTab('map')}
          />
        )}

        {/* TAB 4: Admin Content Management System (REQ-14, REQ-15, REQ-16) */}
        {activeTab === 'admin' && (
          <AdminCMS
            destinations={destinations}
            onAddDestination={handleAddDestination}
            onUpdateDestination={handleUpdateDestination}
            onDeleteDestination={handleDeleteDestination}
            onResetToDefault={handleResetToDefault}
          />
        )}
      </main>

      {/* Destination Modal Details */}
      <DestinationModal
        destination={selectedDestination}
        onClose={() => setSelectedDestination(null)}
        isInQueue={
          selectedDestination
            ? planQueue.some((q) => q.id === selectedDestination.id)
            : false
        }
        onToggleQueue={toggleQueue}
      />

      {/* Clean User-Facing Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">LetsGO</span>
            <span>• Visit Planner and Information System</span>
            <span className="text-slate-400">| Madakumbura, Southern Province</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Reference Coordinates: 6.2300° N, 80.0500° E</span>
            
            
          </div>
        </div>
      </footer>
    </div>
  );
}
