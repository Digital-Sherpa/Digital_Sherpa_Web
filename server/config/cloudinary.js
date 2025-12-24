const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    
    // Get everything after upload/v{version}/
    const pathParts = parts.slice(uploadIndex + 2);
    const filename = pathParts.join("/");
    // Remove file extension
    return filename.replace(/\.[^/.]+$/, "");
  } catch (e) {
    console.error("Error extracting public ID:", e);
    return null;
  }
};

module.exports = {
  cloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
