const mongoose = require("mongoose");
const { statusEnm } = require("../utils/enum");
const Schema = mongoose.Schema;

const contentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    modelId: {
      type: Schema.Types.ObjectId,
      ref: "Model",
      default: null,
    },
    contentType: {
      type: String,
      enum: ["Image", "Video"],
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    makeCover: {
      type: Boolean,
      default: false,
    },
    makePlus: {
      type: Boolean,
      default: false,
    },
    access: {
      type: [String],
      default: [],
    },
    preAccess: {
      type: [String],
      default: [],
    },
    verified: {
      type: String,
      enum: statusEnm,
      default: "Pending",
      required: true,
    },
    reason: {
      type: String,
      default: null,
    },
    docUrl: {
      type: String,
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

contentSchema.index({ userId: 1, contentType: 1, isPublic: 1, verified: 1 });

module.exports = mongoose.model("Content", contentSchema);
