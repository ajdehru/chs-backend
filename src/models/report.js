const mongoose = require("mongoose");
const { statusEnm } = require("../utils/enum");
const Schema = mongoose.Schema;
 
const reportSchema = new Schema(
  {
    reporterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "contentType",
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ["User", "Model","Client", "Chat","Content"],
    },
    reportType: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    details: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    status: {
      type: String,
      enum: statusEnm,
      default: "Pending",
      index: true, 
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true, 
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }, 
  }
);

reportSchema.index({ reporterUserId: 1, reportedUserId: 1, status: 1 });

module.exports = mongoose.model("Report", reportSchema);
