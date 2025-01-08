const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Helper function to generate a unique 12-digit SKU number
const generateUniqueSKU = async function () {
  let sku;
  let isUnique = false;

  while (!isUnique) {
    sku = Math.floor(100000000000 + Math.random() * 900000000000).toString(); // Generate a random 12-digit number
    const existingSKU = await Product.findOne({ SKUnumber: sku }); // Check for uniqueness
    if (!existingSKU) {
      isUnique = true;
    }
  }

  return sku;
};

const productSchema = new Schema(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Categories",
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      default: null,
    },
    discount: {
      type: Number,
      default: null,
    },
    stockQuantity: {
      type: Number,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    price: {
      type: Number,
      required: true,
    },
    SKUnumber: {
      type: String,
      unique: true,
    },
    type: {
      type: String,
      enum: ["Tablet", "Suyrup"],
      default: "Suyrup",
    },
    status: {
      type: String,
      enum: ["Published", "Hold", "Pending"],
      default: "Pending",
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);

// Pre-save middleware to generate a unique SKU number
productSchema.pre("save", async function (next) {
  if (!this.SKUnumber) {
    this.SKUnumber = await generateUniqueSKU();
  }
  next();
});

// Indexes for optimized queries
productSchema.index({ status: 1 });
productSchema.index({ categoryId: 1 });

const Product = mongoose.model("Products", productSchema);

module.exports = Product;
