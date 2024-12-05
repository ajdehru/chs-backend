const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const doctorClinicSchema = new Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "DoctorProfile",
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    subDetail: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    days: {
      type: [String],
      default: null,
    },
    time: {
      type: String,
      default: null,
    },
    offDay: {
      type: String,
      default: null,
    },
    price: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["Open", "Close"],
      default: "Open",
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

doctorClinicSchema.index({ status: 1 });

module.exports = mongoose.model("DoctorClinic", doctorClinicSchema);
