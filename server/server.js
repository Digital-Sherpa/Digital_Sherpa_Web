const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: "../.env" });

const { verifyToken, isAdmin } = require("./middleware/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ============ PUBLIC ROUTES ============
app.use("/api/auth", require("./routes/auth"));
app.use("/api/places", require("./routes/places"));
app.use("/api/roadmaps", require("./routes/roadmaps"));
app.use("/api/craftsmen", require("./routes/craftsmen"));
app.use("/api/events", require("./routes/events"));

// ============ PROTECTED USER ROUTES ============
app.use("/api/users", verifyToken, require("./routes/users"));
app.use("/api/journeys", verifyToken, require("./routes/journeys"));

// ============ PROTECTED ADMIN ROUTES ============
app.use("/api/admin", verifyToken, isAdmin, require("./routes/admin"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));