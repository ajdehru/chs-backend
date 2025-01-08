const express = require("express");
const router = express.Router();

// const { upload } = require("../middlewares/multerS3");
const { checkAuth } = require("../middlewares/auth");
const {
  updateProfile,
  getAllDoctors,
  getAllPatientAppointment,
  getDoctorClinic,
  getDoctorDashboardData,
  getAllPatientsWithAppointmentDetails,
  getAppointmentsCountForAllStatuses,
} = require("../controllers/doctor");

router.put("/:userId", checkAuth, updateProfile);
router.get("/appointment-count/:doctorId", getAppointmentsCountForAllStatuses);
router.get("/appointment/:doctorId", getAllPatientAppointment);
router.get("/patient/:doctorId", getAllPatientsWithAppointmentDetails);
router.get("/dashboard/:doctorId", getDoctorDashboardData);
router.get("/clinic/:doctorId", getDoctorClinic);

router.get("/list", checkAuth, getAllDoctors);

module.exports = router;
