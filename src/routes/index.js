const userRoutes = require("./user");
const modelRoutes = require("./model");
const authRoutes = require("./auth");
const clientRoutes = require("./client");
const modelContentRoutes = require("./modelContent");
const interactionRoutes = require("./interaction");
const chatRoutes = require("./chat");
const paymentRoutes = require("./transaction");
const adminRoutes = require("./admin");

module.exports = {
  authRoutes,
  userRoutes,
  clientRoutes,
  modelRoutes,
  modelContentRoutes,
  interactionRoutes,
  chatRoutes,
  paymentRoutes,
  adminRoutes,
};
