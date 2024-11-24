const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const patientProfileSchema = new Schema(
  {
    patientId: {
      type: String,
      default: null,
    },
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
    birthDate: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      default: null,
    },
    age: {
      type: Number,
      default: null,
    },
    bloodGroup: {
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
    pinCode: {
      type: Number,
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

patientProfileSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

patientProfileSchema.index({ bloodGroup: 1 });
patientProfileSchema.index({ city: 1 });

module.exports = mongoose.model("patientProfile", patientProfileSchema);
