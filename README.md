# Digital Sherpa 🏔️

**"Don't just visit Nepal. Unlock it."**

An interactive cultural tourism platform that combines the best of Google Maps, Pokémon GO, Strava, and Airbnb - built specifically to help travelers discover and support authentic local experiences in Nepal.

## 🎯 Vision

Digital Sherpa is designed to ensure tourists don't miss what makes Nepal truly special. It brings together:

- **Smart Maps** with curated trails revealing hidden histories, artisan shops, and authentic food
- **Gamified Exploration** via unique challenges, quests, and rewards (coming soon)
- **Seamless Booking** for workshops, experiences, and local activities (coming soon)
- **AR Navigation** to unlock stories and secrets as you walk (coming soon)

Starting from **Bhaktapur**, expanding to cover **all of Nepal**.

---

## ✨ Current Features (v0.3.0)

### 🗺️ Interactive Map System
- [x] Dark-themed OpenStreetMap with custom styling
- [x] Custom markers with place images and category icons
- [x] Real-time user geolocation with pulsing indicator
- [x] Smooth map animations and transitions
- [x] Category-based marker colors (historical, workshop, restaurant, viewpoint)

### 🛤️ Curated Trail System (Roadmaps)
- [x] Pre-designed cultural trails (Wood Carving, Pottery, Heritage Walk)
- [x] Street-based route calculation using OSRM
- [x] Animated route visualization with trail colors
- [x] Stop-by-stop navigation with progress tracking
- [x] Sponsored stop integration for local businesses
- [x] Trail difficulty ratings and time estimates

### 📍 Place Discovery
- [x] Rich place profiles with images, galleries, and videos
- [x] Workshop availability and pricing information
- [x] Entry fees for different visitor categories (Nepali/SAARC/Foreign)
- [x] Opening hours and address information
- [x] Tags for easy categorization and search

### 🎬 Media Support
- [x] Image galleries for places
- [x] Video tours uploaded to Cloudinary
- [x] Video playback in place detail modals
- [x] Thumbnail support for video previews

### 👨‍🎨 Craftsmen Profiles
- [x] Master artisan database with specialties
- [x] Experience, languages, and availability
- [x] Workshop types and pricing
- [x] Photo galleries of their work
- [x] Rating and review counts

### 🔧 Admin Panel (`/admin`)
- [x] Dashboard with statistics overview
- [x] **Places Management**
  - Create, edit, delete places
  - Image upload to Cloudinary
  - Video upload support
  - Gallery management
  - Workshop pricing configuration
- [x] **Craftsmen Management**
  - Profile creation and editing
  - Photo and work gallery uploads
  - Workshop type configuration
- [x] **Roadmaps Management**
  - Create custom trails with ordered stops
  - Drag-to-reorder stops
  - Set difficulty, duration, distance
  - Add sponsored stops
  - Custom trail colors and icons

### ☁️ Cloud Infrastructure
- [x] MongoDB Atlas database
- [x] Cloudinary for image/video storage
- [x] RESTful API architecture
- [x] Separate admin API routes

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **React Router v7** - Navigation
- **Leaflet + React-Leaflet** - Interactive maps
- **OSRM** - Street-based route calculation

### Backend
- **Node.js + Express** - API server
- **MongoDB + Mongoose** - Database
- **Cloudinary** - Media storage
- **Multer** - File upload handling

### Styling
- **Custom CSS** - Dark theme design system
- **Inter Font** - Typography

---

## 📁 Project Structure

```
digital-sherpa/
├── client/                    # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js            # Main map application
│   │   ├── index.js          # App entry with routing
│   │   ├── style.css         # Main app styles
│   │   ├── admin/            # Admin Panel
│   │   │   ├── AdminApp.js   # Admin layout
│   │   │   ├── admin.css     # Admin styles
│   │   │   ├── components/   # Admin UI components
│   │   │   │   ├── Dashboard.js
│   │   │   │   ├── PlaceList.js
│   │   │   │   ├── PlaceForm.js
│   │   │   │   ├── CraftsmanList.js
│   │   │   │   ├── CraftsmanForm.js
│   │   │   │   ├── RoadmapList.js
│   │   │   │   ├── RoadmapForm.js
│   │   │   │   └── Sidebar.js
│   │   │   └── services/
│   │   │       └── adminApi.js
│   │   ├── components/       # Shared components
│   │   │   ├── PlaceMarkers.js
│   │   │   ├── RouteDisplay.js
│   │   │   └── RoadmapSelector.js
│   │   └── services/
│   │       └── api.js        # Public API calls
│   └── package.json
│
├── server/                    # Node.js Backend
│   ├── server.js             # Express app
│   ├── seed.js               # Database seeder
│   ├── config/
│   │   └── cloudinary.js     # Cloudinary config
│   ├── middleware/
│   │   └── upload.js         # Multer config
│   ├── models/
│   │   ├── Place.js          # Place schema
│   │   ├── Roadmap.js        # Trail schema
│   │   └── Craftsman.js      # Artisan schema
│   ├── routes/
│   │   ├── places.js         # Public place API
│   │   ├── roadmaps.js       # Public trail API
│   │   ├── craftsmen.js      # Public craftsmen API
│   │   └── admin/            # Admin APIs
│   │       ├── index.js
│   │       ├── places.js
│   │       ├── craftsmen.js
│   │       ├── roadmaps.js
│   │       └── upload.js
│   └── package.json
│
├── .env                       # Environment variables
├── package.json               # Root package
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### Environment Setup

Create `.env` in root directory:

```env
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/digital-sherpa.git
cd digital-sherpa

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Seed database with sample data (optional)
cd ../server
npm run seed
```

### Running the Application

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm start
```

- **Main App**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API**: http://localhost:5000/api

---

## 🗺️ Current Trails

| Trail | Description | Duration | Difficulty |
|-------|-------------|----------|------------|
| 🪵 Wood Carving Trail | Traditional Newari woodcarving from masterpieces to workshops | 3-4 hours | Easy |
| 🏺 Pottery Experience | Centuries-old pottery traditions at Pottery Square | 2-3 hours | Easy |
| 🏛️ Heritage Walk | UNESCO World Heritage sites and ancient squares | 2 hours | Easy |

---

## 🗓️ Development Roadmap

### Phase 1: Foundation ✅ COMPLETED
- [x] Interactive map with OpenStreetMap
- [x] Custom markers and clustering
- [x] User geolocation
- [x] Trail/Roadmap system
- [x] Street-based route calculation
- [x] Place profiles with rich media
- [x] Admin panel for content management
- [x] Cloudinary integration for media
- [x] MongoDB database setup

### Phase 2: Authentication & Users 🔄 IN PROGRESS
- [ ] User registration and login
- [ ] JWT-based authentication
- [ ] User profiles and preferences
- [ ] Favorite places and trails
- [ ] Trail completion history
- [ ] Social login (Google, Facebook)
- [ ] Admin role-based access control

### Phase 3: Booking System 📅 NEXT
- [ ] Workshop booking interface
- [ ] Real-time availability calendar
- [ ] Craftsmen scheduling system
- [ ] Payment integration (Khalti, eSewa, Stripe)
- [ ] Booking confirmation and reminders
- [ ] Cancellation and refund policies
- [ ] Review and rating system
- [ ] Booking history for users

### Phase 4: Gamification & Quests 🎮 PLANNED
- [ ] Achievement/badge system
- [ ] Trail completion rewards
- [ ] Daily/weekly challenges
- [ ] Points and leaderboards
- [ ] Hidden gem discovery quests
- [ ] Photo challenges at locations
- [ ] Collectible digital stamps
- [ ] Streak rewards for regular exploration

### Phase 5: AR Experience 📱 FUTURE
- [ ] AR navigation overlays
- [ ] Historical site reconstructions
- [ ] Interactive craftsman demonstrations
- [ ] Story unlocks at locations
- [ ] AR treasure hunts
- [ ] 360° view integration
- [ ] Audio guides with AR triggers

### Phase 6: Expansion 🇳🇵 VISION
- [ ] Kathmandu Valley trails
- [ ] Pokhara experiences
- [ ] Lumbini pilgrimage routes
- [ ] Chitwan nature trails
- [ ] Everest region treks
- [ ] Annapurna circuit guides
- [ ] Regional cuisine trails
- [ ] Festival calendar integration

### Phase 7: Community & Commerce 🤝 FUTURE
- [ ] Local guide profiles
- [ ] Artisan direct sales platform
- [ ] Authentic product marketplace
- [ ] Community-created trails
- [ ] Local business partnerships
- [ ] Tour operator integration
- [ ] Multi-language support (Nepali, Chinese, Japanese, German, French)

---

## 🎯 Key Differentiators

1. **Curated, Not Crowdsourced**: Every trail is designed by locals who know the hidden gems
2. **Support Local Artisans**: Direct booking with master craftsmen, not tour agencies
3. **Gamified Discovery**: Turn exploration into an adventure with quests and rewards
4. **Authentic Experiences**: Focus on real cultural immersion, not tourist traps
5. **Offline-Ready**: Download trails for areas with limited connectivity (planned)
6. **Fair Tourism**: Transparent pricing that benefits local communities

---

## 📊 API Endpoints

### Public API

```
GET  /api/places              # List all places
GET  /api/places/:slug        # Get place by slug
GET  /api/roadmaps            # List all active roadmaps
GET  /api/roadmaps/:slug      # Get roadmap by slug
GET  /api/roadmaps/:slug/full # Get roadmap with full place details
GET  /api/craftsmen           # List all craftsmen
GET  /api/craftsmen/:slug     # Get craftsman by slug
GET  /api/health              # API health check
```

### Admin API

```
# Places
GET    /api/admin/places          # List with pagination
GET    /api/admin/places/:id      # Get by ID
POST   /api/admin/places          # Create
PUT    /api/admin/places/:id      # Update
DELETE /api/admin/places/:id      # Delete

# Craftsmen
GET    /api/admin/craftsmen       # List with pagination
GET    /api/admin/craftsmen/:id   # Get by ID
POST   /api/admin/craftsmen       # Create
PUT    /api/admin/craftsmen/:id   # Update
DELETE /api/admin/craftsmen/:id   # Delete

# Roadmaps
GET    /api/admin/roadmaps        # List with pagination
GET    /api/admin/roadmaps/:id    # Get by ID
POST   /api/admin/roadmaps        # Create
PUT    /api/admin/roadmaps/:id    # Update
DELETE /api/admin/roadmaps/:id    # Delete

# Uploads
POST   /api/admin/upload/image    # Upload single image
POST   /api/admin/upload/images   # Upload multiple images
POST   /api/admin/upload/video    # Upload video
DELETE /api/admin/upload/delete   # Delete from Cloudinary

# Stats
GET    /api/admin/stats           # Dashboard statistics
```

---

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines first.

### Development Guidelines
1. Follow existing code style
2. Write meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

### Areas We Need Help
- UI/UX improvements
- Mobile responsiveness
- Performance optimization
- New trail creation for other regions
- Translation support
- AR development (React Native / Flutter)

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- OpenStreetMap contributors
- OSRM for routing
- The artisans of Bhaktapur who inspired this project
- Nepal Tourism Board

---

## 📞 Contact

- **Project Lead**: [Your Name]
- **Email**: [your.email@example.com]
- **Website**: [Coming Soon]

---

**Made with ❤️ for Nepal**