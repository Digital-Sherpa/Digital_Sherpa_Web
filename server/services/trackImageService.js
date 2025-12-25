const cloudinary = require('../config/cloudinary');
// Mock Canvas for Windows environments where installation is difficult
const generateAndUpload = async (coordinates, stats, roadmapName) => {
  console.log('Mocking track image generation for:', roadmapName);
  
  // Return a placeholder image or a default one
  // In a real scenario without canvas, we might use a static map API or similar
  return {
    url: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
    publicId: 'sample',
    format: 'jpg'
  };
};

const generateForDownload = async (coordinates, stats, roadmapName, options = {}) => {
  console.log('Mocking track image download for:', roadmapName);
  // Return a simple buffer (e.g., a 1x1 pixel)
  const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  return buffer;
};

module.exports = {
  generateAndUpload,
  generateForDownload,
};
