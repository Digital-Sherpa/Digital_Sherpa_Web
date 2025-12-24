const express = require("express");
const router = express.Router();
const Roadmap = require("../../models/Roadmap");
const Place = require("../../models/Place");
const slugify = require("slugify");

// GET all roadmaps (with pagination) - ADD VALIDATION INFO
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
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

    const [roadmaps, total] = await Promise.all([
      Roadmap.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Roadmap.countDocuments(filter),
    ]);

    // Check for invalid stops in each roadmap
    const roadmapsWithValidation = await Promise.all(
      roadmaps.map(async (roadmap) => {
        const placeSlugs = roadmap.stops.map(s => s.placeSlug);
        const existingPlaces = await Place.find({ slug: { $in: placeSlugs } });
        const existingSlugs = existingPlaces.map(p => p.slug);
        
        const invalidStops = roadmap.stops.filter(s => !existingSlugs.includes(s.placeSlug));
        const validStopCount = roadmap.stops.length - invalidStops.length;
        
        return {
          ...roadmap.toObject(),
          _validation: {
            totalStops: roadmap.stops.length,
            validStops: validStopCount,
            invalidStops: invalidStops.map(s => s.placeSlug),
            hasIssues: invalidStops.length > 0,
            isNavigable: validStopCount >= 2
          }
        };
      })
    );

    res.json({
      roadmaps: roadmapsWithValidation,
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

// GET single roadmap with places
router.get("/:id", async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    const placeSlugs = [
      ...roadmap.stops.map((s) => s.placeSlug),
      ...roadmap.sponsoredStops.map((s) => s.placeSlug),
    ];

    const places = await Place.find({ slug: { $in: placeSlugs } });

    res.json({
      roadmap,
      places,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE roadmap
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      difficulty,
      duration,
      distance,
      imageUrl,
      color,
      icon,
      stops,
      sponsoredStops,
      tags,
      isActive,
    } = req.body;

    const slug = slugify(name, { lower: true, strict: true });

    const existingRoadmap = await Roadmap.findOne({ slug });
    if (existingRoadmap) {
      return res.status(400).json({ message: "A roadmap with this name already exists" });
    }

    // Validate that all place slugs exist
    const allSlugs = [
      ...(stops || []).map((s) => s.placeSlug),
      ...(sponsoredStops || []).map((s) => s.placeSlug),
    ];

    if (allSlugs.length > 0) {
      const existingPlaces = await Place.find({ slug: { $in: allSlugs } });
      const existingSlugs = existingPlaces.map((p) => p.slug);
      const missingSlugs = allSlugs.filter((s) => !existingSlugs.includes(s));

      if (missingSlugs.length > 0) {
        return res.status(400).json({
          message: `The following places do not exist: ${missingSlugs.join(", ")}`,
        });
      }
    }

    const roadmap = new Roadmap({
      name,
      slug,
      description,
      category,
      difficulty: difficulty || "easy",
      duration,
      distance,
      imageUrl,
      color: color || "#333333",
      icon,
      stops: stops || [],
      sponsoredStops: sponsoredStops || [],
      tags: tags || [],
      isActive: isActive !== false,
    });

    const savedRoadmap = await roadmap.save();
    res.status(201).json(savedRoadmap);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE roadmap
router.put("/:id", async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    const {
      name,
      description,
      category,
      difficulty,
      duration,
      distance,
      imageUrl,
      color,
      icon,
      stops,
      sponsoredStops,
      tags,
      isActive,
    } = req.body;

    if (name && name !== roadmap.name) {
      const newSlug = slugify(name, { lower: true, strict: true });
      const existing = await Roadmap.findOne({ slug: newSlug, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ message: "A roadmap with this name already exists" });
      }
      roadmap.slug = newSlug;
    }

    // Validate place slugs if stops are being updated
    if (stops || sponsoredStops) {
      const allSlugs = [
        ...(stops || roadmap.stops).map((s) => s.placeSlug),
        ...(sponsoredStops || roadmap.sponsoredStops).map((s) => s.placeSlug),
      ];

      if (allSlugs.length > 0) {
        const existingPlaces = await Place.find({ slug: { $in: allSlugs } });
        const existingSlugs = existingPlaces.map((p) => p.slug);
        const missingSlugs = allSlugs.filter((s) => !existingSlugs.includes(s));

        if (missingSlugs.length > 0) {
          return res.status(400).json({
            message: `The following places do not exist: ${missingSlugs.join(", ")}`,
          });
        }
      }
    }

    if (name !== undefined) roadmap.name = name;
    if (description !== undefined) roadmap.description = description;
    if (category !== undefined) roadmap.category = category;
    if (difficulty !== undefined) roadmap.difficulty = difficulty;
    if (duration !== undefined) roadmap.duration = duration;
    if (distance !== undefined) roadmap.distance = distance;
    if (imageUrl !== undefined) roadmap.imageUrl = imageUrl;
    if (color !== undefined) roadmap.color = color;
    if (icon !== undefined) roadmap.icon = icon;
    if (stops !== undefined) roadmap.stops = stops;
    if (sponsoredStops !== undefined) roadmap.sponsoredStops = sponsoredStops;
    if (tags !== undefined) roadmap.tags = tags;
    if (isActive !== undefined) roadmap.isActive = isActive;

    const updatedRoadmap = await roadmap.save();
    res.json(updatedRoadmap);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE roadmap
router.delete("/:id", async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    await Roadmap.findByIdAndDelete(req.params.id);
    res.json({ message: "Roadmap deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
