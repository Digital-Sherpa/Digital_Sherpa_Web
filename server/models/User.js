const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const badgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String },
  earnedAt: { type: Date, default: Date.now },
  description: { type: String },
});

const completedTrailSchema = new mongoose.Schema({
  roadmapSlug: { type: String, required: true },
  roadmapName: { type: String },
  completedAt: { type: Date, default: Date.now },
  duration: { type: Number }, // in minutes
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false, // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["user", "admin", "superadmin"],
    default: "user",
  },
  
  // Profile info
  bio: { type: String, maxlength: 500 },
  location: { type: String },
  phone: { type: String },
  languages: [{ type: String }],
  
  // Preferences
  preferences: {
    favoriteCategories: [{ type: String }],
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
  },
  
  // Gamification
  badges: [badgeSchema],
  completedTrails: [completedTrailSchema],
  totalDistance: { type: Number, default: 0 }, // in km
  totalTrails: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  
  // Favorites
  favoritePlaces: [{ type: String }], // place slugs
  favoriteRoadmaps: [{ type: String }], // roadmap slugs
  
  // Account status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  
  // Timestamps
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate level based on points
userSchema.methods.calculateLevel = function () {
  const pointsPerLevel = 100;
  this.level = Math.floor(this.points / pointsPerLevel) + 1;
  return this.level;
};

// Add points and recalculate level
userSchema.methods.addPoints = function (points) {
  this.points += points;
  this.calculateLevel();
  return this;
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model("User", userSchema);