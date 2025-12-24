const express = require("express");
const router = express.Router();
const Roadmap = require("../models/Roadmap");
const Place = require("../models/Place");

// GET all roadmaps
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let filter = { isActive: true };
    if (category) filter.category = category;
    const roadmaps = await Roadmap.find(filter);
    
    // Filter out roadmaps with less than 2 valid stops
    const validRoadmaps = [];
    for (const roadmap of roadmaps) {
      const placeSlugs = roadmap.stops.map(s => s.placeSlug);
      const existingPlaces = await Place.find({ slug: { $in: placeSlugs } });
      const existingSlugs = existingPlaces.map(p => p.slug);
      
      const validStops = roadmap.stops.filter(s => existingSlugs.includes(s.placeSlug));
      
      // Only include roadmaps with at least 2 valid stops
      if (validStops.length >= 2) {
        validRoadmaps.push({
          ...roadmap.toObject(),
          stops: validStops,
          _validStopCount: validStops.length
        });
      }
    }
    
    res.json(validRoadmaps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single roadmap by slug
router.get("/:slug", async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ slug: req.params.slug });
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });
    res.json(roadmap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET roadmap with full place details - FILTER INVALID STOPS
router.get("/:slug/full", async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ slug: req.params.slug });
    if (!roadmap) return res.status(404).json({ message: "Roadmap not found" });

    const placeSlugs = [
      ...roadmap.stops.map((s) => s.placeSlug),
      ...roadmap.sponsoredStops.map((s) => s.placeSlug),
    ];

    const places = await Place.find({ slug: { $in: placeSlugs } });
    const placesMap = {};
    places.forEach((p) => (placesMap[p.slug] = p));

    // Filter out stops where place no longer exists and re-order
    const validStops = roadmap.stops
      .filter((stop) => placesMap[stop.placeSlug]) // Only keep stops with existing places
      .sort((a, b) => a.order - b.order)
      .map((stop, index) => ({
        ...stop.toObject(),
        order: index + 1, // Re-number from 1
        place: placesMap[stop.placeSlug],
      }));

    const validSponsoredStops = roadmap.sponsoredStops
      .filter((stop) => placesMap[stop.placeSlug])
      .map((stop) => ({
        ...stop.toObject(),
        place: placesMap[stop.placeSlug],
      }));

    // Warn if roadmap has less than 2 stops (invalid for navigation)
    if (validStops.length < 2) {
      return res.status(400).json({ 
        message: "This roadmap no longer has enough valid stops for navigation",
        validStopCount: validStops.length,
        requiredMinimum: 2
      });
    }

    res.json({
      ...roadmap.toObject(),
      stops: validStops,
      sponsoredStops: validSponsoredStops,
      _originalStopCount: roadmap.stops.length,
      _validStopCount: validStops.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new roadmap
router.post("/", async (req, res) => {
  try {
    const roadmap = new Roadmap(req.body);
    const savedRoadmap = await roadmap.save();
    res.status(201).json(savedRoadmap);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;