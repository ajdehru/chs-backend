const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const doctorProfileSchema = new Schema(
  {
    firstName: {
      type: String,
      default: null,
    },
    lastName: {
      type: String,
      default: null,
    },
    displayName: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: Number,
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    designation: {
      type: String,
      default: null,
    },
    languages: {
      type: [String],
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    availability: {
      type: Boolean,
      default: true,
    },
    achievement: {
      type: String,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

doctorProfileSchema.index({ availability: 1 });

module.exports = mongoose.model("DoctorProfile", doctorProfileSchema);
