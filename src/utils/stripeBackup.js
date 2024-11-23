const Stripe = require("../configs/stripe");

// Create a new product (subscription plan)
const createProduct = async (payload) => {
  return await Stripe.products.create(payload);
};

// Create a new price for a product
const createPrice = async (payload) => {
  return await Stripe.prices.create(payload);
};

// Function to update a product
const updateProduct = async (productId, payload) => {
  return await Stripe.products.update(productId, payload);
};

// Function to update a price
const updatePrice = async (priceId, payload) => {
  return await Stripe.prices.update(priceId, payload);
};
// List all products (subscription plans)
const listProducts = async () => {
  return await Stripe.products.list();
};

// List all prices
const listPrices = async () => {
  console.log(await Stripe.prices.list());
  return await Stripe.prices.list();
};

// Get products with their active prices
const getProductsWithPrices = async () => {
  const products = await listProducts();
  const prices = await listPrices();

  return products.data.map((product) => ({
    ...product,
    price: prices.data.find(
      (price) => price.product === product.id && price.active
    ),
  }));
};

// Create a new customer
const createCustomer = async (email) => {
  return await Stripe.customers.create({
    email,
    description: "Subscription customer",
  });
};

// Retrieve a customer by ID
const getCustomer = async (customerId) => {
  return await Stripe.customers.retrieve(customerId);
};

// Update a customer
const updateCustomer = async (customerId, payload) => {
  return await Stripe.customers.update(customerId, payload);
};

// Create a subscription
const createSubscription = async (customerId, priceId) => {
  return await Stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
  });
};

// Retrieve a subscription
const getSubscription = async (subscriptionId) => {
  return await Stripe.subscriptions.retrieve(subscriptionId);
};

// Update a subscription
const updateSubscription = async (subscriptionId, payload) => {
  return await Stripe.subscriptions.update(subscriptionId, payload);
};

// Cancel a subscription
const cancelSubscription = async (subscriptionId) => {
  return await Stripe.subscriptions.cancel(subscriptionId);
};

// Schedule subscription cancellation at period end
const cancelSubscriptionAtPeriodEnd = async (subscriptionId) => {
  return await Stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
};

// Create a payment intent
const createPaymentIntent = async (
  amount,
  currency = "usd",
  customer,
  description
) => {
  return await Stripe.paymentIntents.create({
    amount,
    currency,
    customer,
    description,
    payment_method_types: ["card"],
  });
};

// Create a Stripe Connect account
const stripeCreateAccounts = async (user) => {
  const account = await Stripe.accounts.create({
    type: "express", // or 'standard', depending on your needs
    country: user.country || "Usa",
    email: user.email,
    capabilities: {
      transfers: { requested: true },
    },
  });
  return account;
};

module.exports = {
  listProducts,
  createProduct,

  createPrice,
  updateProduct,
  updatePrice,
  listPrices,
  getProductsWithPrices,
  createCustomer,
  getCustomer,
  updateCustomer,
  createSubscription,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  cancelSubscriptionAtPeriodEnd,
  createPaymentIntent,
};
