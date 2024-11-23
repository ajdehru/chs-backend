const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const travelDateSchema = new Schema(
  {
    modelId: {
      type: Schema.Types.ObjectId,
      ref: "Model",
      required: true,
      index: true,
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
      default:{}
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
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

// Ensure startDate is before endDate
travelDateSchema.pre("save", function (next) {
  if (this.startDate >= this.endDate) {
    return next(new Error("Start date must be before end date."));
  }
  next();
});

travelDateSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("TravelDate", travelDateSchema);
