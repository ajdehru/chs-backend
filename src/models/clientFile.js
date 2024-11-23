const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clientFileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    clientId: {
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
    makeProfile: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("ClientFile", clientFileSchema);
