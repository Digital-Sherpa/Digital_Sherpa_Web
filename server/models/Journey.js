const mongoose = require("mongoose");

const coordinateSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  altitude: { type: Number, default: null },
  timestamp: { type: Date, default: Date.now },
  accuracy: { type: Number, default: null }, // GPS accuracy in meters
});

const journeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  
  // Optional - if following a specific roadmap/trail
  roadmapSlug: { type: String, default: null },
  roadmapName: { type: String, default: null },
  
  // Custom title set by user
  title: { 
    type: String, 
    default: function() {
      return `Journey on ${new Date().toLocaleDateString()}`;
    }
  },
  
  // Timing
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  duration: { type: Number, default: 0 }, // in seconds
  
  // Distance
  distance: { type: Number, default: 0 }, // in meters
  
  // GPS Coordinates Array
  coordinates: [coordinateSchema],
  
  // Track Image (uploaded to Cloudinary)
  trackImage: {
    url: { type: String, default: null },
    publicId: { type: String, default: null },
    format: { type: String, default: 'jpg' }, // jpg, png, svg
  },
  
  // Stats calculated from coordinates
  stats: {
    avgSpeed: { type: Number, default: 0 }, // km/h
    maxSpeed: { type: Number, default: 0 }, // km/h
    elevationGain: { type: Number, default: 0 }, // meters
    elevationLoss: { type: Number, default: 0 }, // meters
    minAltitude: { type: Number, default: null },
    maxAltitude: { type: Number, default: null },
  },
  
  // Recording status
  status: {
    type: String,
    enum: ["recording", "paused", "completed", "cancelled"],
    default: "recording",
  },
  
  // Visibility for future community feature
  isPublic: { type: Boolean, default: false },
  
  // Notes from user
  notes: { type: String, maxlength: 500 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Calculate distance between two GPS points using Haversine formula
journeySchema.statics.calculateDistance = function(coord1, coord2) {
  const R = 6371000; // Earth's radius in meters
  const lat1 = coord1.lat * Math.PI / 180;
  const lat2 = coord2.lat * Math.PI / 180;
  const deltaLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const deltaLng = (coord2.lng - coord1.lng) * Math.PI / 180;

  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Calculate total distance from coordinates
journeySchema.methods.calculateTotalDistance = function() {
  if (this.coordinates.length < 2) return 0;
  
  let total = 0;
  for (let i = 1; i < this.coordinates.length; i++) {
    total += this.constructor.calculateDistance(
      this.coordinates[i-1],
      this.coordinates[i]
    );
  }
  return total;
};

// Calculate stats from coordinates
journeySchema.methods.calculateStats = function() {
  if (this.coordinates.length < 2) return;
  
  let totalDistance = 0;
  let maxSpeed = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let minAlt = Infinity;
  let maxAlt = -Infinity;
  
  for (let i = 1; i < this.coordinates.length; i++) {
    const prev = this.coordinates[i-1];
    const curr = this.coordinates[i];
    
    // Distance
    const dist = this.constructor.calculateDistance(prev, curr);
    totalDistance += dist;
    
    // Speed calculation
    const timeDiff = (new Date(curr.timestamp) - new Date(prev.timestamp)) / 1000; // seconds
    if (timeDiff > 0) {
      const speed = (dist / 1000) / (timeDiff / 3600); // km/h
      if (speed > maxSpeed && speed < 150) { // Filter unrealistic speeds
        maxSpeed = speed;
      }
    }
    
    // Altitude tracking
    if (curr.altitude !== null) {
      if (curr.altitude < minAlt) minAlt = curr.altitude;
      if (curr.altitude > maxAlt) maxAlt = curr.altitude;
      
      if (prev.altitude !== null) {
        const altDiff = curr.altitude - prev.altitude;
        if (altDiff > 0) elevationGain += altDiff;
        else elevationLoss += Math.abs(altDiff);
      }
    }
  }
  
  // Duration in seconds
  const duration = this.endTime 
    ? (new Date(this.endTime) - new Date(this.startTime)) / 1000
    : 0;
  
  // Average speed
  const avgSpeed = duration > 0 
    ? (totalDistance / 1000) / (duration / 3600) 
    : 0;
  
  this.distance = totalDistance;
  this.duration = duration;
  this.stats = {
    avgSpeed: parseFloat(avgSpeed.toFixed(2)),
    maxSpeed: parseFloat(maxSpeed.toFixed(2)),
    elevationGain: parseFloat(elevationGain.toFixed(1)),
    elevationLoss: parseFloat(elevationLoss.toFixed(1)),
    minAltitude: minAlt === Infinity ? null : minAlt,
    maxAltitude: maxAlt === -Infinity ? null : maxAlt,
  };
};

// Pre-save middleware
journeySchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient queries
journeySchema.index({ userId: 1, createdAt: -1 });
journeySchema.index({ status: 1 });
journeySchema.index({ roadmapSlug: 1 });

module.exports = mongoose.model("Journey", journeySchema);
