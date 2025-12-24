const express = require("express");
const router = express.Router();
const { cloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require("../../config/cloudinary");
const { uploadSingle, uploadMultiple } = require("../../middleware/upload");

// Upload single file (image or video)
router.post("/single", (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
      resourceType: req.file.mimetype.startsWith("video/") ? "video" : "image",
      originalName: req.file.originalname,
      size: req.file.size,
    });
  });
});

// Upload multiple files
router.post("/multiple", (req, res) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({ message: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedFiles = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
      resourceType: file.mimetype.startsWith("video/") ? "video" : "image",
      originalName: file.originalname,
      size: file.size,
    }));

    res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
    });
  });
});

// Delete file from Cloudinary
router.delete("/delete", async (req, res) => {
  try {
    const { url, publicId, resourceType = "image" } = req.body;

    let idToDelete = publicId;
    if (!idToDelete && url) {
      idToDelete = getPublicIdFromUrl(url);
    }

    if (!idToDelete) {
      return res.status(400).json({ message: "No publicId or url provided" });
    }

    const result = await deleteFromCloudinary(idToDelete, resourceType);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
