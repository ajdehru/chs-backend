const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const statsSchema = new Schema({
  age: {
    type: Number,
    default: null,
  },
  height: {
    type: String,
    default: null,
  },
  heightType: {
    type: String,
    default: "in",
  },
  weight: {
    type: Number,
    default: null,
  },
  weightType: {
    type: String,
    default: "kg",
  },
  cockSize: {
    type: Number,
    default: null,
  },
  cockSizeType: {
    type: String,
    default: "cm",
  },
  foreskin: {
    type: String,
    enum: ["Cut", "Uncut"],
    default: null,
  },
  sexualRole: {
    type: String,
    enum: ["Top", "Top/Vers", "Vers", "Vers/Bottom", "Bottom", "Side", "None"],
    default: null,
  },
  smoking: {
    type: String,
    enum: ["Yes", "No", "Ask Me"],
    default: "Ask Me",
  },
  drinking: {
    type: String,
    enum: ["Yes", "No", "Ask Me"],
    default: "No",
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
    default: null,
  },
  bodyType: {
    type: String,
    enum: ["Slim", "Toned", "Muscular", "Average", "Chubby"],
    default: null,
  },
  orientation: {
    type: String,
    enum: ["Gay", "Straight", "Bisexual", "Pansexual"],
    default: null,
  },
  eyeColor: {
    type: String,
    enum: ["Black", "Dark Brown", "Hazel", "Green", "Blue", "Other"],
    default: null,
  },
  bodyHair: {
    type: String,
    enum: ["Smooth", "Light Hair", "Hairy", "Very Hairy"],
    default: null,
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
    default: "No",
  },
  condomsOnly: {
    type: String,
    enum: ["Yes", "No"],
    default: null,
  },
  hivStatus: {
    type: String,
    enum: ["Negative On PrEP", "Negative", "Positive Undetectable", "Positive"],
    default: "Negative",
  },
  spokenLanguages: {
    type: [String],
    default: [],
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
    default: null,
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
    default: [],
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
    default: [],
  },
});

const clientSchema = new Schema(
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
      default: null,
    },
    location: {
      city: {
        type: String,
        default: null,
      },
      country: {
        type: String,
        default: null,
      },
      default: {},
    },
    stats: {
      type: statsSchema,
      default: () => ({}),
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

clientSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Client", clientSchema);
