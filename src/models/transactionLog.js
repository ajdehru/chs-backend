const mongoose = require('mongoose');
const { statusEnm } = require('../utils/enum');
const Schema = mongoose.Schema;

const transactionLogSchema = new Schema(
  {
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, 
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, 
    },
    paymentId: {
      type: String,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['Membership', 'Tip', 'Payment', 'Withdrawal', 'Refund'],
      required: true,
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
      index: true, 
    },
    currency: {
      type: String,
      enum: ['USD'],
      required: true,
      index: true, 
    },
    adminAmount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    userAmount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    status: {
      type: String,
      enum: statusEnm,
      default: 'Pending',
      index: true, 
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
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
    versionKey: false, 
  }
);

transactionLogSchema.index({ toUserId: 1, fromUserId: 1, transactionType: 1, createdAt: -1 });

module.exports = mongoose.model('TransactionLog', transactionLogSchema);
