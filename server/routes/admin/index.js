const express = require("express");
const router = express.Router();

// Import admin route modules
const placesRoutes = require("./places");
const craftsmenRoutes = require("./craftsmen");
const roadmapsRoutes = require("./roadmaps");
const uploadRoutes = require("./upload");
const usersRoutes = require("./users");

// Mount routes
router.use("/places", placesRoutes);
router.use("/craftsmen", craftsmenRoutes);
router.use("/roadmaps", roadmapsRoutes);
router.use("/upload", uploadRoutes);
router.use("/users", usersRoutes);

// Dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const Place = require("../../models/Place");
    const Craftsman = require("../../models/Craftsman");
    const Roadmap = require("../../models/Roadmap");
    const User = require("../../models/User");

    const [
      placesCount, 
      craftsmenCount, 
      roadmapsCount, 
      usersCount,
      workshopPlaces, 
      activeCraftsmen, 
      activeRoadmaps,
      activeUsers,
      adminUsers,
    ] = await Promise.all([
      Place.countDocuments(),
      Craftsman.countDocuments(),
      Roadmap.countDocuments(),
      User.countDocuments(),
      Place.countDocuments({ hasWorkshop: true }),
      Craftsman.countDocuments({ isAvailable: true }),
      Roadmap.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: { $in: ["admin", "superadmin"] } }),
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
      users: {
        total: usersCount,
        active: activeUsers,
        admins: adminUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
