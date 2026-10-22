import { Destination, Itinerary, ItineraryStop } from '../types';

export const MADAKUMBURA_CENTER = {
  name: 'Madakumbura Center Point',
  latitude: 6.2300,
  longitude: 80.0500,
  radiusKm: 25.0
};

/**
 * Calculates Great-Circle Distance between two pairs of coordinates
 * using the Haversine formula as specified in SRS Section 4.2.3 (REQ-8)
 * R = 6371 km (Mean Earth radius)
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Average travel speed across southern Sri Lankan coastal & semi-rural roads
 * (30 km/h accounting for local terrain, junctions, and tuk-tuk/bus traffic)
 */
export function estimateTravelMinutes(distanceKm: number): number {
  if (distanceKm <= 0.1) return 5;
  const speedKmh = 30; // 30 km/h average
  const minutes = Math.round((distanceKm / speedKmh) * 60);
  return Math.max(5, minutes); // Minimum 5 mins
}

/**
 * Nearest-Neighbor TSP heuristic algorithm to sequence stops
 * as defined in SRS REQ-11 & Class Diagram ItineraryService
 */
export function sequenceNearestNeighbor(
  destinations: Destination[],
  startCoords: { latitude: number; longitude: number } = MADAKUMBURA_CENTER
): Destination[] {
  if (destinations.length <= 1) return [...destinations];

  const unvisited = [...destinations];
  const ordered: Destination[] = [];
  let currentLat = startCoords.latitude;
  let currentLng = startCoords.longitude;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistance(
        currentLat,
        currentLng,
        unvisited[i].latitude,
        unvisited[i].longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const nextStop = unvisited.splice(nearestIndex, 1)[0];
    ordered.push(nextStop);
    currentLat = nextStop.latitude;
    currentLng = nextStop.longitude;
  }

  return ordered;
}

/**
 * Helper to generate permutations for small arrays (N <= 6)
 */
function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const remainingPerms = getPermutations(remaining);
    for (const perm of remainingPerms) {
      result.push([current, ...perm]);
    }
  }
  return result;
}

/**
 * Smart Daylight & Practical Itinerary Optimizer:
 * Prioritizes waterfalls & rainforests in morning/early daylight (08:30 AM - 03:00 PM)
 * and beaches/viewpoints at sunset (04:00 PM - 06:30 PM).
 */
export function sequenceSmartDaylight(
  destinations: Destination[],
  startTimeStr: string = '08:30 AM',
  startCoords: { latitude: number; longitude: number } = MADAKUMBURA_CENTER
): Destination[] {
  if (destinations.length <= 1) return [...destinations];

  if (destinations.length <= 6) {
    const allPerms = getPermutations(destinations);
    const startMinutes = parseTimeToMinutes(startTimeStr);

    let bestPerm = destinations;
    let minScore = Infinity;

    for (const perm of allPerms) {
      let curLat = startCoords.latitude;
      let curLng = startCoords.longitude;
      let curTime = startMinutes;
      let totalDist = 0;
      let scorePenalty = 0;

      for (let i = 0; i < perm.length; i++) {
        const dest = perm[i];
        const dist = haversineDistance(curLat, curLng, dest.latitude, dest.longitude);
        const travelMin = estimateTravelMinutes(dist);
        totalDist += dist;

        const arrivalMin = curTime + travelMin;
        const stayMin = dest.recommendedStayMinutes || 60;
        const departureMin = arrivalMin + stayMin;

        const isNatureOrWaterfall =
          dest.categoryId === 'Waterfall / Natural' ||
          /ella|waterfall|falls|forest|nature|safari|river/i.test(dest.name);

        const isBeach =
          dest.categoryId === 'Beach' ||
          /beach|coast|coral|marine|surf/i.test(dest.name);

        const isMuseum =
          dest.categoryId === 'Cultural / Museum' ||
          /museum|gallery/i.test(dest.name);

        const isDining =
          dest.categoryId === 'Restaurant / Cafe' ||
          /restaurant|cafe|food/i.test(dest.name);

        // 1. Waterfalls & Nature: MUST BE IN MORNING/DAYLIGHT
        if (isNatureOrWaterfall) {
          if (arrivalMin <= 12 * 60) {
            scorePenalty -= 35; // Morning bonus
          } else if (arrivalMin <= 14 * 60 + 30) {
            scorePenalty -= 15; // Early afternoon bonus
          } else if (arrivalMin > 16 * 60 + 30) {
            // After 4:30 PM in jungle/waterfall: HEAVY PENALTY
            scorePenalty += 200;
          } else if (arrivalMin > 15 * 60 + 30) {
            scorePenalty += 60;
          }
        }

        // 2. Beaches: Spectacular at Sunset (4:00 PM - 6:30 PM)
        if (isBeach) {
          if (arrivalMin >= 16 * 60 && arrivalMin <= 18 * 60 + 30) {
            scorePenalty -= 40; // Sunset prime time bonus
          } else if (arrivalMin >= 11 * 60 + 30 && arrivalMin <= 14 * 60) {
            scorePenalty += 10; // Midday heat
          }
        }

        // 3. Cultural Museums: Avoid arriving after closing time
        if (isMuseum) {
          if (arrivalMin > 16 * 60 + 45) {
            scorePenalty += 80;
          }
        }

        // 4. Dining: Lunch or Evening bonus
        if (isDining) {
          if (
            (arrivalMin >= 11 * 60 + 30 && arrivalMin <= 14 * 60) ||
            arrivalMin >= 17 * 60 + 30
          ) {
            scorePenalty -= 20;
          }
        }

        curTime = departureMin;
        curLat = dest.latitude;
        curLng = dest.longitude;
      }

      const compositeScore = totalDist * 1.5 + scorePenalty;
      if (compositeScore < minScore) {
        minScore = compositeScore;
        bestPerm = perm;
      }
    }

    return bestPerm;
  }

  return sequenceNearestNeighbor(destinations, startCoords);
}

export function minutesToTimeString(minutes: number): string {
  const normMinutes = minutes % (24 * 60);
  const hours = Math.floor(normMinutes / 60);
  const mins = normMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const padMins = mins < 10 ? `0${mins}` : mins;
  return `${displayHours}:${padMins} ${period}`;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 8 * 60 + 30; // Default 8:30 AM
  const cleaned = timeStr.trim();
  const isPM = /pm/i.test(cleaned);
  const isAM = /am/i.test(cleaned);
  const parts = cleaned.replace(/[^\d:]/g, '').split(':');
  let h = parseInt(parts[0], 10) || 8;
  const m = parseInt(parts[1], 10) || 0;

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  return h * 60 + m;
}

export function parseOperatingHours(hoursStr?: string): { openMinutes: number; closeMinutes: number } | null {
  if (!hoursStr || !hoursStr.includes('-')) return null;
  const parts = hoursStr.split('-');
  if (parts.length !== 2) return null;
  const openMinutes = parseTimeToMinutes(parts[0].trim());
  const closeMinutes = parseTimeToMinutes(parts[1].trim());
  return { openMinutes, closeMinutes };
}

export function buildItinerarySchedule(
  orderedDestinations: Destination[],
  startTimeStr: string = '08:30 AM',
  startCoords = MADAKUMBURA_CENTER,
  optimizationMode: 'smart-daylight' | 'shortest-distance' | 'manual-custom' = 'smart-daylight'
): Itinerary {
  let currentTimeMinutes = parseTimeToMinutes(startTimeStr);
  let totalDistanceKm = 0;
  let totalTravelMinutes = 0;
  let currentLat = startCoords.latitude;
  let currentLng = startCoords.longitude;

  const stops: ItineraryStop[] = orderedDestinations.map((dest, index) => {
    const legDist = haversineDistance(
      currentLat,
      currentLng,
      dest.latitude,
      dest.longitude
    );
    const travelMin = estimateTravelMinutes(legDist);

    totalDistanceKm += legDist;
    totalTravelMinutes += travelMin;

    const arrivalMin = currentTimeMinutes + travelMin;
    const stayMin = dest.recommendedStayMinutes || 60;
    const departureMin = arrivalMin + stayMin;

    // Operating hours check
    let hasTimeConflict = false;
    let operatingHoursWarning: string | undefined;
    const hours = parseOperatingHours(dest.operatingHours);
    if (hours) {
      if (arrivalMin < hours.openMinutes) {
        hasTimeConflict = true;
        operatingHoursWarning = `Arriving before opening time (${dest.operatingHours}).`;
      } else if (departureMin > hours.closeMinutes) {
        hasTimeConflict = true;
        operatingHoursWarning = `Tour extends past closing time (${dest.operatingHours}).`;
      }
    }

    // Daylight Safety & Practical Travel Check
    let daylightWarning: string | undefined;
    const isNatureOrWaterfall =
      dest.categoryId === 'Waterfall / Natural' ||
      /ella|waterfall|falls|forest|nature|safari|river/i.test(dest.name);

    const isBeach =
      dest.categoryId === 'Beach' ||
      /beach|coast|coral|marine|surf/i.test(dest.name);

    if (isNatureOrWaterfall) {
      if (arrivalMin >= 16 * 60 + 30) {
        daylightWarning =
          '⚠️ Late Daylight Warning: Rainforest and waterfall trails become dark, muddy, and hazardous after 4:30 PM. Morning or early afternoon visit is strongly recommended for safety.';
      } else if (arrivalMin <= 12 * 60) {
        daylightWarning = '☀️ Ideal Morning Daylight: Optimal safety, cool temperature, and clear scenic views.';
      }
    } else if (isBeach) {
      if (arrivalMin >= 16 * 60 && arrivalMin <= 18 * 60 + 30) {
        daylightWarning = '🌅 Golden Hour Sunset: Prime timing for coastal views, photography, and evening breeze.';
      }
    }

    currentTimeMinutes = departureMin;
    currentLat = dest.latitude;
    currentLng = dest.longitude;

    return {
      order: index + 1,
      destination: dest,
      legDistanceKm: legDist,
      travelMinutes: travelMin,
      stayMinutes: stayMin,
      arrivalTime: minutesToTimeString(arrivalMin),
      departureTime: minutesToTimeString(departureMin),
      hasTimeConflict,
      operatingHoursWarning,
      daylightWarning,
    };
  });

  const totalVisitMinutes = stops.reduce((acc, s) => acc + s.stayMinutes, 0);
  const totalMinutes = totalTravelMinutes + totalVisitMinutes;

  return {
    stops,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalTravelMinutes,
    totalVisitHours: Math.round((totalMinutes / 60) * 10) / 10,
    startTime: startTimeStr,
    endTime: minutesToTimeString(currentTimeMinutes),
    optimizationMode,
    startLocation: {
      name: startCoords.name,
      latitude: startCoords.latitude,
      longitude: startCoords.longitude,
    },
  };
}
