const mongoose = require("mongoose");
const { statusEnm } = require("../utils/enum");
const Schema = mongoose.Schema;

const docVerificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    modelId: {
      type: Schema.Types.ObjectId,
      ref: "Model",
      default: null,
    },
    verificationType: {
      type: String,
      enum: ["Identity", "Selfie", "Size"],
      required: true,
    },
    documentKey: {
      type: String,
      required: true,
    },
    documentURL: {
      type: String,
      required: true,
    },
    reasonForStatus: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: statusEnm,
      default: "Pending",
      required: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Index for quick lookup by status and verification type
docVerificationSchema.index({ userId: 1, verificationType: 1, status: 1 });

module.exports = mongoose.model("ModelDocument", docVerificationSchema);
