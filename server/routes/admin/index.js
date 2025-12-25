const express = require("express");
const router = express.Router();

// Import admin route modules
const placesRoutes = require("./places");
const craftsmenRoutes = require("./craftsmen");
const roadmapsRoutes = require("./roadmaps");
const uploadRoutes = require("./upload");
const usersRoutes = require("./users");
const eventsRoutes = require("./events");
const bookingsRoutes = require("./bookings");

// Mount routes
router.use("/places", placesRoutes);
router.use("/craftsmen", craftsmenRoutes);
router.use("/roadmaps", roadmapsRoutes);
router.use("/upload", uploadRoutes);
router.use("/users", usersRoutes);
router.use("/events", eventsRoutes);
router.use("/bookings", bookingsRoutes);

// Dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const Place = require("../../models/Place");
    const Craftsman = require("../../models/Craftsman");
    const Roadmap = require("../../models/Roadmap");
    const User = require("../../models/User");
    const Event = require("../../models/Event");
    const Booking = require("../../models/Booking");

    const [
      placesCount, 
      craftsmenCount, 
      roadmapsCount, 
      usersCount,
      eventsCount,
      workshopPlaces, 
      activeCraftsmen, 
      activeRoadmaps,
      activeUsers,
      adminUsers,
      featuredEvents,
      upcomingEvents,
      bookingsCount,
      confirmedBookings,
      pendingBookings,
    ] = await Promise.all([
      Place.countDocuments(),
      Craftsman.countDocuments(),
      Roadmap.countDocuments(),
      User.countDocuments(),
      Event.countDocuments(),
      Place.countDocuments({ hasWorkshop: true }),
      Craftsman.countDocuments({ isAvailable: true }),
      Roadmap.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: { $in: ["admin", "superadmin"] } }),
      Event.countDocuments({ isFeatured: true, isActive: true }),
      Event.countDocuments({ isActive: true, startDate: { $gte: new Date() } }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "pending" }),
    ]);

    // Get category breakdown
    const placesByCategory = await Place.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const roadmapsByCategory = await Roadmap.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const eventsByCategory = await Event.aggregate([
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
      events: {
        total: eventsCount,
        featured: featuredEvents,
        upcoming: upcomingEvents,
        byCategory: eventsByCategory,
      },
      bookings: {
        total: bookingsCount,
        confirmed: confirmedBookings,
        pending: pendingBookings,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
