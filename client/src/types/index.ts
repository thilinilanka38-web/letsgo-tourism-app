export type CategoryType = 
  | 'Religious / Heritage'
  | 'Cultural / Museum'
  | 'Restaurant / Cafe'
  | 'Waterfall / Natural'
  | 'Beach';

export interface Category {
  categoryId: string;
  categoryName: CategoryType;
  description: string;
  color: string;
}

export interface Destination {
  id: string; // destination_id
  name: string;
  categoryId: CategoryType;
  latitude: number;
  longitude: number;
  operatingHours: string;
  description: string;
  imageUrl: string;
  distanceFromMadakumburaKm: number;
  recommendedStayMinutes: number;
  address?: string;
  contactNumber?: string;
}

export interface ItineraryStop {
  order: number;
  destination: Destination;
  legDistanceKm: number;
  travelMinutes: number;
  stayMinutes: number;
  arrivalTime: string;
  departureTime: string;
  hasTimeConflict?: boolean;
}

export interface Itinerary {
  id?: string;
  title?: string;
  stops: ItineraryStop[];
  totalDistanceKm: number;
  totalTravelMinutes: number;
  totalVisitHours: number;
  startTime: string;
  endTime: string;
  startLocation: {
    name: string;
    latitude: number;
    longitude: number;
  };
  createdAt?: string;
}

export type UserRole = 'tourist' | 'admin';

export interface User {
  id: string;
  fullName: string;
  username: string; // or email
  role: UserRole;
  token?: string;
  createdAt: string;
  savedItineraries?: Itinerary[];
  favorites?: string[]; // destination IDs
}
