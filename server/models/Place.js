const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  category: {
    type: String,
    required: true,
    // Remove the enum restriction to allow any category
    // Or use a more flexible approach:
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: "Category is required",
    },
  },
  subcategory: { type: String },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  imageUrl: { type: String },
  // New: Multiple images gallery
  gallery: [{ type: String }],
  // New: Video support
  videoUrl: { type: String },
  videos: [
    {
      url: { type: String },
      title: { type: String },
      thumbnail: { type: String },
    },
  ],
  address: { type: String },
  openingHours: { type: String },
  entryFee: {
    nepali: { type: Number, default: 0 },
    saarc: { type: Number, default: 0 },
    foreign: { type: Number, default: 0 },
  },
  workshopPrice: {
    halfDay: { type: Number },
    fullDay: { type: Number },
  },
  tags: [{ type: String }],
  hasWorkshop: { type: Boolean, default: false },
  isSponsored: { type: Boolean, default: false },
  // Audio guide MP3 URL for location-based audio playback
  audioUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Place", placeSchema);