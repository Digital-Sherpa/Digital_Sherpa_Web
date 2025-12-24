const mongoose = require("mongoose");

const stopSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  placeSlug: { type: String, required: true },
  duration: { type: String },
  note: { type: String },
  isWorkshop: { type: Boolean, default: false },
});

const sponsoredStopSchema = new mongoose.Schema({
  afterStop: { type: Number, required: true },
  placeSlug: { type: String, required: true },
  note: { type: String },
});

const roadmapSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  category: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ["easy", "moderate", "challenging"],
    default: "easy",
  },
  duration: { type: String },
  distance: { type: String },
  imageUrl: { type: String },
  color: { type: String, default: "#333333" },
  icon: { type: String },
  stops: [stopSchema],
  sponsoredStops: [sponsoredStopSchema],
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Roadmap", roadmapSchema);