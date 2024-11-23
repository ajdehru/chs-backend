const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const subscriptionSchema = new Schema(
  {
    name: {
      type: String,
      enum: ["Regular_Client", "Elite_Client", "Gent", "Elite_Gent","Exclusive_Elite_Gent"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      enum: ["Month", "Year"],
      default: "Month",
    },
    details: {
      type: [String],
      default: null,
    },
    characterCount: {
      type: Number,
      default: 300,
    },
    uploadLimit: {
      type: Number,
      default: 10,
    },
    stripePriceId:{
      type: String,
      required: true,
    },
    stripeProductId:{
      type: String,
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

module.exports = mongoose.model("Subscription", subscriptionSchema);
