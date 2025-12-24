const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../config/cloudinary");

// Dynamic storage based on file type
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "digital_sherpa";
    let resourceType = "image";
    let transformation = [];

    // Determine folder based on route
    if (req.baseUrl.includes("places") || req.originalUrl.includes("places")) {
      folder = "digital_sherpa/places";
    } else if (req.baseUrl.includes("craftsmen") || req.originalUrl.includes("craftsmen")) {
      folder = "digital_sherpa/craftsmen";
    } else if (req.baseUrl.includes("roadmaps") || req.originalUrl.includes("roadmaps")) {
      folder = "digital_sherpa/roadmaps";
    }

    // Check if video
    if (file.mimetype.startsWith("video/")) {
      resourceType = "video";
      folder = "digital_sherpa/videos";
    } else {
      // Image transformations
      transformation = [
        { width: 1200, height: 800, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ];
    }

    return {
      folder,
      resource_type: resourceType,
      transformation: resourceType === "image" ? transformation : undefined,
      public_id: `${Date.now()}-${file.originalname.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_")}`,
    };
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const allowedVideoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];

  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images (jpg, png, webp, gif) and videos (mp4, mov, webm) are allowed."), false);
  }
};

// Single file upload
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
}).single("file");

// Multiple files upload
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
}).array("files", 10);

module.exports = {
  uploadSingle,
  uploadMultiple,
};
