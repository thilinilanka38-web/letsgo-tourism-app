const MADAKUMBURA_CENTER = {
  name: 'Madakumbura Reference Point',
  latitude: 6.2300,
  longitude: 80.0500,
  radiusKm: 25.0,
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function estimateTravelMinutes(distanceKm) {
  if (distanceKm <= 0.1) return 5;
  return Math.max(5, Math.round((distanceKm / 30) * 60));
}

function minutesToTimeString(minutes) {
  const norm = minutes % (24 * 60);
  const hours = Math.floor(norm / 60);
  const mins = norm % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const padMins = mins < 10 ? '0' + mins : mins;
  return `${displayHours}:${padMins} ${period}`;
}

function sequenceNearestNeighbor(destinations, startPoint = MADAKUMBURA_CENTER) {
  const unvisited = [...destinations];
  const ordered = [];
  let currentLat = startPoint.latitude;
  let currentLng = startPoint.longitude;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
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
        nearestIdx = i;
      }
    }

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    ordered.push(nextStop);
    currentLat = nextStop.latitude;
    currentLng = nextStop.longitude;
  }

  return ordered;
}

function buildSchedule(orderedDestinations, startTime = '08:30 AM', startPoint = MADAKUMBURA_CENTER) {
  let currentTimeMinutes = 8 * 60 + 30;
  let totalDistanceKm = 0;
  let totalTravelMinutes = 0;
  let currentLat = startPoint.latitude;
  let currentLng = startPoint.longitude;

  const stops = orderedDestinations.map((dest, index) => {
    const legDistance = haversineDistance(currentLat, currentLng, dest.latitude, dest.longitude);
    const travelMins = estimateTravelMinutes(legDistance);

    totalDistanceKm += legDistance;
    totalTravelMinutes += travelMins;

    const arrivalMin = currentTimeMinutes + travelMins;
    const stayMins = dest.recommendedStayMinutes || 60;
    const departureMin = arrivalMin + stayMins;

    currentTimeMinutes = departureMin;
    currentLat = dest.latitude;
    currentLng = dest.longitude;

    return {
      order: index + 1,
      destination: dest,
      legDistanceKm: legDistance,
      travelMinutes: travelMins,
      stayMinutes: stayMins,
      arrivalTime: minutesToTimeString(arrivalMin),
      departureTime: minutesToTimeString(departureMin),
    };
  });

  const totalVisitMinutes = stops.reduce((acc, s) => acc + s.stayMinutes, 0);

  return {
    stops,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalTravelMinutes,
    totalVisitHours: Math.round(((totalTravelMinutes + totalVisitMinutes) / 60) * 10) / 10,
    startTime,
    endTime: minutesToTimeString(currentTimeMinutes),
    startLocation: startPoint,
  };
}

module.exports = {
  haversineDistance,
  sequenceNearestNeighbor,
  buildSchedule,
  MADAKUMBURA_CENTER,
};
