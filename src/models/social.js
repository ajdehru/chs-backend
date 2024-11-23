const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const socialMediaSchema = new Schema(
  {
    modelId: {
      type: Schema.Types.ObjectId,
      ref: "Model",
      required: true,
      index: true,
    },
    socialMediaAccounts: {
      type: Map,
      of: String,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

socialMediaSchema.index({ socialMediaAccounts: 1 });

module.exports = mongoose.model("SocialMedia", socialMediaSchema);
