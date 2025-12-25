const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { verifyToken } = require("../middleware/auth");

// All routes require authentication
router.use(verifyToken);

// GET user's bookings
router.get("/my-bookings", async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ bookingDate: -1 })
      .populate("craftsmanId", "name imageUrl specialty");
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single booking
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    }).populate("craftsmanId", "name imageUrl specialty");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE booking
router.post("/", async (req, res) => {
  try {
    const {
      bookingType,
      placeSlug,
      placeName,
      craftsmanId,
      craftsmanName,
      workshopType,
      bookingDate,
      duration,
      numberOfPeople,
      totalPrice,
      notes,
    } = req.body;

    // Validate required fields
    if (!bookingType || !bookingDate || !totalPrice) {
      return res.status(400).json({ 
        message: "Missing required fields: bookingType, bookingDate, totalPrice" 
      });
    }

    // Create booking
    const booking = new Booking({
      userId: req.user.id,
      bookingType,
      placeSlug,
      placeName,
      craftsmanId,
      craftsmanName,
      workshopType,
      bookingDate: new Date(bookingDate),
      duration,
      numberOfPeople: numberOfPeople || 1,
      totalPrice,
      notes,
      status: "confirmed", // Auto-confirm for hackathon
    });

    const savedBooking = await booking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// CANCEL booking
router.patch("/:id/cancel", async (req, res) => {
  try {
    const booking = await Booking.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if already cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    // Check if completed
    if (booking.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel a completed booking" });
    }

    // Check 7-day cancellation window
    if (!booking.canCancel()) {
      const daysUntil = booking.daysUntilBooking;
      return res.status(400).json({ 
        message: `Cannot cancel booking within 7 days of the scheduled date. Your booking is in ${daysUntil} day(s).`,
        daysUntilBooking: daysUntil,
        canCancel: false
      });
    }

    // Cancel the booking
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || "Cancelled by user";
    
    await booking.save();
    
    res.json({ 
      message: "Booking cancelled successfully", 
      booking 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
