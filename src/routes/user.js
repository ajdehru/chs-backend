const express = require("express");
const router = express.Router();

const {
  signUp,
  login,
  updateUser,
  updateDp,
  getUser,
  forgotPassword,
  userEmialVerify,
  authLogin,
  getUpdatedProfile,
} = require("../controllers/user");
const { upload } = require("../middlewares/multerS3");
const { checkAuth } = require("../middlewares/auth");

router.post("/register", signUp);
router.post("/login", login);
router.post("/login/auth", checkAuth, authLogin);
router.post("/forgot-password", forgotPassword);
router.put("/update/role", checkAuth, updateUser);
router.put("/verify-email", checkAuth, userEmialVerify);
router.put("/update", checkAuth, updateUser);
router.put("/change-dp/:id", checkAuth, upload.single("dp"), updateDp);
router.get("/", checkAuth, getUser);
router.get("/:userId", getUpdatedProfile);

module.exports = router;
