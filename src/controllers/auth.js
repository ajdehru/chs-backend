const Role = require("../models/role"); // Import your model schema
const Subscription = require("../models/subscription");
const { sendResponse } = require("../utils");
const { createProduct, createPrice, updateProduct } = require("../utils/stripe");

// Store all Roles
const addNewRoles = async (req, res) => {
  try {
    const { roles } = req.body;

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return sendResponse(
        res,
        400,
        "Roles are required and should be an array."
      );
    }

    const newRoles = [];

    for (const role of roles) {
      const existingRole = await Role.findOne({ role: role.toLowerCase() });
      if (existingRole) {
        return sendResponse(res, 400, `${role} role already exists.`);
      }
      const roleData = new Role({ role: role.toLowerCase() });
      const savedRole = await roleData.save();
      newRoles.push(savedRole);
    }

    return sendResponse(res, 200, "Roles Added Successfully", newRoles);
  } catch (err) {
    return sendResponse(res, 500, err.message);
  }
};

async function updatePlan(req, res) {
  try {
    const { productId, description, price } = req.body;

    if (!productId || !description || !price) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields: productId, description, or price"
      });
    }

    // Update the product
    const updatedProduct = await updateProduct(productId, {
      description: description
    });

    console.log('Updated product:', updatedProduct);

    // Create a new price
    const newPrice = await createPrice({
      unit_amount: Math.round(price * 100), // Convert to cents and ensure it's an integer
      currency: 'usd',
      recurring: { interval: 'month' },
      product: productId,
    });

    console.log('New price created:', newPrice);

    return res.status(200).json({
      status: true,
      message: "Subscription plan updated in Stripe and saved to database",
      data: {
        product: updatedProduct,
        price: newPrice
      }
    });

  } catch (error) {
    console.error('Error updating Stripe product and price:', error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while updating the subscription plan",
      error: error.message
    });
  }
}

const addPlans = async (req, res) => {
  try {
    // Regular-Client Plan
    const rcProduct = await createProduct({
      name: "Regular-Client Plan",
      description:
        "Access to all model stats, Access to advanced filters, unlimited file uploads, Access to selected photos",
    });

    const rcPrice = await createPrice({
      unit_amount: 0,
      currency: "usd",
      recurring: { interval: "month" },
      product: rcProduct.id,
    });

    // Elite-Client Plan
    const ecProduct = await createProduct({
      name: "Elite-Client Plan",
      description:
        "Instant access to all premium photos and videos, Access to contact the guys, Instant verified status,Priority status with the models, Ability to leave reviews, All regular client features",
    });
    const ecPrice = await createPrice({
      unit_amount: 1000,
      currency: "usd",
      recurring: { interval: "month" },
      product: ecProduct.id,
    });

    // Gent-Model Plan
    const rgmProduct = await createProduct({
      name: "Gent-Model Plan",
      description:
        "Ability to create a profile, Limited media uploads (5 max), 200 character max bio",
    });
    const rgmPrice = await createPrice({
      unit_amount: 3000,
      currency: "usd",
      recurring: { interval: "month" },
      product: rgmProduct.id,
    });

    // Elite-Gent-Model Plan
    const egmProduct = await createProduct({
      name: "Elite-Gent-Model Plan",
      description:
        "Higher placement in search algorithm, More media uploads (50 max), 500 character max bio, Instant access to all premium photos & videos",
    });
    const egmPrice = await createPrice({
      unit_amount: 5000,
      currency: "usd",
      recurring: { interval: "month" },
      product: egmProduct.id,
    });

    // Save subscription details to your database
    await new Subscription({
      name: "Regular_Client",
      price: 0,
      stripePriceId: rcPrice.id,
      stripeProductId: rcProduct.id,
      characters: 200,
      type: "rc",
      uploadLimit: 3,
      details: [
        "Access to all model stats",
        "Access to advanced filters",
        "Access to selected photos",
      ],
    }).save();

    await new Subscription({
      name: "Elite_Client",
      price: 10,
      stripePriceId: ecPrice.id,
      stripeProductId: ecProduct.id,
      characters: 500,
      type: "ec",
      uploadLimit: 4,
      details: [
        "Instant access to all premium photos and videos",
        "Access to contact the guys",
        "Instant verified status",
        "Priority status with the models",
        "Ability to leave reviews",
        "All regular client features",
      ],
    }).save();

    await new Subscription({
      name: "Gent",
      price: 30,
      stripePriceId: rgmPrice.id,
      stripeProductId: rgmProduct.id,
      characters: 200,
      type: "gm",
      uploadLimit: 5,
      details: [
        "Ability to create a profile",
        "Limited media uploads (5 max)",
        "200 character max bio",
      ],
    }).save();

    await new Subscription({
      name: "Elite_Gent",
      price: 50,
      stripePriceId: egmPrice.id,
      stripeProductId: egmProduct.id,
      characters: 500,
      type: "egm",
      uploadLimit: 50,
      details: [
        "Higher placement in search algorithm",
        "More media uploads (50 max)",
        "500 character max bio",
        "Instant access to all premium photos & videos",
      ],
    }).save();

    await new Subscription({
      name: "Exclusive_Elite_Gent",
      price: 0,
      stripePriceId: egmPrice.id,
      stripeProductId: egmProduct.id,
      characters: 1000,
      type: "eegm",
      uploadLimit: -1,
      details: [
        "Highest placement in search algorithm",
        "Discounted Membership as low as $0",
        "Unlimited media uploads",
        "1,000 character max bio",
        "Instant access to all premium photos & videos",
      ],
    }).save();

    return res.status(200).json({
      status: true,
      message: "Subscription plans created in Stripe and saved to database",
    });
  } catch (error) {
    console.error("Error creating subscription plans:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
};

const uploadImage = async (req, res) => {
  try {
    const { file, files } = req;
    let uploadedFiles = [];
    if (file) {
      uploadedFiles = [
        { key: file?.key, location: file.location, etag: file.etag },
      ];
    }
    if (files) {
      uploadedFiles = files.map((file) => ({
        key: file.key,
        location: file.location,
        etag: file.etag,
      }));
    }
    sendResponse(res, 200, "File Uploaded", uploadedFiles);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

module.exports = {
  addNewRoles,
  updatePlan,
  addPlans,
  uploadImage,
};
