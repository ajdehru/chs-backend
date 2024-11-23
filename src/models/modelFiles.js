const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const modelFileSchema = new Schema(
  {
    modelId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "createdAt" },
  }
);

module.exports = mongoose.model("ContentDocument", modelFileSchema);
