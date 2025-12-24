const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const Place = require("./models/Place");
const Roadmap = require("./models/Roadmap");
const Craftsman = require("./models/Craftsman");

const places = [
  {
    name: "Bhaktapur Durbar Square",
    slug: "bhaktapur-durbar-square",
    description: "UNESCO World Heritage Site featuring stunning Newari architecture, ancient temples, and the famous 55-window palace. This historic square showcases the rich cultural heritage of the Malla dynasty.",
    category: "historical",
    coordinates: { lat: 27.672108, lng: 85.42834 },
    imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/durbar-square.jpg",
    gallery: [
      "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/durbar-square.jpg",
    ],
    videoUrl: "https://res.cloudinary.com/dwuym30x9/video/upload/v1766334795/2_hkkoka.mp4",
    videos: [
      {
        url: "https://res.cloudinary.com/dwuym30x9/video/upload/v1766334795/2_hkkoka.mp4",
        title: "Durbar Square Walking Tour",
        thumbnail: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/durbar-square.jpg",
      },
    ],
    address: "Durbar Square, Bhaktapur",
    openingHours: "6:00 AM - 6:00 PM",
    entryFee: { nepali: 0, saarc: 500, foreign: 1500 },
    tags: ["heritage", "temple", "architecture", "UNESCO"],
    isSponsored: false,
  },
  {
    name: "Pottery Square",
    slug: "pottery-square",
    description: "Traditional pottery-making hub where artisans have practiced their craft for generations using ancient techniques passed down through families.",
    category: "workshop",
    subcategory: "pottery",
    coordinates: { lat: 27.6725, lng: 85.4275 },
    imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/pottery-square.jpg",
    gallery: [],
    videoUrl: "",
    videos: [],
    address: "Pottery Square, Bhaktapur",
    openingHours: "8:00 AM - 5:00 PM",
    tags: ["pottery", "craft", "workshop", "traditional"],
    hasWorkshop: true,
    workshopPrice: { halfDay: 1500, fullDay: 3000 },
    isSponsored: false,
  },
  {
    name: "Peacock Window",
    slug: "peacock-window",
    description: "Iconic 15th-century carved wooden window, considered the finest example of traditional Newari woodcarving. A masterpiece of intricate craftsmanship.",
    category: "historical",
    subcategory: "woodcarving",
    coordinates: { lat: 27.6718, lng: 85.4295 },
    imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/peacock-window.jpg",
    gallery: [],
    videoUrl: "",
    videos: [],
    address: "Tachupal Tole, Bhaktapur",
    tags: ["woodcarving", "heritage", "art", "architecture"],
    isSponsored: false,
  },
  {
    name: "Suwal Woodcarving Workshop",
    slug: "suwal-woodcarving",
    description: "Family-run woodcarving workshop with hands-on classes taught by master craftsman Ram Suwal, a third-generation woodcarver.",
    category: "workshop",
    subcategory: "woodcarving",
    coordinates: { lat: 27.6722, lng: 85.4288 },
    imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/suwal-workshop.jpg",
    gallery: [],
    videoUrl: "",
    videos: [],
    address: "Near Peacock Window, Bhaktapur",
    openingHours: "9:00 AM - 5:00 PM",
    tags: ["woodcarving", "workshop", "craft", "hands-on"],
    hasWorkshop: true,
    workshopPrice: { halfDay: 2500, fullDay: 4500 },
    isSponsored: false,
  },
  {
    name: "Siddha Pokhari",
    slug: "siddha-pokhari",
    description: "Historic 15th century rectangular pond, one of the largest and most beautiful ponds in Nepal. A peaceful spot for relaxation.",
    category: "historical",
    coordinates: { lat: 27.6719895, lng: 85.4203073 },
    imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/siddha-pokhari.jpg",
    gallery: [],
    videoUrl: "",
    videos: [],
    address: "Near Bhaktapur Bus Park",
    tags: ["pond", "heritage", "relaxation", "nature"],
    isSponsored: false,
  },
  {
    name: "Cafe Nyatapola",
    slug: "cafe-nyatapola",
    description: "Rooftop cafe with stunning views of the famous Nyatapola Temple. Perfect for a break during your heritage walk.",
    category: "restaurant",
    coordinates: { lat: 27.672, lng: 85.428 },
    imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/cafe-nyatapola.jpg",
    gallery: [],
    videoUrl: "",
    videos: [],
    address: "Taumadhi Square, Bhaktapur",
    openingHours: "7:00 AM - 9:00 PM",
    tags: ["cafe", "rooftop", "food", "views"],
    isSponsored: true,
  },
  {
    name: "King Curd House",
    slug: "king-curd-house",
    description: "Famous for Bhaktapur's legendary 'Juju Dhau' (King of Yogurt). A must-try delicacy made with traditional recipes.",
    category: "restaurant",
    coordinates: { lat: 27.6723, lng: 85.4282 },
    imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/king-curd.jpg",
    gallery: [],
    videoUrl: "",
    videos: [],
    address: "Near Dattatreya Square, Bhaktapur",
    openingHours: "8:00 AM - 7:00 PM",
    tags: ["juju-dhau", "yogurt", "dessert", "traditional"],
    isSponsored: true,
  },
];

const roadmaps = [
  {
    name: "Wood Carving Trail",
    slug: "wood-carving",
    description: "Explore traditional Newari woodcarving from ancient masterpieces to hands-on workshops.",
    category: "woodcarving",
    difficulty: "easy",
    duration: "3-4 hours",
    distance: "1.5 km",
    color: "#8B4513",
    icon: "🪵",
    stops: [
      { order: 1, placeSlug: "bhaktapur-durbar-square", duration: "30 min", note: "Admire wooden carvings" },
      { order: 2, placeSlug: "peacock-window", duration: "20 min", note: "Famous masterpiece" },
      { order: 3, placeSlug: "suwal-woodcarving", duration: "2 hours", note: "Hands-on class", isWorkshop: true },
    ],
    sponsoredStops: [{ afterStop: 2, placeSlug: "cafe-nyatapola", note: "Lunch break" }],
    tags: ["woodcarving", "craft", "workshop"],
    isActive: true,
  },
  {
    name: "Pottery Experience",
    slug: "pottery",
    description: "Discover centuries-old pottery traditions and try your hand at the potter's wheel.",
    category: "pottery",
    difficulty: "easy",
    duration: "2-3 hours",
    distance: "0.8 km",
    color: "#CD853F",
    icon: "🏺",
    stops: [
      { order: 1, placeSlug: "siddha-pokhari", duration: "15 min", note: "Start point" },
      { order: 2, placeSlug: "pottery-square", duration: "2 hours", note: "Try pottery", isWorkshop: true },
    ],
    sponsoredStops: [{ afterStop: 2, placeSlug: "king-curd-house", note: "Famous yogurt!" }],
    tags: ["pottery", "craft", "workshop"],
    isActive: true,
  },
  {
    name: "Heritage Walk",
    slug: "heritage-walk",
    description: "Walking tour through UNESCO World Heritage sites and ancient squares.",
    category: "heritage",
    difficulty: "easy",
    duration: "2 hours",
    distance: "2 km",
    color: "#8B0000",
    icon: "🏛️",
    stops: [
      { order: 1, placeSlug: "siddha-pokhari", duration: "15 min", note: "Historic pond" },
      { order: 2, placeSlug: "bhaktapur-durbar-square", duration: "45 min", note: "Main heritage site" },
      { order: 3, placeSlug: "pottery-square", duration: "20 min", note: "Pottery area" },
      { order: 4, placeSlug: "peacock-window", duration: "15 min", note: "Iconic window" },
    ],
    sponsoredStops: [{ afterStop: 2, placeSlug: "king-curd-house", note: "Try King Yogurt" }],
    tags: ["heritage", "walking", "temples"],
    isActive: true,
  },
];

const craftsmen = [
  {
    name: "Ram Suwal",
    slug: "ram-suwal",
    title: "Master Woodcarver",
    description: "Third-generation woodcarver with 35 years experience in traditional Newari woodcarving.",
    imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/ram-suwal.jpg",
    specialty: ["woodcarving", "restoration"],
    placeSlug: "suwal-woodcarving",
    experience: "35 years",
    languages: ["Nepali", "English", "Newari"],
    workshopTypes: [
      { type: "half-day", duration: "3 hours", price: 2500, description: "Basic carving techniques" },
      { type: "full-day", duration: "6 hours", price: 4500, description: "Comprehensive workshop" },
    ],
    rating: 4.9,
    reviewCount: 127,
    isAvailable: true,
  },
  {
    name: "Laxmi Prajapati",
    slug: "laxmi-prajapati",
    title: "Master Potter",
    description: "Award-winning potter preserving ancient techniques for over 28 years.",
    imageUrl: "https://res.cloudinary.com/dwuym30x9/image/upload/v1752942450/digital_sherpa/laxmi-prajapati.jpg",
    specialty: ["pottery", "traditional-vessels"],
    placeSlug: "pottery-square",
    experience: "28 years",
    languages: ["Nepali", "English"],
    workshopTypes: [
      { type: "half-day", duration: "2 hours", price: 1500, description: "Pottery wheel basics" },
      { type: "full-day", duration: "5 hours", price: 3000, description: "Complete experience" },
    ],
    rating: 4.8,
    reviewCount: 89,
    isAvailable: true,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "digital_sherpa" });
    console.log("✅ Connected to MongoDB");

    await Place.deleteMany({});
    await Roadmap.deleteMany({});
    await Craftsman.deleteMany({});
    console.log("🗑️ Cleared existing data");

    await Place.insertMany(places);
    console.log(`📍 Inserted ${places.length} places`);

    await Roadmap.insertMany(roadmaps);
    console.log(`🗺️ Inserted ${roadmaps.length} roadmaps`);

    await Craftsman.insertMany(craftsmen);
    console.log(`👨‍🎨 Inserted ${craftsmen.length} craftsmen`);

    console.log("\n✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();