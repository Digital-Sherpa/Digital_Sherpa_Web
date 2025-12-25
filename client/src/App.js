import "./style.css";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";

import { getPlaces, getRoadmaps, getRoadmapFull, getFeaturedEvents, semanticSearch } from "./services/api";
import { useAuth } from "./auth/AuthContext";
import RecordingPanel from "./components/RecordingPanel";

// User Menu Component
function UserMenu() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isAuthenticated) {
    return (
      <button 
        className="user-menu-btn login"
        onClick={() => navigate('/login')}
      >
        🔐 Login
      </button>
    );
  }

  

  return (
    <div className="user-menu">
      <button 
        className="user-menu-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="user-avatar-small">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span>{user?.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
      </button>
      
      {showDropdown && (
        <>
          <div className="dropdown-overlay" onClick={() => setShowDropdown(false)} />
          <div className="user-dropdown">
            <div className="dropdown-header">
              <span className="dropdown-name">{user?.name}</span>
              <span className="dropdown-email">{user?.email}</span>
            </div>
            <div className="dropdown-divider" />
            <button onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
              👤 My Profile
            </button>
            {isAdmin && (
              <button onClick={() => { navigate('/admin'); setShowDropdown(false); }}>
                🛡️ Admin Panel
              </button>
            )}
            <div className="dropdown-divider" />
            <button onClick={() => { logout(); setShowDropdown(false); }} className="logout">
              🚪 Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Create marker icon with image from Cloudinary
const createImageIcon = (imageUrl, color, fallbackEmoji) => {
  const hasImage = imageUrl && !imageUrl.includes("undefined");
  
  return L.divIcon({
    className: "custom-div-icon",
    html: hasImage 
      ? `
        <div class="marker-container" style="border-color: ${color};">
          <img src="${imageUrl}" alt="place" class="marker-image" />
        </div>
      `
      : `
        <div class="marker-container marker-emoji" style="border-color: ${color};">
          ${fallbackEmoji}
        </div>
      `,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -26],
  });
};

// User location icon
const userIcon = L.divIcon({
  className: "custom-div-icon",
  html: `
    <div class="user-marker">
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Category colors
const categoryColors = {
  historical: "#ef4444",
  workshop: "#10b981",
  restaurant: "#f59e0b",
  default: "#6b7280",
};

const categoryEmojis = {
  historical: "🏛️",
  workshop: "🎨",
  restaurant: "🍽️",
  default: "📍",
};

// Fetch walking route from OSRM
async function getWalkingRoute(start, end) {
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    }
    return null;
  } catch (error) {
    console.error("Routing error:", error);
    return null;
  }
}

// Fetch complete route through all stops
async function getCompleteRoute(stops) {
  if (stops.length < 2) return [];
  
  const allRouteCoords = [];
  
  for (let i = 0; i < stops.length - 1; i++) {
    const start = stops[i];
    const end = stops[i + 1];
    const segment = await getWalkingRoute(start, end);
    
    if (segment) {
      if (allRouteCoords.length > 0) {
        allRouteCoords.push(...segment.slice(1));
      } else {
        allRouteCoords.push(...segment);
      }
    } else {
      allRouteCoords.push(start, end);
    }
  }
  
  return allRouteCoords;
}

// User Location Marker (no auto-centering)
function UserLocationMarker({ position }) {
  if (!position) return null;

  return (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div className="popup-content">
          <h3>📍 Your Location</h3>
          <p>You are here</p>
        </div>
      </Popup>
    </Marker>
  );
}

// Center to Location Button
function CenterButton({ position, map }) {
  const handleCenter = () => {
    if (position && map) {
      map.flyTo(position, 17, { duration: 1 });
    }
  };

  return (
    <button 
      className="center-btn"
      onClick={handleCenter}
      disabled={!position}
      title="Center to my location"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
      </svg>
    </button>
  );
}

// Map Controller Component
function MapController({ setMapInstance }) {
  const map = useMap();
  
  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);
  
  return null;
}

// Animated Route Line with street-based path
function AnimatedStreetRoute({ routeCoords, color, isNavigationRoute = false }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev - 2) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  if (!routeCoords || routeCoords.length < 2) return null;

  return (
    <>
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: isNavigationRoute ? "#10b981" : color,
          weight: isNavigationRoute ? 8 : 7,
          opacity: 0.3,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      <Polyline
        positions={routeCoords}
        pathOptions={{
          color: isNavigationRoute ? "#34d399" : color,
          weight: isNavigationRoute ? 5 : 4,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
          dashArray: "12, 8",
          dashOffset: String(offset),
        }}
      />
    </>
  );
}

// Fit Bounds Component
function FitBounds({ coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 17 });
    }
  }, [coordinates, map]);

  return null;
}

// Compact Place Popup Component - Redesigned
function PlacePopup({ place, stopNumber, isSponsored, onMoreDetails }) {
  // Get opening status
  const getOpeningStatus = () => {
    if (!place.openingHours) return 'Open Now';
    const parts = place.openingHours.split('-');
    if (parts.length === 2) {
      return `Open 'til ${parts[1].trim()}`;
    }
    return place.openingHours;
  };

  const hasVideo = place.videoUrl || (place.videos && place.videos.length > 0);

  return (
    <div className="compact-popup">
      {/* Header */}
      <div className="compact-popup-header">
        <div className="compact-popup-avatar">
          {place.imageUrl ? (
            <img src={place.imageUrl} alt={place.name} />
          ) : (
            <span>{categoryEmojis[place.category] || "📍"}</span>
          )}
        </div>
        <div className="compact-popup-title">
          <h3>{place.name}</h3>
          <span className="compact-popup-status">
            <span className="status-dot"></span>
            {getOpeningStatus()}
          </span>
        </div>
      </div>

      {/* Info Pills */}
      <div className="compact-popup-pills">
        {place.openingHours && (
          <div className="info-pill">
            <span className="pill-icon">🕐</span>
            <span>{place.openingHours}</span>
          </div>
        )}
        {place.entryFee && place.entryFee.foreign > 0 && (
          <div className="info-pill highlight">
            <span className="pill-icon">💰</span>
            <span>Rs. {place.entryFee.foreign}</span>
          </div>
        )}
        {hasVideo && (
          <div className="info-pill video">
            <span className="pill-icon">🎬</span>
            <span>Video</span>
          </div>
        )}
        {isSponsored && (
          <div className="info-pill sponsored">
            <span className="pill-icon">⭐</span>
            <span>Sponsored</span>
          </div>
        )}
        {stopNumber && (
          <div className="info-pill stop">
            <span className="pill-icon">📍</span>
            <span>Stop {stopNumber}</span>
          </div>
        )}
      </div>

      {/* Brief Description */}
      <p className="compact-popup-desc">
        {place.description?.length > 100 
          ? place.description.substring(0, 100) + '...' 
          : place.description}
      </p>

      {/* Image Preview */}
      {place.imageUrl && (
        <div className="compact-popup-image">
          <img src={place.imageUrl} alt={place.name} />
        </div>
      )}

      {/* Tags */}
      {place.tags && place.tags.length > 0 && (
        <div className="compact-popup-tags">
          {place.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="compact-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Action Button */}
      <button 
        className="compact-popup-btn" 
        onClick={(e) => {
          e.stopPropagation();
          onMoreDetails && onMoreDetails(place);
        }}
      >
        More Details
      </button>
    </div>
  );
}

// Place Detail Modal with Video Support - Improved
function PlaceDetailModal({ place, onClose }) {
  const [activeTab, setActiveTab] = useState('info');
  const videoRef = useRef(null);

  useEffect(() => {
    // Auto-play video when video tab is active
    if (activeTab === 'video' && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [activeTab]);

  if (!place) return null;

  // Combine images
  const images = [];
  if (place.imageUrl) images.push(place.imageUrl);
  if (place.gallery && place.gallery.length > 0) {
    place.gallery.forEach(img => {
      if (img !== place.imageUrl) images.push(img);
    });
  }

  // Get videos
  const videos = place.videos && place.videos.length > 0 
    ? place.videos 
    : place.videoUrl 
      ? [{ url: place.videoUrl, title: 'Video Tour' }] 
      : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        {/* Hero Image */}
        {place.imageUrl && (
          <div className="modal-hero">
            <img src={place.imageUrl} alt={place.name} />
            {videos.length > 0 && (
              <button 
                className="play-video-btn"
                onClick={() => setActiveTab('video')}
              >
                ▶ Watch Video
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📋 Info
          </button>
          {images.length > 1 && (
            <button 
              className={`modal-tab ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              🖼️ Gallery
            </button>
          )}
          {videos.length > 0 && (
            <button 
              className={`modal-tab ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveTab('video')}
            >
              🎬 Video
            </button>
          )}
        </div>

        <div className="modal-body">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <>
              <h2>{place.name}</h2>
              <p className="modal-category">
                {categoryEmojis[place.category]} {place.category}
              </p>
              
              <p className="modal-description">{place.description}</p>

              {/* Details Grid */}
              <div className="modal-details-grid">
                {place.openingHours && (
                  <div className="detail-item">
                    <span className="detail-icon">🕐</span>
                    <div>
                      <strong>Opening Hours</strong>
                      <p>{place.openingHours}</p>
                    </div>
                  </div>
                )}
                {place.address && (
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <div>
                      <strong>Address</strong>
                      <p>{place.address}</p>
                    </div>
                  </div>
                )}
                {place.entryFee && (
                  <div className="detail-item">
                    <span className="detail-icon">💰</span>
                    <div>
                      <strong>Entry Fee</strong>
                      <p>
                        Nepali: Free | SAARC: Rs. {place.entryFee.saarc} | Foreign: Rs. {place.entryFee.foreign}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Workshop Section */}
              {place.hasWorkshop && (
                <div className="modal-workshop">
                  <h3>🎨 Workshop Available</h3>
                  <p>Experience hands-on learning with master craftsmen.</p>
                  {place.workshopPrice && (
                    <div className="workshop-prices">
                      {place.workshopPrice.halfDay && (
                        <div className="price-card">
                          <span className="price-label">Half Day</span>
                          <span className="price-value">Rs. {place.workshopPrice.halfDay}</span>
                        </div>
                      )}
                      {place.workshopPrice.fullDay && (
                        <div className="price-card">
                          <span className="price-label">Full Day</span>
                          <span className="price-value">Rs. {place.workshopPrice.fullDay}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <button className="book-workshop-btn">Book Workshop</button>
                </div>
              )}

              {/* Tags */}
              {place.tags && place.tags.length > 0 && (
                <div className="modal-tags">
                  {place.tags.map((tag, idx) => (
                    <span key={idx} className="modal-tag">#{tag}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Gallery Tab - Improved */}
          {activeTab === 'gallery' && (
            <div className="modal-gallery">
              <h3>📸 Photo Gallery</h3>
              <div className="gallery-grid-improved">
                {images.map((img, idx) => (
                  <div key={idx} className="gallery-item-large">
                    <img src={img} alt={`${place.name} ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Tab - Improved with YouTube Support */}
          {activeTab === 'video' && (
            <div className="modal-video">
              {videos.map((video, idx) => {
                const isYouTube = video.url && (video.url.includes('youtube.com') || video.url.includes('youtu.be'));
                let embedUrl = video.url;
                
                if (isYouTube) {
                  // Extract Video ID
                  let videoId = '';
                  if (video.url.includes('youtu.be')) {
                    videoId = video.url.split('/').pop();
                  } else if (video.url.includes('v=')) {
                    videoId = video.url.split('v=')[1].split('&')[0];
                  } else if (video.url.includes('embed/')) {
                    videoId = video.url.split('embed/')[1].split('?')[0];
                  }
                  
                  if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${idx === 0 ? 1 : 0}&mute=0`;
                  }
                }

                return (
                  <div key={idx} className="video-player-container">
                    {video.title && <h4 className="video-title">{video.title}</h4>}
                    
                    {isYouTube ? (
                      <div className="youtube-embed-wrapper">
                        <iframe
                          src={embedUrl}
                          title={video.title || "YouTube video player"}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="video-player iframe-player"
                        ></iframe>
                      </div>
                    ) : (
                      <video 
                        ref={idx === 0 ? videoRef : null}
                        controls 
                        autoPlay={idx === 0}
                        playsInline
                        preload="auto"
                        poster={video.thumbnail || place.imageUrl}
                        className="video-player"
                      >
                        <source src={video.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [places, setPlaces] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [fullRoadmap, setFullRoadmap] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapInstance, setMapInstance] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [navigationRoute, setNavigationRoute] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Collapsible sections state
  const [isTrailsExpanded, setIsTrailsExpanded] = useState(true);
  const [isEventsExpanded, setIsEventsExpanded] = useState(true);
  
  // Mobile sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Recording state for live route display
  const [recordingData, setRecordingData] = useState(null);
  
  const navigate = useNavigate();
  
  // Refs for markers to control popups
  const markerRefs = useRef({});

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [placesData, roadmapsData, eventsData] = await Promise.all([
          getPlaces(),
          getRoadmaps(),
          getFeaturedEvents().catch(() => []), // Don't fail if events API fails
        ]);
        setPlaces(placesData);
        setRoadmaps(roadmapsData);
        setFeaturedEvents(eventsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Debounced Semantic Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        setShowSearchResults(true);
        try {
          const results = await semanticSearch(searchQuery, 8, true);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Get user location (no auto-centering)
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.log("Location error:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Fetch full roadmap when selected - HANDLE ERRORS
  useEffect(() => {
    async function fetchFullRoadmap() {
      if (!selectedRoadmap) {
        setFullRoadmap(null);
        setRouteCoords([]);
        setNavigationRoute([]);
        setIsNavigating(false);
        setIsPanelMinimized(false);
        return;
      }
      try {
        const data = await getRoadmapFull(selectedRoadmap.slug);
        
        // Check if roadmap has valid stops
        if (data._validStopCount < 2) {
          setError(`This trail has only ${data._validStopCount} valid stop(s). Minimum 2 required.`);
          setSelectedRoadmap(null);
          setFullRoadmap(null);
          return;
        }
        
        setFullRoadmap(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch roadmap:", err);
        setError(err.message || "This trail is no longer available");
        setSelectedRoadmap(null);
        setFullRoadmap(null);
      }
    }
    fetchFullRoadmap();
  }, [selectedRoadmap]);

  // Calculate street-based route when roadmap changes
  useEffect(() => {
    async function calculateRoute() {
      if (!fullRoadmap || places.length === 0) {
        setRouteCoords([]);
        return;
      }

      setRouteLoading(true);

      const stopCoords = fullRoadmap.stops
        .sort((a, b) => a.order - b.order)
        .map((stop) => {
          const place = places.find((p) => p.slug === stop.placeSlug);
          return place ? [place.coordinates.lat, place.coordinates.lng] : null;
        })
        .filter(Boolean);

      if (stopCoords.length >= 2) {
        const route = await getCompleteRoute(stopCoords);
        setRouteCoords(route.length > 0 ? route : stopCoords);
      }

      setRouteLoading(false);
    }

    calculateRoute();
  }, [fullRoadmap, places]);

  // Filter roadmaps
  const filteredRoadmaps = useMemo(() => {
    return roadmaps.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === "all" || r.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [roadmaps, searchQuery, activeFilter]);

  // Get visible places - ONLY show roadmap stops when a roadmap is selected
  const visiblePlaces = useMemo(() => {
    // If no roadmap selected, show all places
    if (!fullRoadmap) return places;
    
    // Get all place slugs from stops and sponsored stops
    const stopSlugs = fullRoadmap.stops.map((s) => s.placeSlug);
    const sponsoredSlugs = fullRoadmap.sponsoredStops.map((s) => s.placeSlug);
    const allSlugs = [...stopSlugs, ...sponsoredSlugs];
    
    // Filter places to only show those in the roadmap
    return places.filter((p) => allSlugs.includes(p.slug));
  }, [places, fullRoadmap]);

  // Open popup for a specific place
  const openPopupForPlace = useCallback((placeSlug) => {
    const markerRef = markerRefs.current[placeSlug];
    if (markerRef) {
      markerRef.openPopup();
    }
  }, []);

  // Start Navigation handler
  const handleStartNavigation = useCallback(async () => {
    if (!userPosition || !fullRoadmap || places.length === 0) {
      alert("Please ensure location is enabled and a trail is selected.");
      return;
    }

    setRouteLoading(true);
    setIsNavigating(true);
    setActiveStopIndex(0);

    // Get first stop coordinates
    const firstStop = fullRoadmap.stops.find((s) => s.order === 1);
    if (!firstStop) {
      setRouteLoading(false);
      return;
    }

    const firstPlace = places.find((p) => p.slug === firstStop.placeSlug);
    if (!firstPlace) {
      setRouteLoading(false);
      return;
    }

    const firstStopCoords = [firstPlace.coordinates.lat, firstPlace.coordinates.lng];

    // Get walking route from user to first stop
    const navRoute = await getWalkingRoute(userPosition, firstStopCoords);
    
    if (navRoute) {
      setNavigationRoute(navRoute);
      
      // Fit map to show both user location and first stop
      if (mapInstance) {
        const bounds = L.latLngBounds([userPosition, firstStopCoords]);
        mapInstance.fitBounds(bounds, { padding: [100, 100], maxZoom: 17 });
      }
    } else {
      setNavigationRoute([userPosition, firstStopCoords]);
    }

    setRouteLoading(false);

    // Open popup for first stop after a short delay
    setTimeout(() => {
      openPopupForPlace(firstStop.placeSlug);
    }, 500);
  }, [userPosition, fullRoadmap, places, mapInstance, openPopupForPlace]);

  // Stop Navigation
  const handleStopNavigation = () => {
    setIsNavigating(false);
    setNavigationRoute([]);
    setIsPanelMinimized(false);
    setActiveStopIndex(0);
  };

  // Handle clicking on a stop in the list
  const handleStopClick = (stop, index) => {
    setActiveStopIndex(index);
    const place = places.find((p) => p.slug === stop.placeSlug);
    if (place && mapInstance) {
      mapInstance.flyTo([place.coordinates.lat, place.coordinates.lng], 18, { duration: 0.5 });
      setTimeout(() => {
        openPopupForPlace(stop.placeSlug);
      }, 600);
    }
  };

// Enhanced event click handler - highlights ALL event locations on map
function handleEventClick(evt) {
  if (!evt.locations || evt.locations.length === 0) return;
  
  setSelectedEvent(evt);
  setIsSidebarOpen(false); // Close mobile sidebar
  
  // Fit map to show ALL event locations
  if (mapInstance && evt.locations.length > 0) {
    const allCoords = evt.locations
      .filter(loc => loc?.coordinates)
      .map(loc => [loc.coordinates.lat, loc.coordinates.lng]);
    
    if (allCoords.length === 1) {
      mapInstance.flyTo(allCoords[0], 17, { duration: 1 });
    } else if (allCoords.length > 1) {
      const bounds = L.latLngBounds(allCoords);
      mapInstance.fitBounds(bounds, { padding: [80, 80], maxZoom: 16, duration: 1 });
    }
  }
}

function handleViewAllEvents() {
  setSelectedEvent(null);
  if (mapInstance && featuredEvents.length > 0) {
    const allCoords = featuredEvents.flatMap(evt => 
      evt.locations?.filter(loc => loc?.coordinates).map(loc => [loc.coordinates.lat, loc.coordinates.lng]) || []
    );
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }
}

// Helper to format event date
const formatEventDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Get event status based on dates
const getEventStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;
  
  if (now < start) return 'upcoming';
  if (now > end) return 'past';
  return 'ongoing';
};

// Format date range for display
const formatDateRange = (startDate, endDate) => {
  const start = formatEventDate(startDate);
  const end = endDate ? formatEventDate(endDate) : null;
  
  if (!end || start === end) return start;
  return `${start} - ${end}`;
};

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Loading Digital Sherpa...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {error && <div className="error-toast">{error}</div>}

      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${isSidebarOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header main-header">
          <div className="logo">
            <div className="logo-icon">🏔️</div>
            <h1>Digital Sherpa</h1>
          </div>
          <UserMenu />
        </div>

        {/* Scrollable Content */}
        <div className="sidebar-content">
          {/* Explore Trails Section - Collapsible */}
          <div className="sidebar-section">
            <button 
              className="section-toggle"
              onClick={() => setIsTrailsExpanded(!isTrailsExpanded)}
            >
              <div className="section-toggle-left">
                <span className="section-icon">🗺️</span>
                <span className="section-title">Explore Trails</span>
              </div>
              <span className={`section-chevron ${isTrailsExpanded ? 'expanded' : ''}`}>▼</span>
            </button>
            
            {isTrailsExpanded && (
              <div className="section-content">
                {/* Semantic Search */}
                <div className="search-box-container">
                  <div className="search-box">
                    <span className="search-icon">{isSearching ? '⏳' : '🔍'}</span>
                    <input
                      type="text"
                      placeholder="Search places, temples, trails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                    />
                    {searchQuery && (
                      <button 
                        className="search-clear-btn"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                          setShowSearchResults(false);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="search-results-dropdown">
                      <div className="search-results-header">
                        <span>🎯 Found {searchResults.length} places</span>
                        <button onClick={() => setShowSearchResults(false)}>✕</button>
                      </div>
                      <div className="search-results-list">
                        {searchResults.map((result, index) => {
                          const placeDetails = result.full_details || {};
                          const placeName = placeDetails.name || result.place_id;
                          const placeCategory = placeDetails.category || result.category;
                          const placeImage = placeDetails.imageUrl;
                          
                          return (
                            <div 
                              key={result.place_id || index}
                              className="search-result-item"
                              onClick={() => {
                                // Find matching place and zoom to it
                                const matchedPlace = places.find(p => 
                                  p._id === result.place_id || 
                                  p.slug === placeDetails.slug
                                );
                                if (matchedPlace && mapInstance) {
                                  mapInstance.flyTo(
                                    [matchedPlace.coordinates.lat, matchedPlace.coordinates.lng], 
                                    18, 
                                    { duration: 1 }
                                  );
                                  // Open popup after flying
                                  setTimeout(() => {
                                    openPopupForPlace(matchedPlace.slug);
                                  }, 1100);
                                }
                                setShowSearchResults(false);
                                setSelectedPlace(matchedPlace || { ...placeDetails, _id: result.place_id });
                              }}
                            >
                              <div className="search-result-avatar">
                                {placeImage ? (
                                  <img src={placeImage} alt={placeName} />
                                ) : (
                                  <span>{categoryEmojis[placeCategory] || '📍'}</span>
                                )}
                              </div>
                              <div className="search-result-info">
                                <h4>{placeName}</h4>
                                <span className="search-result-id">ID: {result.place_id}</span>
                                <div className="search-result-meta">
                                  <span className="search-result-category">
                                    {categoryEmojis[placeCategory] || '📍'} {placeCategory || 'Place'}
                                  </span>
                                  <span className="search-result-score">
                                    {Math.round(result.score * 100)}% match
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* No Results State */}
                  {showSearchResults && !isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <div className="search-results-dropdown">
                      <div className="search-no-results">
                        <span>🔍</span>
                        <p>No places found for "{searchQuery}"</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Filters */}
                <div className="filter-row">
                  <button
                    className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </button>
                  <button
                    className={`filter-btn ${activeFilter === "woodcarving" ? "active" : ""}`}
                    onClick={() => setActiveFilter("woodcarving")}
                  >
                    🪵 Wood
                  </button>
                  <button
                    className={`filter-btn ${activeFilter === "pottery" ? "active" : ""}`}
                    onClick={() => setActiveFilter("pottery")}
                  >
                    🏺 Pottery
                  </button>
                  <button
                    className={`filter-btn ${activeFilter === "heritage" ? "active" : ""}`}
                    onClick={() => setActiveFilter("heritage")}
                  >
                    🏛️ Heritage
                  </button>
                </div>

                {/* Trail List */}
                <div className="trail-list">
                  {filteredRoadmaps.length === 0 ? (
                    <div className="empty-state">No trails found</div>
                  ) : (
                    filteredRoadmaps.map((roadmap) => (
                      <div
                        key={roadmap._id}
                        className={`trail-card ${selectedRoadmap?.slug === roadmap.slug ? "active" : ""}`}
                        onClick={() => {
                          setSelectedRoadmap(roadmap);
                          setSelectedEvent(null);
                          setIsNavigating(false);
                          setNavigationRoute([]);
                          setIsPanelMinimized(false);
                          setIsSidebarOpen(false);
                        }}
                      >
                        <div className="trail-icon" style={{ borderColor: roadmap.color }}>
                          {roadmap.icon}
                        </div>
                        <div className="trail-info">
                          <h4>{roadmap.name}</h4>
                          <div className="trail-meta">
                            <span>🕐 {roadmap.duration}</span>
                            <span>📏 {roadmap.distance}</span>
                          </div>
                        </div>
                        <span className="status-badge open">Active</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Events Section - Collapsible with Premium Design */}
          {featuredEvents.length > 0 && (
            <div className="sidebar-section events-section">
              <button 
                className="section-toggle"
                onClick={() => setIsEventsExpanded(!isEventsExpanded)}
              >
                <div className="section-toggle-left">
                  <span className="section-icon">🎉</span>
                  <span className="section-title">Upcoming Events</span>
                  <span className="event-count-badge">{featuredEvents.length}</span>
                </div>
                <span className={`section-chevron ${isEventsExpanded ? 'expanded' : ''}`}>▼</span>
              </button>
              
              {isEventsExpanded && (
                <div className="section-content">
                  {/* View All Button */}
                  <button 
                    className="view-all-events-btn"
                    onClick={handleViewAllEvents}
                  >
                    <span>🗺️ Show All on Map</span>
                    <span className="arrow">→</span>
                  </button>

                  {/* Premium Event Cards */}
                  <div className="events-list">
                    {featuredEvents.map(evt => {
                      const status = getEventStatus(evt.startDate, evt.endDate);
                      const isSelected = selectedEvent?._id === evt._id;
                      
                      return (
                        <div 
                          key={evt._id} 
                          className={`event-card ${isSelected ? 'selected' : ''} ${status}`}
                          onClick={() => handleEventClick(evt)}
                          style={{ '--event-color': evt.color || '#FF6B35' }}
                        >
                          {/* Gradient Accent */}
                          <div className="event-card-accent" />
                          
                          {/* Event Icon */}
                          <div className="event-card-icon">
                            {evt.icon || '🎉'}
                          </div>
                          
                          {/* Event Content */}
                          <div className="event-card-content">
                            <div className="event-card-header">
                              <h4 className="event-card-title">{evt.name}</h4>
                              <span className={`event-status-badge ${status}`}>
                                {status === 'upcoming' && '⏳ Upcoming'}
                                {status === 'ongoing' && '🔴 Live Now'}
                                {status === 'past' && '✓ Ended'}
                              </span>
                            </div>
                            
                            <div className="event-card-meta">
                              <span className="event-date-display">
                                📅 {formatDateRange(evt.startDate, evt.endDate)}
                              </span>
                              {evt.locations && evt.locations.length > 0 && (
                                <span className="event-locations-count">
                                  📍 {evt.locations.length} location{evt.locations.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            
                            <p className="event-card-description">
                              {evt.description?.length > 60 
                                ? evt.description.substring(0, 60) + '...' 
                                : evt.description}
                            </p>
                          </div>
                          
                          {/* Click Indicator */}
                          <div className="event-card-arrow">
                            <span>→</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Map */}
      <div className="map-wrapper">
        <MapContainer
          center={[27.672108, 85.42834]}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController setMapInstance={setMapInstance} />

          {/* User Location */}
          <UserLocationMarker position={userPosition} />
          

          {/* Place Markers - Only visible places (filtered by roadmap) */}
          {visiblePlaces.map((place) => {
            const color = categoryColors[place.category] || categoryColors.default;
            const emoji = categoryEmojis[place.category] || categoryEmojis.default;
            const icon = createImageIcon(place.imageUrl, color, emoji);
            const stopNumber = fullRoadmap?.stops.find((s) => s.placeSlug === place.slug)?.order;
            const isSponsored = fullRoadmap?.sponsoredStops.some((s) => s.placeSlug === place.slug);

            return (
              <Marker
                key={place._id}
                position={[place.coordinates.lat, place.coordinates.lng]}
                icon={icon}
                ref={(ref) => {
                  if (ref) {
                    markerRefs.current[place.slug] = ref;
                  }
                }}
              >
                <Popup className="compact-popup-container" maxWidth={280} minWidth={260}>
                  <PlacePopup
                    place={place}
                    stopNumber={stopNumber}
                    isSponsored={isSponsored}
                    onMoreDetails={setSelectedPlace}
                  />
                </Popup>
              </Marker>
            );
          })}

          {/* Street-based Route for Selected Trail */}
          {fullRoadmap && routeCoords.length > 1 && (
            <>
              <AnimatedStreetRoute
                routeCoords={routeCoords}
                color={fullRoadmap.color || "#10b981"}
              />
              {!isNavigating && <FitBounds coordinates={routeCoords} />}
            </>
          )}

          {/* Navigation Route (User to First Stop) */}
          {isNavigating && navigationRoute.length > 1 && (
            <AnimatedStreetRoute
              routeCoords={navigationRoute}
              color="#10b981"
              isNavigationRoute={true}
            />
          )}

          {/* Live Recording Route - Shows GPS path while recording */}
          {recordingData?.isRecording && recordingData?.coordinates?.length > 1 && (
            <Polyline
              positions={recordingData.coordinates.map(c => [c.lat, c.lng])}
              pathOptions={{
                color: '#ef4444',
                weight: 4,
                opacity: 0.9,
                dashArray: '10, 5',
              }}
            />
          )}

          {/* Event Location Markers - Pulsing Animation */}
          {selectedEvent && selectedEvent.locations && selectedEvent.locations.map((loc, idx) => (
            loc?.coordinates && (
              <Marker
                key={`event-loc-${idx}`}
                position={[loc.coordinates.lat, loc.coordinates.lng]}
                icon={L.divIcon({
                  className: "event-location-marker",
                  html: `
                    <div class="event-marker-wrapper" style="--event-color: ${selectedEvent.color || '#FF6B35'}">
                      <div class="event-marker-pulse"></div>
                      <div class="event-marker-core">
                        ${selectedEvent.icon || '🎉'}
                      </div>
                      <div class="event-marker-label">${loc.name || 'Event Location'}</div>
                    </div>
                  `,
                  iconSize: [60, 80],
                  iconAnchor: [30, 40],
                  popupAnchor: [0, -40],
                })}
              >
                <Popup className="event-popup-container" maxWidth={300}>
                  <div className="event-location-popup">
                    <div className="event-popup-header" style={{ background: selectedEvent.color || '#FF6B35' }}>
                      <span className="event-popup-icon">{selectedEvent.icon || '🎉'}</span>
                      <span className="event-popup-name">{selectedEvent.name}</span>
                    </div>
                    <div className="event-popup-body">
                      <h4 className="location-name">📍 {loc.name || 'Event Location'}</h4>
                      {loc.address && <p className="location-address">{loc.address}</p>}
                      {loc.note && <p className="location-note">{loc.note}</p>}
                      <div className="event-popup-date">
                        📅 {formatDateRange(selectedEvent.startDate, selectedEvent.endDate)}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>

        {/* Event Locations Panel - Floating on Map */}
        {selectedEvent && (
          <div className="event-locations-panel">
            <button className="panel-close" onClick={() => setSelectedEvent(null)}>✕</button>
            <div className="panel-header" style={{ background: selectedEvent.color || '#FF6B35' }}>
              <span className="panel-icon">{selectedEvent.icon || '🎉'}</span>
              <div className="panel-title-group">
                <h3>{selectedEvent.name}</h3>
                <span className="panel-date">{formatDateRange(selectedEvent.startDate, selectedEvent.endDate)}</span>
              </div>
            </div>
            <div className="panel-body">
              <p className="panel-description">{selectedEvent.description}</p>
              <div className="panel-locations">
                <h4>📍 Event Locations ({selectedEvent.locations?.length || 0})</h4>
                <ul className="locations-list">
                  {selectedEvent.locations?.map((loc, idx) => (
                    <li 
                      key={idx}
                      className="location-item"
                      onClick={() => {
                        if (loc?.coordinates && mapInstance) {
                          mapInstance.flyTo([loc.coordinates.lat, loc.coordinates.lng], 18, { duration: 0.5 });
                        }
                      }}
                    >
                      <span className="location-number">{idx + 1}</span>
                      <div className="location-details">
                        <strong>{loc.name || 'Location ' + (idx + 1)}</strong>
                        {loc.address && <small>{loc.address}</small>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="map-controls">
          <CenterButton position={userPosition} map={mapInstance} />
        </div>

        {/* Route Loading Indicator */}
        {routeLoading && (
          <div className="route-loading">
            <div className="loading-spinner small"></div>
            <span>Calculating route...</span>
          </div>
        )}

        {/* Info Panel - Minimizable */}
        {fullRoadmap && (
          <div className={`info-panel ${isPanelMinimized ? 'minimized' : ''}`}>
            {/* Minimize/Maximize Button */}
            <button
              className="minimize-btn"
              onClick={() => setIsPanelMinimized(!isPanelMinimized)}
              title={isPanelMinimized ? "Expand" : "Minimize"}
            >
              {isPanelMinimized ? '▲' : '▼'}
            </button>

            <button
              className="close-btn"
              onClick={() => {
                setSelectedRoadmap(null);
                setIsNavigating(false);
                setNavigationRoute([]);
                setIsPanelMinimized(false);
              }}
            >
              ✕
            </button>

            <div className="info-panel-header">
              <div className="info-panel-icon">{fullRoadmap.icon}</div>
              <div className="info-panel-title">
                <h3>{fullRoadmap.name}</h3>
                <span className="status">
                  {isNavigating ? "🚶 Navigating..." : "Active Trail"}
                </span>
              </div>
            </div>

            {/* Collapsible Content */}
            {!isPanelMinimized && (
              <div className="info-panel-body">
                <div className="info-stats">
                  <div className="stat-item">🕐 {fullRoadmap.duration}</div>
                  <div className="stat-item">📏 {fullRoadmap.distance}</div>
                  <div className="stat-item">📍 {fullRoadmap.stops.length} stops</div>
                </div>

                <p className="info-description">{fullRoadmap.description}</p>

                <div className="info-stops">
                  <h4>Route Stops</h4>
                  {fullRoadmap.stops
                    .sort((a, b) => a.order - b.order)
                    .map((stop, index) => (
                      <div 
                        key={stop.order} 
                        className={`stop-item ${index === activeStopIndex && isNavigating ? "active" : ""} clickable`}
                        onClick={() => handleStopClick(stop, index)}
                      >
                        <span className="stop-number">{stop.order}</span>
                        <div className="stop-details">
                          <strong>
                            {stop.place?.name || stop.placeSlug}
                            {stop.isWorkshop && (
                              <span className="workshop-badge">Workshop</span>
                            )}
                          </strong>
                          <small>{stop.duration} • {stop.note}</small>
                        </div>
                      </div>
                    ))}
                </div>

                {isNavigating ? (
                  <button className="stop-btn" onClick={handleStopNavigation}>
                    ⏹️ Stop Navigation
                  </button>
                ) : (
                  <button 
                    className="start-btn" 
                    onClick={handleStartNavigation}
                    disabled={!userPosition || routeLoading}
                  >
                    {!userPosition ? "📍 Enable Location" : "🚀 Start Navigation"}
                  </button>
                )}
              </div>
            )}

            {/* Minimized View */}
            {isPanelMinimized && (
              <div className="info-panel-minimized">
                <div className="minimized-stats">
                  <span>🕐 {fullRoadmap.duration}</span>
                  <span>📍 {fullRoadmap.stops.length} stops</span>
                </div>
                {isNavigating && (
                  <button className="stop-btn-small" onClick={handleStopNavigation}>
                    ⏹️ Stop
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Place Detail Modal */}
      <PlaceDetailModal 
        place={selectedPlace} 
        onClose={() => setSelectedPlace(null)} 
      />

      {/* Journey Recording Panel */}
      <RecordingPanel
        mapInstance={mapInstance}
        onRecordingChange={setRecordingData}
        currentRoadmap={selectedRoadmap}
      />
    </div>
  );
}
