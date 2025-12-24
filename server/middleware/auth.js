const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// Generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "15m" }
  );
  
  const refreshToken = jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  
  return { accessToken, refreshToken };
};

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

// Check if user is superadmin
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  
  next();
};

module.exports = {
  generateTokens,
  verifyToken,
  optionalAuth,
  isAdmin,
  isSuperAdmin,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
};