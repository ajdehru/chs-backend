const express = require("express");
const router = express.Router();

const {
  signUp,
  login,
  updateUser,
  updateDp,
  getUser,
  forgotPassword,
  getUpdatedProfile,
  verifyOtp,
  resetPassword,
} = require("../controllers/user");
const { upload } = require("../middlewares/multerS3");
const { checkAuth } = require("../middlewares/auth");
const { uploadFile } = require("../middlewares/uploadfile");

router.post("/register", signUp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/verify-otp", verifyOtp);
router.put("/reset-password", resetPassword);
router.put("/update/:userId", updateUser);
router.put(
  "/change-dp",
  checkAuth,
  // upload.single("dp"),
  updateDp
);
router.post("/upload-file",upload.single("file"), uploadFile);
router.get("/", checkAuth, getUser);
router.get("/:userId", getUpdatedProfile);

module.exports = router;
