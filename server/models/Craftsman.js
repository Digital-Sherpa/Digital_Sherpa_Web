const mongoose = require("mongoose");

const workshopTypeSchema = new mongoose.Schema({
  type: { type: String, required: true },
  duration: { type: String },
  price: { type: Number, required: true },
  description: { type: String },
});

const craftsmanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  photo: { type: String }, // Replaces imageUrl to match form
  gallery: [{ type: String }], // Added
  specialty: [{ type: String }],
  placeSlug: { type: String },
  experience: { type: String },
  bio: { type: String }, // Replaces description to match form
  location: { type: String }, // Added
  contact: { // Added
    phone: { type: String },
    email: { type: String }
  },
  languages: [{ type: String }],
  workshopTypes: [workshopTypeSchema],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Craftsman", craftsmanSchema);