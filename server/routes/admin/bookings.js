const express = require("express");
const router = express.Router();
const Booking = require("../../models/Booking");

// GET all bookings (with pagination)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { placeName: { $regex: search, $options: "i" } },
        { craftsmanName: { $regex: search, $options: "i" } },
        { workshopType: { $regex: search, $options: "i" } },
      ];
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("userId", "name email")
        .populate("craftsmanId", "name imageUrl"),
      Booking.countDocuments(filter),
    ]);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single booking
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("userId", "name email phone")
      .populate("craftsmanId", "name imageUrl specialty");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE booking status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.status = status;
    if (status === "cancelled") {
      booking.cancelledAt = new Date();
      booking.cancellationReason = req.body.reason || "Cancelled by admin";
    }

    await booking.save();
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE booking
router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET booking stats
router.get("/stats/summary", async (req, res) => {
  try {
    const [total, pending, confirmed, cancelled, completed] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.countDocuments({ status: "completed" }),
    ]);

    res.json({ total, pending, confirmed, cancelled, completed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
