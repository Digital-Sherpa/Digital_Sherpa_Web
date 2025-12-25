const express = require("express");
const router = express.Router();
const Craftsman = require("../../models/Craftsman");
const slugify = require("slugify");
const { deleteFromCloudinary, getPublicIdFromUrl } = require("../../config/cloudinary");

// GET all craftsmen (with pagination)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, search, specialty } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }
    if (specialty) {
      filter.specialty = specialty;
    }

    const [craftsmen, total] = await Promise.all([
      Craftsman.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Craftsman.countDocuments(filter),
    ]);

    res.json({
      craftsmen,
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

// GET single craftsman
router.get("/:id", async (req, res) => {
  try {
    const craftsman = await Craftsman.findById(req.params.id);
    if (!craftsman) {
      return res.status(404).json({ message: "Craftsman not found" });
    }
    res.json(craftsman);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE craftsman
router.post("/", async (req, res) => {
  try {
    const {
      name,
      photo,
      bio,
      gallery,
      specialty,
      placeSlug,
      experience,
      location,
      contact,
      languages,
      workshopTypes,
      rating,
      reviewCount,
      isAvailable,
    } = req.body;

    const slug = slugify(name, { lower: true, strict: true });

    const existingCraftsman = await Craftsman.findOne({ slug });
    if (existingCraftsman) {
      return res.status(400).json({ message: "A craftsman with this name already exists" });
    }

    const craftsman = new Craftsman({
      name,
      slug,
      photo,
      bio,
      gallery: gallery || [],
      specialty: specialty || [],
      placeSlug,
      experience,
      location,
      contact: contact || {},
      languages: languages || [],
      workshopTypes: workshopTypes || [],
      rating: rating || 0,
      reviewCount: reviewCount || 0,
      isAvailable: isAvailable !== false,
    });

    const savedCraftsman = await craftsman.save();
    res.status(201).json(savedCraftsman);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE craftsman
router.put("/:id", async (req, res) => {
  try {
    const craftsman = await Craftsman.findById(req.params.id);
    if (!craftsman) {
      return res.status(404).json({ message: "Craftsman not found" });
    }

    const {
      name,
      photo,
      bio,
      gallery,
      specialty,
      placeSlug,
      experience,
      location,
      contact,
      languages,
      workshopTypes,
      rating,
      reviewCount,
      isAvailable,
    } = req.body;

    if (name && name !== craftsman.name) {
      const newSlug = slugify(name, { lower: true, strict: true });
      const existing = await Craftsman.findOne({ slug: newSlug, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ message: "A craftsman with this name already exists" });
      }
      craftsman.slug = newSlug;
    }

    if (name !== undefined) craftsman.name = name;
    if (photo !== undefined) craftsman.photo = photo;
    if (bio !== undefined) craftsman.bio = bio;
    if (gallery !== undefined) craftsman.gallery = gallery;
    if (specialty !== undefined) craftsman.specialty = specialty;
    if (placeSlug !== undefined) craftsman.placeSlug = placeSlug;
    if (experience !== undefined) craftsman.experience = experience;
    if (location !== undefined) craftsman.location = location;
    if (contact !== undefined) craftsman.contact = contact;
    if (languages !== undefined) craftsman.languages = languages;
    if (workshopTypes !== undefined) craftsman.workshopTypes = workshopTypes;
    if (rating !== undefined) craftsman.rating = rating;
    if (reviewCount !== undefined) craftsman.reviewCount = reviewCount;
    if (isAvailable !== undefined) craftsman.isAvailable = isAvailable;

    const updatedCraftsman = await craftsman.save();
    res.json(updatedCraftsman);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE craftsman
router.delete("/:id", async (req, res) => {
  try {
    const craftsman = await Craftsman.findById(req.params.id);
    if (!craftsman) {
      return res.status(404).json({ message: "Craftsman not found" });
    }

    if (req.query.deleteMedia === "true" && craftsman.photo) {
      try {
        const publicId = getPublicIdFromUrl(craftsman.photo);
        if (publicId) await deleteFromCloudinary(publicId);
      } catch (e) {
        console.error("Failed to delete image:", e);
      }
    }

    await Craftsman.findByIdAndDelete(req.params.id);
    res.json({ message: "Craftsman deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
