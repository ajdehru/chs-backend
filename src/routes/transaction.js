const express = require("express");
const router = express.Router();
const { checkAuth } = require("../middlewares/auth");
const {
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
} = require("../controllers/transaction");

router.get('/payment-intent/:price',getPaymentIntent)
router.post("/create-session", crteateCheckoutPage);
router.post("/subscription", addSubscription);
router.post("/regular/subscription",addSubscriptionForRegular)

router.post("/tip", checkAuth, addTip);
router.get("/:userId/tip", checkAuth, userTips);
router.get("/:tipId/tip/invoice", checkAuth, userTipInvoice);
router.get("/:userId/subscription", checkAuth, getUserSubscription);
router.get("/:userId/logs", checkAuth, getUserTransaction);

module.exports = router;
