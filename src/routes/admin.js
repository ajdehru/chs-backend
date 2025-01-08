const express = require("express");
const { login, forgotPassword, resetPassword } = require("../controllers/user");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStatus,
} = require("../controllers/admin/products");
const router = express.Router();

// router.get("/plans", getPlans);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);

// router.put("/suspend-account/:id", checkAdminAuth, suspendUser);

// pharmacy products
router.post("/product", createProduct);
router.get("/products", getProducts);
router.get("/product/:id", getProductById);
router.put("/product/:id", updateProduct);
router.delete("/product/:id", deleteProduct);
router.patch("/product-status/:id", updateProductStatus);

module.exports = router;
