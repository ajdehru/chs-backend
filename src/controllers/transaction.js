const Subscription = require("../models/subscription");
const TransactionLog = require("../models/transactionLog");
const User = require("../models/user");
const UserSubscription = require("../models/userSubscription");
const { sendResponse } = require("../utils");
const generatePDF = require("../utils/helpers/generatePdf");
const {
  createSubscription,
  updateSubscription,
  createCustomer,
  createPaymentIntent,
} = require("../utils/stripeBackup");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const Stripe = require("../configs/stripe");
const {
  createStripeCustomer,
  subscribeToPlan,
  changeSubscription,
  createPaymentMethod,
  paymentIntent,
  createSession,
  retriveSession,
  getOrCreateDiscountCoupon,
} = require("../utils/stripe");
const { randomUUID } = require("crypto");
const role = require("../models/role");

const getPaymentIntent = async (req, res) => {
  try {
    const { price } = req.params;

    const paymentSecret = await paymentIntent(price);
    return sendResponse(res, 200, "Payemnt Secret", paymentSecret);
  } catch (error) {
    console.log(error);
    return sendResponse(res, 500, error.message);
  }
};

const crteateCheckoutPage = async (req, res) => {
  try {
    const { planType, userid, redirect } = req.body;
    const userId = req?.user?.id || userid;

    const selectedPlan = await Subscription.findOne({ name: planType });
    if (!selectedPlan) {
      return sendResponse(res, 400, "Invalid plan type");
    }

    let user = await UserSubscription.findOne({ user: userId }).populate(
      "user"
    );

    if (!user) {
      user = await UserSubscription.create({
        user: userId,
        subscriptionType: planType,
        endDate: new Date(),
        isActive: false,
      });
      await User.findByIdAndUpdate(userId, { subscription: user._id });
      user = await UserSubscription.findOne({ user: userId }).populate("user");
    }

    let customerId = user?.stripeCustomerId;
    if (!user.stripeCustomerId) {
      customerId = await createStripeCustomer(user.user.email);
      await UserSubscription.findByIdAndUpdate(user._id, {
        stripeCustomerId: customerId,
      });
    }

    let discountCouponId = null;
    if (user?.stripeDiscount > 0) {
      discountCouponId = await getOrCreateDiscountCoupon(user?.stripeDiscount);
    }

    const session = await createSession(
      customerId,
      selectedPlan.stripePriceId,
      planType,
      userId,
      redirect,
      discountCouponId
    );
    // }

    return sendResponse(res, 200, "Session created successfully", {
      url: session.url,
    });
  } catch (error) {
    console.error("Error in Session:", error);
    return sendResponse(res, 500, error.message);
  }
};

const addSubscriptionForRegular = async (req, res) => {
  try {
    const { userId, planType } = req.body;

    // const customerId = randomUUID();
    // const subscriptionId = randomUUID();

    const selectedPlan = await Subscription.findOne({ name: planType });
    if (!selectedPlan) {
      return sendResponse(res, 400, "Invalid plan type");
    }

    let user = await UserSubscription.findOne({ user: userId }).populate(
      "user"
    );

    if (!user) {
      user = await UserSubscription.create({
        user: userId,
        subscriptionType: planType,
        endDate: new Date(),
        isActive: false,
      });
      await User.findByIdAndUpdate(userId, { subscription: user._id });
      user = await UserSubscription.findOne({ user: userId }).populate("user");
    }
    const endDate = moment().add(1, "month").toDate();

    let updatedSub = await UserSubscription.findByIdAndUpdate(user._id, {
      subscriptionType: selectedPlan.name,
      startDate: new Date(),
      endDate: endDate,
      isActive: true,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      updatedAt: new Date(),
    });

    console.log(updatedSub, "updatedSub");

    const isRole = await role.findOne({ role: "admin" });

    const adminUser = await User.findOne({ role: isRole?._id });

    console.log(adminUser, "adminUser");
    if (!adminUser) {
      return sendResponse(res, 500, "Admin user not found");
    }

    // Create transaction log
    const transaction = new TransactionLog({
      toUserId: adminUser._id,
      fromUserId: userId,
      paymentId: randomUUID(),
      transactionType: "Membership",
      amount: 0,
      currency: "USD",
      adminAmount: 0,
      userAmount: 0,
      status: "Received",
    });
    await transaction.save();

    console.log(transaction, "transaction");

    return sendResponse(
      res,
      200,
      "Transaction created successfully",
      transaction
    );
  } catch (error) {
    console.error("Error in addSubscription:", error);
    return sendResponse(res, 500, error.message);
  }
};

const addSubscription = async (req, res) => {
  try {
    const { sessionId, userId, planType } = req.body;

    const session = await retriveSession(sessionId);
    // console.log(session, "session");
    if (session.payment_status !== "paid") {
      return sendResponse(res, 400, "Payment not completed");
    }

    const customerId = session.customer.id;
    const subscriptionId = session.subscription.id;

    const selectedPlan = await Subscription.findOne({ name: planType });
    if (!selectedPlan) {
      return sendResponse(res, 400, "Invalid plan type");
    }

    let user = await UserSubscription.findOne({ user: userId }).populate(
      "user"
    );
    const endDate = moment().add(1, "month").toDate();

    let updatedSub = await UserSubscription.findByIdAndUpdate(user._id, {
      subscriptionType: selectedPlan.name,
      startDate: new Date(),
      endDate: endDate,
      isActive: true,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      updatedAt: new Date(),
    });

    console.log(updatedSub, "updatedSub");

    const adminUser = await User.findOne().populate({
      path: "role",
      match: { name: "admin" },
    });
    console.log(adminUser, "adminUser");

    if (!adminUser) {
      return sendResponse(res, 500, "Admin user not found");
    }

    // Create transaction log
    const transaction = new TransactionLog({
      toUserId: adminUser._id,
      fromUserId: userId,
      paymentId: session?.payment_intent || session?.invoice,
      transactionType: "Membership",
      amount: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
      adminAmount: session.amount_total / 100,
      userAmount: 0,
      status: "Received",
    });
    await transaction.save();

    console.log(transaction, "transaction");

    return sendResponse(
      res,
      200,
      "Transaction created successfully",
      transaction
    );
  } catch (error) {
    console.error("Error in addSubscription:", error);
    return sendResponse(res, 500, error.message);
  }
};

// Function to create a Stripe Connect account for a model
async function createStripeConnectAccount(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new Error("User not found");
    }

    // Save the Stripe Connect account ID to your database
    model.stripeConnectAccountId = account.id;
    await model.save();

    return account;
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    throw error;
  }
}

// Create a tip
const addTip = async (req, res) => {
  try {
    const { toUserId, amount } = req.body;
    const fromUserId = req.user.id;

    const tipper = await User.findById(fromUserId).populate("subscription");
    // if (tipper.subscription.subscriptionType !== "Elite_Client") {
    //   return sendResponse(res, 403, "Only Elite Clients can tip models");
    // }

    const model = await User.findById(toUserId);
    if (!model) {
      return sendResponse(res, 404, "Model not found");
    }

    // Calculate amounts (in cents)
    const amountInCents = Math.round(amount * 100);
    const modelAmount = Math.floor(amountInCents * 0.9); // 90% to model
    const adminAmount = amountInCents - modelAmount; // 10% to admin

    // Create Stripe PaymentIntent
    const paymentIntent = await createPaymentIntent(
      amountInCents,
      "usd",
      tipper.subscription.stripeCustomerId,
      `Tip to ${model.name}`
    );

    // Create transaction log
    const transaction = new TransactionLog({
      toUserId,
      fromUserId,
      paymentId: paymentIntent.id,
      transactionType: "Tip",
      amount: amount,
      currency: "USD",
      adminAmount: adminAmount / 100,
      userAmount: modelAmount / 100,
      status: "Pending",
    });
    await transaction.save();

    return sendResponse(res, 200, "Tip created successfully", {
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error("Error in addTip:", error);
    return sendResponse(res, 500, error.message);
  }
};

// Confirm tip payment
const confirmTipPayment = async (req, res) => {
  try {
    const { paymentIntentId, transactionId } = req.body;

    const paymentIntent = await Stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return sendResponse(res, 400, "Payment not successful");
    }

    // Update transaction log
    const transaction = await TransactionLog.findByIdAndUpdate(
      transactionId,
      { status: "Received" },
      { new: true }
    );

    if (!transaction) {
      return sendResponse(res, 404, "Transaction not found");
    }

    // Transfer funds to model (you'd need to set up Connect accounts for this)
    // This is a simplified version; you'd need to handle this based on your payout system
    await Stripe.transfers.create({
      amount: Math.round(transaction.userAmount * 100), // Convert to cents
      currency: "usd",
      destination: "STRIPE_ACCOUNT_ID_OF_MODEL", // You'd need to store this for each model
      description: `Tip from transaction ${transaction._id}`,
    });

    return sendResponse(res, 200, "Tip payment confirmed and processed");
  } catch (error) {
    console.error("Error in confirmTipPayment:", error);
    return sendResponse(res, 500, error.message);
  }
};

// Get all tips by userId
const userTips = async (req, res) => {
  try {
    const tips = await TransactionLog.find({
      $or: [{ toUserId: req.params.userId }, { fromUserId: req.params.userId }],
      transactionType: "Tip",
    }).sort({ createdAt: -1 });

    const processedTips = tips.map((tip) => ({
      ...tip.toObject(),
      type:
        tip.fromUserId.toString() === req.params.userId ? "sent" : "received",
    }));

    return sendResponse(res, 200, "Tips fetched successfully", processedTips);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

// Get an invoice of tip
const userTipInvoice = async (req, res) => {
  try {
    const tip = await TransactionLog.findById(req.params.tipId)
      .populate("fromUserId", "name email")
      .populate("toUserId", "name email");

    if (!tip || tip.transactionType !== "Tip") {
      return sendResponse(res, 404, "Tip not found");
    }

    let link = await getPdfLink(req, tip);
    return sendResponse(res, 200, "Tip invoice generated", link);
  } catch (error) {
    console.error("Error in userTipInvoice:", error);
    return sendResponse(res, 500, error.message);
  }
};

const getPdfLink = async (req, tip) => {
  // Generate PDF
  const pdfBuffer = await generatePDF(tip);

  // Save PDF temporarily
  const fileName = `invoice_${tip._id}.pdf`;
  const filePath = path.join(__dirname, "..", "temp", fileName);
  fs.writeFileSync(filePath, pdfBuffer);

  // Generate download link
  const downloadLink = `${req.protocol}://${req.get(
    "host"
  )}/download/${fileName}`;

  // Schedule file deletion after 1 hour
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
  }, 3600000);

  return downloadLink;
};

const getUserSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "subscription"
    );
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    if (!user.subscription?.stripeSubscriptionId) {
      return sendResponse(res, 404, "No active subscription found");
    }

    const subscription = await Subscription.findOne({
      subscriptionType: user.subscription?.subscriptionType,
    });

    return sendResponse(
      res,
      200,
      "Subscription fetched successfully",
      subscription
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getUserTransaction = async (req, res) => {
  try {
    const logs = await TransactionLog.find({
      $or: [{ toUserId: req.params.userId }, { fromUserId: req.params.userId }],
    }).sort({ createdAt: -1 });

    if (!logs) {
      return sendResponse(res, 404, "Transaction logs Not found!");
    }

    const processedLogs = logs.map((log) => ({
      ...log.toObject(),
      type:
        log.fromUserId.toString() === req.params.userId ? "sent" : "received",
    }));

    return sendResponse(
      res,
      200,
      "Transaction logs fetched successfully",
      processedLogs
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const addDemoSubscription = async (req, res) => {
  try {
    const { planType, paymentMethodId, userid } = req.body;
    const userId = req?.user?.id || userid;

    const selectedPlan = await Subscription.findOne({ name: planType });
    if (!selectedPlan) {
      return sendResponse(res, 400, "Invalid plan type");
    }

    let user = await UserSubscription.findOne({ user: userId }).populate(
      "user"
    );

    if (!user) {
      user = await UserSubscription.create({
        user: userId,
        subscriptionType: planType,
        endDate: new Date(),
      });
      await User.findByIdAndUpdate(userId, { subscription: user._id });
      user = await UserSubscription.findOne({ user: userId }).populate("user");
    }

    const endDate = moment().add(1, "month").toDate();

    let updatedSub = await UserSubscription.findByIdAndUpdate(user._id, {
      subscriptionType: selectedPlan.name,
      startDate: new Date(),
      endDate: endDate,
      isActive: true,
      stripeCustomerId: "demo123",
      stripeSubscriptionId: "demo123",
      stripePayMethodId: paymentMethodId || null,
      stripePayMethod: "Card",
      updatedAt: new Date(),
    });
    console.log(updatedSub, "updatedSub");
    const adminUser = await User.findOne().populate({
      path: "role",
      match: { name: "admin" },
    });
    console.log(adminUser, "updatedSub");
    if (!adminUser) {
      return sendResponse(res, 500, "Admin user not found");
    }

    // Create transaction log
    const transaction = new TransactionLog({
      toUserId: adminUser._id,
      fromUserId: userId,
      paymentId: randomUUID(),
      transactionType: "Membership",
      amount: selectedPlan.price,
      currency: "USD",
      adminAmount: selectedPlan.price,
      userAmount: 0,
      status: "Received",
    });
    await transaction.save();
    console.log(transaction, "transaction");
    return sendResponse(
      res,
      200,
      "Subscription created successfully",
      selectedPlan
    );
  } catch (error) {
    console.error("Error in addSubscription:", error);
    return sendResponse(res, 500, error.message);
  }
};

module.exports = {
  addTip,
  userTips,
  userTipInvoice,
  crteateCheckoutPage,
  getUserSubscription,
  getUserTransaction,
  getPaymentIntent,
  addDemoSubscription,
  addSubscription,
  addSubscriptionForRegular,
};
