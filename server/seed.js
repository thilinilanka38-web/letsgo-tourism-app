const mongoose = require('mongoose');
require('dotenv').config();
const Destination = require('./models/Destination');

const destinations = [
  {
    name: 'Galagoda Shayilatharama Viharaya',
    categoryId: 'Religious / Heritage',
    latitude: 6.2485,
    longitude: 80.052,
    location: { type: 'Point', coordinates: [80.052, 6.2485] },
    operatingHours: '06:00 AM - 06:30 PM',
    description: "A historic hilltop temple featuring South Asia's longest reclining Buddha statue, measuring approximately 115 feet in length, offering panoramic views of the coastal lowlands.",
    imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
    distanceFromMadakumburaKm: 3.5,
    recommendedStayMinutes: 60,
    address: 'Galagoda, Maha Vihara Rd, Ambalangoda',
  },
  {
    name: 'Ariyapala Mask Museum',
    categoryId: 'Cultural / Museum',
    latitude: 6.236,
    longitude: 80.0535,
    location: { type: 'Point', coordinates: [80.0535, 6.236] },
    operatingHours: '08:30 AM - 05:30 PM',
    description: 'A cultural preservation center in Ambalangoda highlighting traditional Sri Lankan mask-making, woodcarving, and live artisan workshops depicting devil dancing and Kolam folk theater.',
    imageUrl: 'https://images.unsplash.com/photo-1578925518470-4def7a0f08bb?auto=format&fit=crop&w=800&q=80',
    distanceFromMadakumburaKm: 13.2,
    recommendedStayMinutes: 75,
    address: '426 Main Street, Ambalangoda',
  },
  {
    name: 'Ozone Restaurant & Cafe',
    categoryId: 'Restaurant / Cafe',
    latitude: 6.241,
    longitude: 80.0505,
    location: { type: 'Point', coordinates: [80.0505, 6.241] },
    operatingHours: '10:00 AM - 10:00 PM',
    description: 'A cozy two-story dining spot on Galle Road offering affordable Asian and local cuisine, fresh tropical fruit juices, and artisanal coffee in a relaxed ambiance.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    distanceFromMadakumburaKm: 9.6,
    recommendedStayMinutes: 60,
    address: 'Galle Road, Ambalangoda',
  },
  {
    name: 'Tsunami Honganji Viharaya (Peraliya Tsunami Memorial)',
    categoryId: 'Religious / Heritage',
    latitude: 6.1664,
    longitude: 80.0912,
    location: { type: 'Point', coordinates: [80.0912, 6.1664] },
    operatingHours: '06:00 AM - 07:00 PM',
    description: 'A poignant memorial honoring the 2004 tsunami victims featuring an imposing 30-meter standing Buddha statue rising above a reflective lotus pond near the historic railway site.',
    imageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f444f4ac?auto=format&fit=crop&w=800&q=80',
    distanceFromMadakumburaKm: 18.5,
    recommendedStayMinutes: 45,
    address: 'Galle Road, Peraliya, Telwatta',
  },
  {
    name: 'Madu River (Madu Ganga) Boat Safari',
    categoryId: 'Waterfall / Natural',
    latitude: 6.275,
    longitude: 80.038,
    location: { type: 'Point', coordinates: [80.038, 6.275] },
    operatingHours: '07:00 AM - 06:00 PM',
    description: 'A scenic boat safari through a Ramsar-protected wetland featuring 64 islands, natural mangrove tunnels, cinnamon peeling demonstrations, island Buddhist monasteries, and natural fish therapy.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    distanceFromMadakumburaKm: 11.2,
    recommendedStayMinutes: 120,
    address: 'Madu Ganga Boat Station, Balapitiya',
  },
  {
    name: 'Adahelena Ella – Waterfall',
    categoryId: 'Waterfall / Natural',
    latitude: 6.262,
    longitude: 80.148,
    location: { type: 'Point', coordinates: [80.148, 6.262] },
    operatingHours: '07:00 AM - 05:00 PM',
    description: 'A serene hidden waterfall near Elpitiya surrounded by lush tea and rubber plantations, soothing cascading waters, and peaceful natural rock pools ideal for eco-nature walks.',
    imageUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
    distanceFromMadakumburaKm: 14.1,
    recommendedStayMinutes: 90,
    address: 'Elpitiya - Pitigala Road, Southern Province',
  },
  {
    name: 'Kamatha Richvon Restaurant',
    categoryId: 'Restaurant / Cafe',
    latitude: 6.255,
    longitude: 80.142,
    location: { type: 'Point', coordinates: [80.142, 6.255] },
    operatingHours: '11:00 AM - 09:00 PM',
    description: 'A village-themed restaurant in Elpitiya offering a rustic traditional dining experience with clay-pot Sri Lankan curries, fresh country vegetables, and serene rural garden seating.',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    distanceFromMadakumburaKm: 13.0,
    recommendedStayMinutes: 60,
    address: 'Batuwanhena Road, Elpitiya',
  },
  {
    name: 'Hikkaduwa Beach',
    categoryId: 'Beach',
    latitude: 6.14,
    longitude: 80.1,
    location: { type: 'Point', coordinates: [80.1, 6.14] },
    operatingHours: '06:00 AM - 08:00 PM',
    description: 'A world-famous coastal destination known for its designated National Park Marine Sanctuary, vibrant coral reefs, surfing breaks, beachfront eateries, and daily wild sea turtle encounters.',
    imageUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=800&q=80',
    distanceFromMadakumburaKm: 23.0,
    recommendedStayMinutes: 120,
    address: 'Galle Road, Hikkaduwa',
  },
  {
    name: 'Seenigama Devalaya (Sri Devol Maha Devalaya)',
    categoryId: 'Cultural / Museum',
    latitude: 6.155,
    longitude: 80.098,
    location: { type: 'Point', coordinates: [80.098, 6.155] },
    operatingHours: '06:00 AM - 07:30 PM',
    description: 'An ancient coastal and offshore island shrine dedicated to God Devol, widely revered for centuries by seafarers, ocean travelers, and local fishermen seeking blessings and spiritual protection.',
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
    distanceFromMadakumburaKm: 21.5,
    recommendedStayMinutes: 50,
    address: 'Galle Road, Seenigama, Hikkaduwa',
  },
  {
    name: 'Sunset Cafe Balapitiya',
    categoryId: 'Restaurant / Cafe',
    latitude: 6.27,
    longitude: 80.035,
    location: { type: 'Point', coordinates: [80.035, 6.27] },
    operatingHours: '11:00 AM - 10:30 PM',
    description: 'A beachfront cafe in Balapitiya offering freshly caught Sri Lankan ocean prawns, calamari, tropical smoothies, and picturesque sunset views over the Indian Ocean horizon.',
    imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    distanceFromMadakumburaKm: 11.0,
    recommendedStayMinutes: 60,
    address: 'Beach Road, Balapitiya',
  },
];

async function runSeed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas...');
    await Destination.deleteMany({});
    console.log('Cleared existing destinations');
    await Destination.insertMany(destinations);
    console.log(' Successfully seeded 10 Madakumbura tourist destinations into MongoDB Atlas!');
    process.exit(0);
  } catch (err) {
    console.error(' Seeding error:', err);
    process.exit(1);
  }
}

runSeed();
