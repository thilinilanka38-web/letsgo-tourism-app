import React from 'react';
import {
  Compass,
  Map,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'explore' | 'map' | 'itinerary' | 'admin';
  setActiveTab: (tab: 'explore' | 'map' | 'itinerary' | 'admin') => void;
  queueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  queueCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-14 sm:h-20">
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('explore')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-linear-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 sm:w-6 sm:h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                  Lets<span className="text-sky-600">GO</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 px-1.5 sm:px-2 py-0.5 rounded-full">
                  25 km Radius
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Visit Planner & Information System • Madakumbura, Southern Province
              </p>
            </div>
          </div>

          {/* Location Badge (Phone වලදී පමණක් පෙනේ) */}
          <div className="block md:hidden text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full border border-slate-200/80">
            📍 Madakumbura
          </div>

          {/* Desktop Navigation Tabs (Laptop/PC වලදී පමණක් පෙනේ) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-sky-50 text-sky-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-sky-50 text-sky-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Interactive Map</span>
            </button>

            <button
              onClick={() => setActiveTab('itinerary')}
              className={`relative px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'itinerary'
                  ? 'bg-sky-50 text-sky-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>1-Day Plan</span>
              {queueCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-amber-50 text-amber-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin CMS</span>
            </button>
          </nav>
        </div>

        {/* Mobile Navigation Tabs (Phone එකේදී බටන් 4ම එක පේලියට සමානව fit වන කොටස) */}
        <div className="md:hidden pb-2 pt-0.5">
          <nav className="grid grid-cols-4 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70">
            <button
              onClick={() => setActiveTab('explore')}
              className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-white text-sky-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="truncate">Explore</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-white text-sky-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-4 h-4" />
              <span className="truncate">Map</span>
            </button>

            <button
              onClick={() => setActiveTab('itinerary')}
              className={`relative py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'itinerary'
                  ? 'bg-white text-sky-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="truncate">1-Day Plan</span>
              {queueCount > 0 && (
                <span className="absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {queueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-amber-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="truncate">Admin</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};