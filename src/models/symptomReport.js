const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const symptomReportSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "PatientProfile",
      default: null,
    },
    age: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    weight: {
      type: Number,
      default: null,
    },
    symptoms: {
      type: String,
      default: null,
    },
    symptomReport: {
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

symptomReportSchema.index({ patientId: 1 });

module.exports = mongoose.model("PatientSymptomReports", symptomReportSchema);
