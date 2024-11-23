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
  getUpdatedProfile,
} = require("../controllers/user");
// const { upload } = require("../middlewares/multerS3");
const { checkAuth } = require("../middlewares/auth");

router.post("/register", signUp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/verify-email", checkAuth, userEmialVerify);
router.put("/update", checkAuth, updateUser);
router.put(
  "/change-dp",
  checkAuth,
  // upload.single("dp"),
  updateDp
);
router.get("/", checkAuth, getUser);
router.get("/:userId", getUpdatedProfile);

module.exports = router;
