const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("./models/User");

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Check if superadmin exists
    const existingAdmin = await User.findOne({ role: "superadmin" });
    if (existingAdmin) {
      console.log("⚠️ Superadmin already exists:", existingAdmin.email);
      process.exit(0);
    }

    // Create superadmin
    const superadmin = new User({
      name: "Super Admin",
      email: "admin@digitalsherpa.com",
      password: "admin123", // Change this in production!
      role: "superadmin",
      isVerified: true,
      isActive: true,
    });

    await superadmin.save();
    console.log("✅ Superadmin created successfully!");
    console.log("   Email: admin@digitalsherpa.com");
    console.log("   Password: admin123");
    console.log("   ⚠️ Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();