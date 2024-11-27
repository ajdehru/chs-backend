const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportsSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "patientProfile",
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    // refDoctor: {
    //   type: Schema.Types.ObjectId,
    //   ref: "doctorProfile",
    //   default: null,
    // },
    description: {
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

reportsSchema.index({ date: 1 });

module.exports = mongoose.model("PatientReports", reportsSchema);