const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pharmaProfileSchema = new Schema(
  {
    firstName: {
      type: String,
      default: null,
    },
    lastName: {
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

// pharmaProfileSchema.index({ availability: 1 });

module.exports = mongoose.model("PharmaProfile", pharmaProfileSchema);
