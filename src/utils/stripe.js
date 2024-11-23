const { FRONTEND_URL } = require("../configs");
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

async function paymentIntent(price) {
  const paymentIntent = await Stripe.paymentIntents.create({
    amount: price * 100, // amount in cents
    currency: "usd",
    automatic_payment_methods: {
      enabled: true,
    },
  });
  const { id, client_secret } = paymentIntent;
  return { id, client_secret };
}

// Helper function to create a Stripe customer
async function createStripeCustomer(email) {
  const customer = await Stripe.customers.create({ email });
  return customer.id;
}

// Subscribe a user to a plan
async function createSession(
  customerId,
  priceId,
  planType,
  userId,
  redirect,
  discountCouponId
) {
  const session = await Stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${FRONTEND_URL}success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}&userId=${userId}&redirect=${redirect}`,
    cancel_url: `${FRONTEND_URL}failed`,
    billing_address_collection: "required",
    discounts: discountCouponId ? [{ coupon: discountCouponId }] : undefined,
    metadata: {
      userId: userId,
      planType: planType,
    },
  });
  return session;
}

const getOrCreateDiscountCoupon = async (discountPercentage) => {
  const couponId = `MODEL_DISCOUNT_${discountPercentage}`;
  try {
    const existingCoupon = await Stripe.coupons.retrieve(couponId);
    return existingCoupon.id;
  } catch (error) {
    if (error.code === "resource_missing") {
      const newCoupon = await Stripe.coupons.create({
        id: couponId,
        percent_off: discountPercentage,
        duration: "forever",
        name: `${discountPercentage}% Model Discount`,
      });
      return newCoupon.id;
    }
    throw error;
  }
};

async function retriveSession(sessionId) {
  const session = await Stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["customer", "subscription"],
  });
  return session;
}

// Subscribe a user to a plan
async function subscribeToPlan(customerId, priceId) {
  const subscription = await Stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
  });
  return subscription;
}

// Upgrade or change a subscription
async function changeSubscription(subscriptionId, newPriceId) {
  const subscription = await Stripe.subscriptions.retrieve(subscriptionId);
  await Stripe.subscriptions.update(subscriptionId, {
    items: [{ id: subscription.items.data[0].id, price: newPriceId }],
  });
}

// Pause auto-pay (subscription)
async function pauseSubscription(subscriptionId) {
  await Stripe.subscriptions.update(subscriptionId, {
    pause_collection: { behavior: "void" },
  });
}

// Resume auto-pay (subscription)
async function resumeSubscription(subscriptionId) {
  await Stripe.subscriptions.update(subscriptionId, { pause_collection: null });
}

// Cancel auto-pay (subscription)
async function cancelSubscription(subscriptionId) {
  await Stripe.subscriptions.del(subscriptionId);
}

async function createPaymentMethod(paymentMethodId) {
  await Stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  await Stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

// Process a tip
async function processTip(senderId, receiverId, amount) {
  const paymentIntent = await Stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    customer: senderId,
    transfer_data: {
      destination: receiverId,
      amount: Math.floor(amount * 0.9), // 90% to the receiver
    },
    application_fee_amount: Math.floor(amount * 0.1), // 10% to admin
  });
  return paymentIntent;
}

// Create a Stripe Connect account for models
async function createConnectAccount(email) {
  const account = await Stripe.accounts.create({
    type: "express",
    email: email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  return account.id;
}

// Create a payout for a model
async function createPayout(connectAccountId, amount) {
  const payout = await Stripe.payouts.create(
    {
      amount: amount,
      currency: "usd",
    },
    {
      stripeAccount: connectAccountId,
    }
  );
  return payout;
}

// Refund a payment
async function refundPayment(paymentIntentId) {
  const refund = await Stripe.refunds.create({
    payment_intent: paymentIntentId,
  });
  return refund;
}

module.exports = {
  createProduct,
  createPrice,
  updateProduct,
  updatePrice,
  createStripeCustomer,
  subscribeToPlan,
  createSession,
  getOrCreateDiscountCoupon,
  retriveSession,
  changeSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  processTip,
  createConnectAccount,
  createPayout,
  refundPayment,
  createPaymentMethod,
  paymentIntent,
};
