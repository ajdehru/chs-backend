const express = require("express");
const { addNewRoles, addPlans, uploadImage } = require("../controllers/auth");
const { upload } = require("../middlewares/multerS3");
const { getProductsWithPrices } = require("../utils/stripeBackup");
const { checkTokenExpirey } = require("../middlewares/auth");

const router = express.Router();

// store the static data direct into db
router.post("/store-roles", addNewRoles);
router.post("/store-plans", addPlans);
router.get("/stripe", getProductsWithPrices);
router.get("/check-token", checkTokenExpirey);

// test--
router.post("/upload", upload.single("file"), uploadImage);
router.post("/upload/multi", upload.array("file", 5), uploadImage);

module.exports = router;
