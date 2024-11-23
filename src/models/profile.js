const mongoose = require("mongoose");
const { statusEnm } = require("../utils/enum");
const Schema = mongoose.Schema;

const profileSchema = new Schema(
  {
    heading: {
      type: String,
      maxlength: 50,
      validate: {
        validator: function (v) {
          return /^[^\d]+$/.test(v);
        },
        message: "Heading should not contain digits.",
      },
      default: null,
    },
    bio: {
      type: String,
      maxlength: 1000,
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
    verification_status: {
      type: String,
      enum: statusEnm,
      default: "Pending",
    },
    visible_to: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },
    social_media: {
      type: Schema.Types.ObjectId,
      ref: "SocialMedia",
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

profileSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

profileSchema.index({ Verification_Status: 1 });
profileSchema.index({ Visible_To: 1 });

module.exports = mongoose.model("Profile", profileSchema);
