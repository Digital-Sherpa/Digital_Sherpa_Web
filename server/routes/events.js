const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

// GET all active events
router.get("/", async (req, res) => {
  try {
    const { category, featured, upcoming, limit } = req.query;
    let filter = { isActive: true };
    
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (upcoming === 'true') {
      filter.startDate = { $gte: new Date() };
    }

    let query = Event.find(filter).sort({ startDate: 1 });
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const events = await query;
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET featured/upcoming events for sidebar
router.get("/featured", async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({
      isActive: true,
      $or: [
        { isFeatured: true },
        { startDate: { $gte: now } }
      ]
    })
    .sort({ isFeatured: -1, startDate: 1 })
    .limit(5);
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single event by slug
router.get("/:slug", async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug, isActive: true });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;