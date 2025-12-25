const express = require("express");
const router = express.Router();
const Journey = require("../models/Journey");
const User = require("../models/User");
const trackImageService = require("../services/trackImageService");

// Minimum recording duration in seconds (30 seconds)
const MIN_RECORDING_DURATION = 30;

// Badge definitions
const BADGE_DEFINITIONS = {
  FIRST_STEPS: {
    id: 'first_steps',
    name: 'First Steps',
    icon: '🥾',
    description: 'Complete your first journey recording',
    check: (stats) => stats.totalJourneys >= 1,
  },
  TRAIL_BLAZER: {
    id: 'trail_blazer',
    name: 'Trail Blazer',
    icon: '🔥',
    description: 'Complete 5 journey recordings',
    check: (stats) => stats.totalJourneys >= 5,
  },
  EXPLORER: {
    id: 'explorer',
    name: 'Explorer',
    icon: '🗺️',
    description: 'Record a total of 10km',
    check: (stats) => stats.totalDistance >= 10000,
  },
  ADVENTURER: {
    id: 'adventurer',
    name: 'Adventurer',
    icon: '⛰️',
    description: 'Record a total of 25km',
    check: (stats) => stats.totalDistance >= 25000,
  },
  MARATHON: {
    id: 'marathon',
    name: 'Marathon',
    icon: '🏃',
    description: 'Record a total of 42km',
    check: (stats) => stats.totalDistance >= 42000,
  },
};

/**
 * @route   POST /api/journeys/start
 * @desc    Start a new journey recording
 * @access  Private
 */
router.post("/start", async (req, res) => {
  try {
    const { roadmapSlug, roadmapName, title, initialCoordinate } = req.body;

    // Check if user has an active recording
    const activeRecording = await Journey.findOne({
      userId: req.user._id,
      status: { $in: ["recording", "paused"] },
    });

    if (activeRecording) {
      return res.status(400).json({
        message: "You already have an active recording. Please stop it first.",
        activeJourneyId: activeRecording._id,
      });
    }

    // Create new journey
    const journey = new Journey({
      userId: req.user._id,
      roadmapSlug: roadmapSlug || null,
      roadmapName: roadmapName || null,
      title: title || undefined,
      startTime: new Date(),
      status: "recording",
      coordinates: initialCoordinate ? [initialCoordinate] : [],
    });

    await journey.save();

    res.status(201).json({
      message: "Journey recording started",
      journey: {
        _id: journey._id,
        startTime: journey.startTime,
        status: journey.status,
      },
    });
  } catch (error) {
    console.error("Start journey error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   PUT /api/journeys/:id/track
 * @desc    Add GPS coordinates to journey (batch)
 * @access  Private
 */
router.put("/:id/track", async (req, res) => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
      return res.status(400).json({ message: "Coordinates array required" });
    }

    const journey = await Journey.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: { $in: ["recording", "paused"] },
    });

    if (!journey) {
      return res.status(404).json({ message: "Active journey not found" });
    }

    // Add new coordinates
    journey.coordinates.push(...coordinates);
    journey.status = "recording";
    await journey.save();

    // Calculate current stats
    const currentDistance = journey.calculateTotalDistance();
    const currentDuration = (new Date() - new Date(journey.startTime)) / 1000;

    res.json({
      message: "Coordinates added",
      stats: {
        distance: currentDistance,
        duration: currentDuration,
        pointCount: journey.coordinates.length,
      },
    });
  } catch (error) {
    console.error("Track journey error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   PUT /api/journeys/:id/pause
 * @desc    Pause journey recording
 * @access  Private
 */
router.put("/:id/pause", async (req, res) => {
  try {
    const journey = await Journey.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: "recording",
    });

    if (!journey) {
      return res.status(404).json({ message: "Active recording not found" });
    }

    journey.status = "paused";
    await journey.save();

    res.json({ message: "Recording paused", status: journey.status });
  } catch (error) {
    console.error("Pause journey error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   PUT /api/journeys/:id/resume
 * @desc    Resume paused journey recording
 * @access  Private
 */
router.put("/:id/resume", async (req, res) => {
  try {
    const journey = await Journey.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: "paused",
    });

    if (!journey) {
      return res.status(404).json({ message: "Paused recording not found" });
    }

    journey.status = "recording";
    await journey.save();

    res.json({ message: "Recording resumed", status: journey.status });
  } catch (error) {
    console.error("Resume journey error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   PUT /api/journeys/:id/stop
 * @desc    Stop journey recording and generate track image
 * @access  Private
 */
router.put("/:id/stop", async (req, res) => {
  try {
    const { title, notes } = req.body;

    const journey = await Journey.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: { $in: ["recording", "paused"] },
    });

    if (!journey) {
      return res.status(404).json({ message: "Active recording not found" });
    }

    // Set end time
    journey.endTime = new Date();
    
    // Calculate stats
    journey.calculateStats();

    // Check minimum duration
    if (journey.duration < MIN_RECORDING_DURATION) {
      journey.status = "cancelled";
      await journey.save();
      return res.status(400).json({
        message: `Recording too short. Minimum ${MIN_RECORDING_DURATION} seconds required.`,
        duration: journey.duration,
        status: "cancelled",
      });
    }

    // Check minimum coordinates
    if (journey.coordinates.length < 2) {
      journey.status = "cancelled";
      await journey.save();
      return res.status(400).json({
        message: "Not enough GPS points recorded.",
        status: "cancelled",
      });
    }

    // Update optional fields
    if (title) journey.title = title;
    if (notes) journey.notes = notes;

    // Generate and upload track image
    try {
      const trackImage = await trackImageService.generateAndUpload(
        journey.coordinates,
        {
          userId: req.user._id.toString(),
          journeyId: journey._id.toString(),
          distance: journey.distance,
          duration: journey.duration,
        }
      );
      journey.trackImage = trackImage;
    } catch (imageError) {
      console.error("Track image generation error:", imageError);
      // Continue without image - don't fail the whole request
    }

    journey.status = "completed";
    await journey.save();

    // Check and award badges
    const newBadges = await checkAndAwardBadges(req.user._id);

    // Update user stats
    await updateUserStats(req.user._id, journey);

    res.json({
      message: "Journey completed successfully",
      journey: {
        _id: journey._id,
        title: journey.title,
        distance: journey.distance,
        duration: journey.duration,
        stats: journey.stats,
        trackImage: journey.trackImage,
        status: journey.status,
      },
      newBadges,
    });
  } catch (error) {
    console.error("Stop journey error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   PUT /api/journeys/:id/cancel
 * @desc    Cancel journey recording
 * @access  Private
 */
router.put("/:id/cancel", async (req, res) => {
  try {
    const journey = await Journey.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: { $in: ["recording", "paused"] },
    });

    if (!journey) {
      return res.status(404).json({ message: "Active recording not found" });
    }

    journey.status = "cancelled";
    journey.endTime = new Date();
    await journey.save();

    res.json({ message: "Recording cancelled", status: journey.status });
  } catch (error) {
    console.error("Cancel journey error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/journeys
 * @desc    Get all journeys for current user
 * @access  Private
 */
router.get("/", async (req, res) => {
  try {
    const { status, limit = 20, page = 1, roadmapSlug } = req.query;

    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (roadmapSlug) query.roadmapSlug = roadmapSlug;

    const journeys = await Journey.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select("-coordinates"); // Exclude coordinates for list view

    const total = await Journey.countDocuments(query);

    res.json({
      journeys,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get journeys error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/journeys/active
 * @desc    Get current active recording (if any)
 * @access  Private
 */
router.get("/active", async (req, res) => {
  try {
    const journey = await Journey.findOne({
      userId: req.user._id,
      status: { $in: ["recording", "paused"] },
    });

    res.json({ journey });
  } catch (error) {
    console.error("Get active journey error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   GET /api/journeys/:id
 * @desc    Get single journey with full coordinates
 * @access  Private
 */
router.get("/:id", async (req, res) => {
  try {
    const journey = await Journey.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!journey) {
      return res.status(404).json({ message: "Journey not found" });
    }

    res.json({ journey });
  } catch (error) {
    console.error("Get journey error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   DELETE /api/journeys/:id
 * @desc    Delete a journey
 * @access  Private
 */
router.delete("/:id", async (req, res) => {
  try {
    const journey = await Journey.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!journey) {
      return res.status(404).json({ message: "Journey not found" });
    }

    // Delete track image from Cloudinary if exists
    if (journey.trackImage?.publicId) {
      const { deleteFromCloudinary } = require("../config/cloudinary");
      await deleteFromCloudinary(journey.trackImage.publicId).catch(console.error);
    }

    res.json({ message: "Journey deleted" });
  } catch (error) {
    console.error("Delete journey error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * @route   POST /api/journeys/:id/export
 * @desc    Export track image in specific format
 * @access  Private
 */
router.post("/:id/export", async (req, res) => {
  try {
    const { format = "png", transparent = false } = req.body;

    const journey = await Journey.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: "completed",
    });

    if (!journey) {
      return res.status(404).json({ message: "Completed journey not found" });
    }

    if (journey.coordinates.length < 2) {
      return res.status(400).json({ message: "Not enough coordinates" });
    }

    const imageBuffer = trackImageService.generateForDownload(
      journey.coordinates,
      {
        format,
        transparent,
        distance: journey.distance,
        duration: journey.duration,
      }
    );

    const contentType = format === "png" ? "image/png" : "image/jpeg";
    const filename = `journey_${journey._id}.${format}`;

    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": imageBuffer.length,
    });

    res.send(imageBuffer);
  } catch (error) {
    console.error("Export journey error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * Check and award badges to user
 */
async function checkAndAwardBadges(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    // Get user journey stats
    const stats = await Journey.aggregate([
      { $match: { userId, status: "completed" } },
      {
        $group: {
          _id: null,
          totalJourneys: { $sum: 1 },
          totalDistance: { $sum: "$distance" },
        },
      },
    ]);

    const userStats = stats[0] || { totalJourneys: 0, totalDistance: 0 };
    const newBadges = [];

    // Check each badge
    for (const [key, badge] of Object.entries(BADGE_DEFINITIONS)) {
      const alreadyHas = user.badges?.some((b) => b.id === badge.id);
      if (!alreadyHas && badge.check(userStats)) {
        const newBadge = {
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          description: badge.description,
          earnedAt: new Date(),
        };
        user.badges.push(newBadge);
        newBadges.push(newBadge);
      }
    }

    if (newBadges.length > 0) {
      // Add points for new badges
      user.points += newBadges.length * 50;
      user.calculateLevel();
      await user.save();
    }

    return newBadges;
  } catch (error) {
    console.error("Check badges error:", error);
    return [];
  }
}

/**
 * Update user stats after journey completion
 */
async function updateUserStats(userId, journey) {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        totalDistance: journey.distance / 1000, // Convert to km
        totalTrails: 1,
        points: Math.floor(journey.distance / 100), // 1 point per 100m
      },
    });
  } catch (error) {
    console.error("Update user stats error:", error);
  }
}

module.exports = router;
