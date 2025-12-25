const express = require("express");
const router = express.Router();
const Event = require("../../models/Event");
const slugify = require("slugify");
const { deleteFromCloudinary, getPublicIdFromUrl } = require("../../config/cloudinary");

// GET all events (with pagination and filters)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, featured, upcoming } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category) {
      filter.category = category;
    }
    if (featured === 'true') {
      filter.isFeatured = true;
    }
    if (upcoming === 'true') {
      filter.startDate = { $gte: new Date() };
    }

    const [events, total] = await Promise.all([
      Event.find(filter).sort({ startDate: 1, createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({
      events,
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

// GET single event by ID
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new event
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay,
      isRecurring,
      recurringPattern,
      locations,
      imageUrl,
      gallery,
      videoUrl,
      entryFee,
      organizer,
      contactInfo,
      website,
      color,
      icon,
      tags,
      isFeatured,
      isActive,
    } = req.body;

    const slug = slugify(name, { lower: true, strict: true });

    // Check if slug already exists
    const existingEvent = await Event.findOne({ slug });
    if (existingEvent) {
      return res.status(400).json({ message: "An event with this name already exists" });
    }

    const event = new Event({
      name,
      slug,
      description,
      category: category || "festival",
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay: isAllDay || false,
      isRecurring: isRecurring || false,
      recurringPattern,
      locations: locations || [],
      imageUrl,
      gallery: gallery || [],
      videoUrl,
      entryFee: entryFee || { isFree: true },
      organizer,
      contactInfo,
      website,
      color: color || "#FF6B35",
      icon: icon || "🎉",
      tags: tags || [],
      isFeatured: isFeatured || false,
      isActive: isActive !== false,
    });

    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE event
router.put("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const {
      name,
      description,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay,
      isRecurring,
      recurringPattern,
      locations,
      imageUrl,
      gallery,
      videoUrl,
      entryFee,
      organizer,
      contactInfo,
      website,
      color,
      icon,
      tags,
      isFeatured,
      isActive,
    } = req.body;

    // Update slug if name changes
    if (name && name !== event.name) {
      const newSlug = slugify(name, { lower: true, strict: true });
      const existing = await Event.findOne({ slug: newSlug, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ message: "An event with this name already exists" });
      }
      event.slug = newSlug;
    }

    // Update fields
    if (name !== undefined) event.name = name;
    if (description !== undefined) event.description = description;
    if (category !== undefined) event.category = category;
    if (startDate !== undefined) event.startDate = startDate;
    if (endDate !== undefined) event.endDate = endDate;
    if (startTime !== undefined) event.startTime = startTime;
    if (endTime !== undefined) event.endTime = endTime;
    if (isAllDay !== undefined) event.isAllDay = isAllDay;
    if (isRecurring !== undefined) event.isRecurring = isRecurring;
    if (recurringPattern !== undefined) event.recurringPattern = recurringPattern;
    if (locations !== undefined) event.locations = locations;
    if (imageUrl !== undefined) event.imageUrl = imageUrl;
    if (gallery !== undefined) event.gallery = gallery;
    if (videoUrl !== undefined) event.videoUrl = videoUrl;
    if (entryFee !== undefined) event.entryFee = entryFee;
    if (organizer !== undefined) event.organizer = organizer;
    if (contactInfo !== undefined) event.contactInfo = contactInfo;
    if (website !== undefined) event.website = website;
    if (color !== undefined) event.color = color;
    if (icon !== undefined) event.icon = icon;
    if (tags !== undefined) event.tags = tags;
    if (isFeatured !== undefined) event.isFeatured = isFeatured;
    if (isActive !== undefined) event.isActive = isActive;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE event
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Delete associated images from Cloudinary
    if (event.imageUrl) {
      try {
        const publicId = getPublicIdFromUrl(event.imageUrl);
        if (publicId) await deleteFromCloudinary(publicId);
      } catch (e) {
        console.error("Failed to delete main image:", e);
      }
    }

    if (event.gallery && event.gallery.length > 0) {
      for (const imgUrl of event.gallery) {
        try {
          const publicId = getPublicIdFromUrl(imgUrl);
          if (publicId) await deleteFromCloudinary(publicId);
        } catch (e) {
          console.error("Failed to delete gallery image:", e);
        }
      }
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;