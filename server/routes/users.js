const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

// ADD TO FAVORITES - Places
router.post("/favorites/places/:slug", verifyToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user.favoritePlaces.includes(slug)) {
      user.favoritePlaces.push(slug);
      await user.save();
    }
    
    res.json({ favoritePlaces: user.favoritePlaces });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// REMOVE FROM FAVORITES - Places
router.delete("/favorites/places/:slug", verifyToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const user = await User.findById(req.user._id);
    
    user.favoritePlaces = user.favoritePlaces.filter(s => s !== slug);
    await user.save();
    
    res.json({ favoritePlaces: user.favoritePlaces });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD TO FAVORITES - Roadmaps
router.post("/favorites/roadmaps/:slug", verifyToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const user = await User.findById(req.user._id);
    
    if (!user.favoriteRoadmaps.includes(slug)) {
      user.favoriteRoadmaps.push(slug);
      await user.save();
    }
    
    res.json({ favoriteRoadmaps: user.favoriteRoadmaps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// REMOVE FROM FAVORITES - Roadmaps
router.delete("/favorites/roadmaps/:slug", verifyToken, async (req, res) => {
  try {
    const { slug } = req.params;
    const user = await User.findById(req.user._id);
    
    user.favoriteRoadmaps = user.favoriteRoadmaps.filter(s => s !== slug);
    await user.save();
    
    res.json({ favoriteRoadmaps: user.favoriteRoadmaps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// COMPLETE A TRAIL
router.post("/trails/complete", verifyToken, async (req, res) => {
  try {
    const { roadmapSlug, roadmapName, duration, rating, review, distance } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // Add completed trail
    user.completedTrails.push({
      roadmapSlug,
      roadmapName,
      duration,
      rating,
      review,
    });
    
    // Update stats
    user.totalTrails += 1;
    if (distance) user.totalDistance += distance;
    
    // Award points
    user.addPoints(50); // 50 points per trail completion
    
    // Check for badges
    const newBadges = [];
    
    // First trail badge
    if (user.totalTrails === 1) {
      newBadges.push({
        id: "first-trail",
        name: "Trail Blazer",
        icon: "🥾",
        description: "Completed your first trail",
      });
    }
    
    // 5 trails badge
    if (user.totalTrails === 5) {
      newBadges.push({
        id: "five-trails",
        name: "Explorer",
        icon: "🗺️",
        description: "Completed 5 trails",
      });
    }
    
    // 10 trails badge
    if (user.totalTrails === 10) {
      newBadges.push({
        id: "ten-trails",
        name: "Adventurer",
        icon: "⛰️",
        description: "Completed 10 trails",
      });
    }
    
    // Add new badges
    for (const badge of newBadges) {
      if (!user.badges.find(b => b.id === badge.id)) {
        user.badges.push(badge);
        user.addPoints(25); // Bonus points for badges
      }
    }
    
    await user.save();
    
    res.json({
      message: "Trail completed!",
      user: user.toJSON(),
      newBadges,
      pointsEarned: 50 + (newBadges.length * 25),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET USER STATS
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      totalTrails: user.totalTrails,
      totalDistance: user.totalDistance,
      points: user.points,
      level: user.level,
      badges: user.badges,
      completedTrails: user.completedTrails.length,
      favoritePlaces: user.favoritePlaces.length,
      favoriteRoadmaps: user.favoriteRoadmaps.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;