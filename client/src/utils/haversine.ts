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
 * Formats minutes from midnight to HH:MM AM/PM string
 */
export function minutesToTimeString(minutes: number): string {
  const normMinutes = minutes % (24 * 60);
  const hours = Math.floor(normMinutes / 60);
  const mins = normMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const padMins = mins < 10 ? `0${mins}` : mins;
  return `${displayHours}:${padMins} ${period}`;
}

/**
 * Parses time string like "08:30" or "08:30 AM" into minutes from midnight
 */
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

/**
 * Builds chronological time-sequenced schedule (REQ-12)
 */
export function buildItinerarySchedule(
  orderedDestinations: Destination[],
  startTimeStr: string = '08:30 AM',
  startCoords = MADAKUMBURA_CENTER
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

    // Advance current time for next iteration
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
      hasTimeConflict: false // Can be evaluated against operating hours
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
    startLocation: {
      name: startCoords.name,
      latitude: startCoords.latitude,
      longitude: startCoords.longitude
    }
  };
}
