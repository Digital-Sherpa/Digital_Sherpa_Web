const express = require("express");
const router = express.Router();
const Place = require("../../models/Place");
const slugify = require("slugify");
const { deleteFromCloudinary, getPublicIdFromUrl } = require("../../config/cloudinary");

// GET all places (with pagination and search)
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

    const [places, total] = await Promise.all([
      Place.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Place.countDocuments(filter),
    ]);

    res.json({
      places,
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

// GET single place by ID
router.get("/:id", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }
    res.json(place);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE new place
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      coordinates,
      imageUrl,
      gallery,
      videoUrl,
      videos,
      address,
      openingHours,
      entryFee,
      workshopPrice,
      tags,
      hasWorkshop,
      isSponsored,
      audioUrl,
    } = req.body;

    // Generate slug from name
    const slug = slugify(name, { lower: true, strict: true });

    // Check if slug already exists
    const existingPlace = await Place.findOne({ slug });
    if (existingPlace) {
      return res.status(400).json({ message: "A place with this name already exists" });
    }

    const place = new Place({
      name,
      slug,
      description,
      category,
      subcategory,
      coordinates,
      imageUrl,
      gallery: gallery || [],
      videoUrl,
      videos: videos || [],
      address,
      openingHours,
      entryFee,
      workshopPrice,
      tags: tags || [],
      hasWorkshop: hasWorkshop || false,
      isSponsored: isSponsored || false,
      audioUrl: audioUrl || undefined,
    });

    const savedPlace = await place.save();
    res.status(201).json(savedPlace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// UPDATE place
router.put("/:id", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    const {
      name,
      description,
      category,
      subcategory,
      coordinates,
      imageUrl,
      gallery,
      videoUrl,
      videos,
      address,
      openingHours,
      entryFee,
      workshopPrice,
      tags,
      hasWorkshop,
      isSponsored,
      audioUrl,
    } = req.body;

    // Update slug if name changed
    if (name && name !== place.name) {
      const newSlug = slugify(name, { lower: true, strict: true });
      const existingPlace = await Place.findOne({ slug: newSlug, _id: { $ne: req.params.id } });
      if (existingPlace) {
        return res.status(400).json({ message: "A place with this name already exists" });
      }
      place.slug = newSlug;
    }

    // Update fields
    if (name !== undefined) place.name = name;
    if (description !== undefined) place.description = description;
    if (category !== undefined) place.category = category;
    if (subcategory !== undefined) place.subcategory = subcategory;
    if (coordinates !== undefined) place.coordinates = coordinates;
    if (imageUrl !== undefined) place.imageUrl = imageUrl;
    if (gallery !== undefined) place.gallery = gallery;
    if (videoUrl !== undefined) place.videoUrl = videoUrl;
    if (videos !== undefined) place.videos = videos;
    if (address !== undefined) place.address = address;
    if (openingHours !== undefined) place.openingHours = openingHours;
    if (entryFee !== undefined) place.entryFee = entryFee;
    if (workshopPrice !== undefined) place.workshopPrice = workshopPrice;
    if (tags !== undefined) place.tags = tags;
    if (hasWorkshop !== undefined) place.hasWorkshop = hasWorkshop;
    if (isSponsored !== undefined) place.isSponsored = isSponsored;
    if (audioUrl !== undefined) place.audioUrl = audioUrl;

    const updatedPlace = await place.save();
    res.json(updatedPlace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE place
router.delete("/:id", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    // Optionally delete images from Cloudinary
    const deleteMedia = req.query.deleteMedia === "true";
    if (deleteMedia) {
      if (place.imageUrl) {
        try {
          const publicId = getPublicIdFromUrl(place.imageUrl);
          if (publicId) await deleteFromCloudinary(publicId);
        } catch (e) {
          console.error("Failed to delete main image:", e);
        }
      }

      for (const imgUrl of place.gallery || []) {
        try {
          const publicId = getPublicIdFromUrl(imgUrl);
          if (publicId) await deleteFromCloudinary(publicId);
        } catch (e) {
          console.error("Failed to delete gallery image:", e);
        }
      }

      if (place.videoUrl) {
        try {
          const publicId = getPublicIdFromUrl(place.videoUrl);
          if (publicId) await deleteFromCloudinary(publicId, "video");
        } catch (e) {
          console.error("Failed to delete video:", e);
        }
      }
    }

    // ===== CASCADE DELETE: Remove this place from all roadmaps =====
    const Roadmap = require("../../models/Roadmap");
    
    // Remove from stops array
    await Roadmap.updateMany(
      { "stops.placeSlug": place.slug },
      { $pull: { stops: { placeSlug: place.slug } } }
    );

    // Remove from sponsoredStops array
    await Roadmap.updateMany(
      { "sponsoredStops.placeSlug": place.slug },
      { $pull: { sponsoredStops: { placeSlug: place.slug } } }
    );

    // Re-order remaining stops in affected roadmaps
    const affectedRoadmaps = await Roadmap.find({
      $or: [
        { "stops.placeSlug": place.slug },
        { "sponsoredStops.placeSlug": place.slug }
      ]
    });

    // Fix stop order numbers after removal
    for (const roadmap of await Roadmap.find()) {
      if (roadmap.stops.length > 0) {
        const reorderedStops = roadmap.stops
          .sort((a, b) => a.order - b.order)
          .map((stop, index) => ({
            ...stop.toObject(),
            order: index + 1
          }));
        
        roadmap.stops = reorderedStops;
        await roadmap.save();
      }
    }

    console.log(`🗑️ Removed place "${place.slug}" from all roadmaps`);
    // ===== END CASCADE DELETE =====

    await Place.findByIdAndDelete(req.params.id);
    res.json({ 
      message: "Place deleted successfully",
      cascadeInfo: "Place removed from all roadmaps"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
