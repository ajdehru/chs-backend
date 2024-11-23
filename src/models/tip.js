const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tipSchema = new Schema(
  {
    amount: {
      type: mongoose.Types.Decimal128,
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Middleware to ensure the tip amount is distributed correctly
tipSchema.pre('save', function (next) {
  this.amount = mongoose.Types.Decimal128.fromString(
    (this.amount * 0.9).toFixed(2)
  );
  next();
});

module.exports = mongoose.model('Tip', tipSchema);
