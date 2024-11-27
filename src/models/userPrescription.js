const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const prescriptionSchema = new Schema(
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
    refDoctor: {
      type: Schema.Types.ObjectId,
      ref: "doctorProfile",
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

prescriptionSchema.index({ date: 1 });

module.exports = mongoose.model("PatientPrescription", prescriptionSchema);