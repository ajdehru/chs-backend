const mongoose = require('mongoose');
const { statusEnm } = require('../utils/enum');
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comments: {
      type: String,
      minlength: 0,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: statusEnm,
      default: "Pending",
      index: true, 
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'createdAt' },
  }
);

module.exports = mongoose.model('Review', reviewSchema);
