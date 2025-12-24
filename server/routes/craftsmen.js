const express = require("express");
const router = express.Router();
const Craftsman = require("../models/Craftsman");

// GET all craftsmen
router.get("/", async (req, res) => {
  try {
    const { specialty, available } = req.query;
    let filter = {};
    if (specialty) filter.specialty = specialty;
    if (available === "true") filter.isAvailable = true;
    const craftsmen = await Craftsman.find(filter);
    res.json(craftsmen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single craftsman by slug
router.get("/:slug", async (req, res) => {
  try {
    const craftsman = await Craftsman.findOne({ slug: req.params.slug });
    if (!craftsman) return res.status(404).json({ message: "Craftsman not found" });
    res.json(craftsman);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new craftsman
router.post("/", async (req, res) => {
  try {
    const craftsman = new Craftsman(req.body);
    const savedCraftsman = await craftsman.save();
    res.status(201).json(savedCraftsman);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;