const express = require("express");
const router = express.Router();

// Import admin route modules
const placesRoutes = require("./places");
const craftsmenRoutes = require("./craftsmen");
const roadmapsRoutes = require("./roadmaps");
const uploadRoutes = require("./upload");

// Mount routes
router.use("/places", placesRoutes);
router.use("/craftsmen", craftsmenRoutes);
router.use("/roadmaps", roadmapsRoutes);
router.use("/upload", uploadRoutes);

// Dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const Place = require("../../models/Place");
    const Craftsman = require("../../models/Craftsman");
    const Roadmap = require("../../models/Roadmap");

    const [placesCount, craftsmenCount, roadmapsCount, workshopPlaces, activeCraftsmen, activeRoadmaps] =
      await Promise.all([
        Place.countDocuments(),
        Craftsman.countDocuments(),
        Roadmap.countDocuments(),
        Place.countDocuments({ hasWorkshop: true }),
        Craftsman.countDocuments({ isAvailable: true }),
        Roadmap.countDocuments({ isActive: true }),
      ]);

    // Get category breakdown
    const placesByCategory = await Place.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const roadmapsByCategory = await Roadmap.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json({
      places: {
        total: placesCount,
        withWorkshop: workshopPlaces,
        byCategory: placesByCategory,
      },
      craftsmen: {
        total: craftsmenCount,
        available: activeCraftsmen,
      },
      roadmaps: {
        total: roadmapsCount,
        active: activeRoadmaps,
        byCategory: roadmapsByCategory,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
