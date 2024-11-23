const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User schema
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    birthday: {
      type: Date,
      required: true,
    },
    coverImage: {
      // type: String,
      type: Schema.Types.ObjectId,
      ref: "Content",
      default: null,
    },
    plusImage: {
      // type: String,
      type: Schema.Types.ObjectId,
      ref: "Content",
      default: null,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    model: {
      type: Schema.Types.ObjectId,
      ref: "Model",
      default: null,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "UserSubscription",
      default: null,
    },
    notification: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["Pending", "Suspended", "Active","Rejected"],
      default: "Pending",
    },
    reasonForSuspension: {
      type: String,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isOnline:{
      type:Boolean,
      enum:[true,false]
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
