const mongoose = require("mongoose");

const eventLocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String }, // Optional reference to a Place
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  address: { type: String },
  note: { type: String },
});

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  category: {
    type: String,
    required: true,
    enum: ["festival", "cultural", "religious", "music", "art", "food", "sports", "market", "other"],
    default: "festival",
  },
  // Event timing
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  startTime: { type: String }, // e.g., "9:00 AM"
  endTime: { type: String },
  isAllDay: { type: Boolean, default: false },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String }, // e.g., "yearly", "monthly"
  
  // Multiple locations for the event
  locations: [eventLocationSchema],
  
  // Media
  imageUrl: { type: String },
  gallery: [{ type: String }],
  videoUrl: { type: String },
  
  // Additional info
  entryFee: {
    isFree: { type: Boolean, default: true },
    price: { type: Number },
    note: { type: String },
  },
  organizer: { type: String },
  contactInfo: { type: String },
  website: { type: String },
  
  // Display options
  color: { type: String, default: "#FF6B35" },
  icon: { type: String, default: "🎉" },
  tags: [{ type: String }],
  
  // Status
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt timestamp before saving
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Event", eventSchema);