const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Load env variables - different paths for dev vs production
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.join(__dirname, "../.env") });
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "digital_sherpa",
      serverSelectionTimeoutMS: 30000, // Increase timeout
      socketTimeoutMS: 45000,
    });
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

connectDB();

// Public Routes
app.use("/api/places", require("./routes/places"));
app.use("/api/roadmaps", require("./routes/roadmaps"));
app.use("/api/craftsmen", require("./routes/craftsmen"));

// Admin Routes
app.use("/api/admin", require("./routes/admin"));

// Health check with DB status
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Digital Sherpa API is running",
    dbState:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});