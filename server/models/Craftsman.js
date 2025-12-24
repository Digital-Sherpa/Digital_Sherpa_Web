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
  title: { type: String },
  description: { type: String },
  imageUrl: { type: String },
  specialty: [{ type: String }],
  placeSlug: { type: String },
  experience: { type: String },
  languages: [{ type: String }],
  workshopTypes: [workshopTypeSchema],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Craftsman", craftsmanSchema);