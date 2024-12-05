const express = require("express");
const   router = express.Router();

// const { upload } = require("../middlewares/multerS3");
const { checkAuth } = require("../middlewares/auth");
const { updateProfile, getAllDoctors, getAllPatientAppointment } = require("../controllers/doctor");

router.put("/:userId", checkAuth, updateProfile);
router.get("/appointment/:doctorId", getAllPatientAppointment);


router.get("/list", checkAuth, getAllDoctors);

module.exports = router;
