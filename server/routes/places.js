const express = require("express");
const router = express.Router();
const Place = require("../models/Place");

// GET all places
router.get("/", async (req, res) => {
  try {
    const { category, subcategory } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    const places = await Place.find(filter);
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single place by slug
router.get("/:slug", async (req, res) => {
  try {
    const place = await Place.findOne({ slug: req.params.slug });
    if (!place) return res.status(404).json({ message: "Place not found" });
    res.json(place);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new place
router.post("/", async (req, res) => {
  try {
    const place = new Place(req.body);
    const savedPlace = await place.save();
    res.status(201).json(savedPlace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;