const stripe = require("stripe");
const { STRIPE_SECRET_KEY } = require("./index");

const Stripe = stripe(STRIPE_SECRET_KEY);

module.exports = Stripe;
