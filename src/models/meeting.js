const mongoose = require("mongoose");
const { statusEnm } = require("../utils/enum");
const Schema = mongoose.Schema;

const meetingSchema = new Schema(
  {
    hostUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    participantUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    scheduledTime: {
      type: String,
      default: null,
    },
    location: {
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: null,
      },
      default: {},
    },
    status: {
      type: String,
      enum: statusEnm,
      default: "Pending",
    },
    message: {
      type: String,
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
    timestamps: true,
  }
);

module.exports = mongoose.model("Meeting", meetingSchema);
