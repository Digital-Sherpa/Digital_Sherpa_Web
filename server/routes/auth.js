const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { 
  generateTokens, 
  verifyToken, 
  JWT_SECRET, 
  JWT_REFRESH_SECRET 
} = require("../middleware/auth");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    // Create user (role defaults to 'user', admin can only be set by superadmin)
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: "user", // Always start as user
    });
    
    await user.save();
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.status(201).json({
      message: "Registration successful",
      user: user.toJSON(),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
});

// REFRESH TOKEN
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

// GET CURRENT USER
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE PROFILE
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const allowedUpdates = [
      "name", "bio", "location", "phone", "languages", 
      "avatar", "preferences"
    ];
    
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    updates.updatedAt = Date.now();
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    );
    
    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CHANGE PASSWORD
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    
    // Get user with password
    const user = await User.findById(req.user._id).select("+password");
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    res.json({
      message: "Password changed successfully",
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGOUT (client-side mainly, but can blacklist tokens later)
router.post("/logout", verifyToken, async (req, res) => {
  // In a production app, you might want to blacklist the token
  res.json({ message: "Logged out successfully" });
});

module.exports = router;