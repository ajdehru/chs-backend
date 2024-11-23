const mongoose = require("mongoose");
const { statusEnm } = require("../utils/enum");
const Schema = mongoose.Schema;

const statsSchema = new Schema({
  age: {
    type: Number,
    required: true,
  },
  height: {
    type: String,
    required: true,
  },
  heightType: {
    type: String,
    default: "in",
  },
  weight: {
    type: Number,
    required: true,
  },
  weightType: {
    type: String,
    default: "kg",
  },
  cockSize: {
    type: Number,
    required: true,
  },
  cockSizeType: {
    type: String,
    default: "cm",
  },
  cockStatus: {
    type: String,
    enum: statusEnm,
    default: "Pending",
  },
  foreskin: {
    type: String,
    enum: ["Cut", "Uncut"],
    required: true,
  },
  sexualRole: {
    type: String,
    enum: ["Top", "Top/Vers", "Vers", "Vers/Bottom", "Bottom", "Side", "None"],
    required: true,
  },
  tribe: {
    type: [String],
    enum: [
      "Twink",
      "Jock",
      "Bodybuilder",
      "Punk",
      "Nerd",
      "Daddy",
      "S&M",
      "Bear",
      "Otter",
      "Trans",
    ],
    required: true,
  },
  bodyType: {
    type: String,
    enum: ["Slim", "Toned", "Muscular", "Average", "Chubby"],
    required: true,
  },
  orientation: {
    type: String,
    enum: ["Gay", "Straight", "Bisexual", "Pansexual"],
    required: true,
  },
  eyeColor: {
    type: String,
    enum: ["Black", "Dark Brown", "Hazel", "Green", "Blue", "Other"],
    required: true,
  },
  bodyHair: {
    type: String,
    enum: ["Smooth", "Light Hair", "Hairy", "Very Hairy"],
    required: true,
  },
  smoking: {
    type: String,
    enum: ["Yes", "No", "Ask Me"],
    required: true,
  },
  drinking: {
    type: String,
    enum: ["Yes", "No", "Ask Me"],
    required: true,
  },
  piercings: {
    type: [String],
    enum: [
      "None",
      "Ear",
      "Nose",
      "Nipples",
      "Cock",
      "Balls",
      "Taint",
      "Tongue",
      "Lips",
      "Navel",
      "Eyebrow",
      "Other",
    ],
    required: true,
  },
  tattoos: {
    type: String,
    enum: ["Yes", "No"],
    required: true,
  },
  condomsOnly: {
    type: String,
    enum: ["Yes", "No"],
    required: true,
  },
  hivStatus: {
    type: String,
    enum: ["Negative On PrEP", "Negative", "Positive Undetectable", "Positive"],
    required: true,
  },
  spokenLanguages: {
    type: [String],
    required: true,
  },
  hairColor: {
    type: String,
    enum: [
      "Black",
      "Dark Brown",
      "Light Brown",
      "Ginger",
      "Dark Blonde",
      "Light Blonde",
      "White/Gray",
      "Other",
    ],
    required: true,
  },
  hobbies: {
    type: [String],
    enum: [
      "Reading",
      "Painting",
      "Running",
      "Cycling",
      "Movies",
      "Camping",
      "Hiking",
      "Weightlifting",
      "Traveling",
      "Shopping",
      "Spa Days",
      "Fine Dining",
      "Concerts",
      "Theatre",
      "Clubbing",
      "Bars",
      "Music Festivals/Circuits Parties/Events",
    ],
    required: true,
  },
  amInto: {
    type: [String],
    enum: [
      "Muscle Worship",
      "Stripping",
      "Massage",
      "Mutual Touching",
      "Receiving Oral",
      "Giving Oral",
      "Kissing",
      "Body Contact",
      "Cuddling",
      "Rimming",
      "Anal",
      "Verbal",
      "Groups",
      "Cum",
      "WS",
      "S&M",
      "Spanking",
      "Feet",
      "Nipples",
      "Armpits",
      "PNP",
      "Socks",
      "Tattoos",
      "Piercings",
      "Foreskin",
      "Ticking",
      "Wrestling",
      "Role Play",
      "Toys",
      "Making Content/Recording",
    ],
    required: true,
  },
});

// Define the main Model schema
const modelSchema = new Schema(
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
    stats: {
      type: statsSchema,
      required: true,
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

modelSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

modelSchema.index({ Verification_Status: 1 });
modelSchema.index({ Visible_To: 1 });

module.exports = mongoose.model("Model", modelSchema);
