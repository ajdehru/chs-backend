const express = require("express");
const router = express.Router();

// const { upload } = require("../middlewares/multerS3");
const { checkAuth } = require("../middlewares/auth");
const { updateProfile, getAllDoctors } = require("../controllers/doctor");

router.put("/:userId", checkAuth, updateProfile);

router.get("/list", checkAuth, getAllDoctors);

module.exports = router;
