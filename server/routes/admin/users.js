const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const { isSuperAdmin } = require("../../middleware/auth");

// GET all users (with pagination)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      filter.role = role;
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
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

// GET single user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE user role (superadmin only)
router.put("/:id/role", isSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!["user", "admin", "superadmin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    // Prevent changing own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "Role updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// TOGGLE user active status
router.put("/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;
    
    // Prevent deactivating own account
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot deactivate your own account" });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: `User ${isActive ? "activated" : "deactivated"}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// RESET user password (admin sets temporary password)
router.put("/:id/reset-password", async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE user
router.delete("/:id", isSuperAdmin, async (req, res) => {
  try {
    // Prevent deleting own account
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET user statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const [totalUsers, activeUsers, adminUsers, recentUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: { $in: ["admin", "superadmin"] } }),
      User.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      }),
    ]);

    res.json({
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;