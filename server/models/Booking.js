const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  // User who made the booking
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  // What they're booking
  bookingType: { 
    type: String, 
    enum: ["workshop", "craftsman"], 
    required: true 
  },
  
  // Place-based workshop booking
  placeSlug: { type: String },
  placeName: { type: String },
  
  // Craftsman-based booking
  craftsmanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Craftsman" 
  },
  craftsmanName: { type: String },
  
  // Workshop details
  workshopType: { type: String }, // e.g., "Half Day", "Full Day", "Pottery Making"
  
  // Booking schedule
  bookingDate: { type: Date, required: true },
  duration: { type: String }, // e.g., "3 hours", "Full Day"
  numberOfPeople: { type: Number, default: 1 },
  
  // Price
  totalPrice: { type: Number, required: true },
  
  // Status
  status: { 
    type: String, 
    enum: ["pending", "confirmed", "cancelled", "completed"], 
    default: "confirmed" // Auto-confirm for hackathon simplicity
  },
  
  // User notes
  notes: { type: String },
  
  // Cancellation info
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update timestamp on save
bookingSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if booking can be cancelled (more than 7 days before booking date)
bookingSchema.methods.canCancel = function() {
  if (this.status === "cancelled" || this.status === "completed") {
    return false;
  }
  
  const now = new Date();
  const bookingDate = new Date(this.bookingDate);
  const daysUntilBooking = Math.ceil((bookingDate - now) / (1000 * 60 * 60 * 24));
  
  return daysUntilBooking > 7;
};

// Virtual to get days until booking
bookingSchema.virtual("daysUntilBooking").get(function() {
  const now = new Date();
  const bookingDate = new Date(this.bookingDate);
  return Math.ceil((bookingDate - now) / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON
bookingSchema.set("toJSON", { virtuals: true });
bookingSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Booking", bookingSchema);
