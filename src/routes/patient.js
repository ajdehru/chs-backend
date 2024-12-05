const express = require("express");
const router = express.Router();

// const { upload } = require("../middlewares/multerS3");
const { checkAuth } = require("../middlewares/auth");
const {
  updateProfile,
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentById,
  updateAppointmentStatus,
  createReport,
  getReports,
  getReportById,
  updateReportById,
  deleteReport,
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  deletePrescription,
  addAppointmentAttachment,
  saveSymptomReport,
  getSymptomReports,
  deleteSymptomReport,
  addReportAttachment,
  addPrescriptionAttachment,
} = require("../controllers/patient");
const { generateSymptomSummary } = require("../controllers/symtoms");

router.put("/:userId", checkAuth, updateProfile);

router.post("/appointment/:patientId", checkAuth, createAppointment);
router.put(
  "/appointment/attachment/:appoitmentId",
  checkAuth,
  // upload.single("dp"),
  addAppointmentAttachment
);
router.get("/appointment/:patientId", checkAuth, getAppointments);
router.get("/appointment/single/:id", checkAuth, getAppointmentById);
router.put("/appointment/:id", checkAuth, updateAppointmentById);
router.put("/appointment/:status/:id", checkAuth, updateAppointmentStatus);

router.post("/medical/:patientId", checkAuth, createReport);
router.get("/medical/:patientId", checkAuth, getReports);
router.get("/medical-single/:id", checkAuth, getReportById);
router.put("/medical/:id", checkAuth, updateReportById);
router.put("/medical/attachment/:id", checkAuth, addReportAttachment);
router.delete("/medical/:id", checkAuth, deleteReport);

router.post("/prescription/:patientId", checkAuth, createPrescription);
router.put("/prescription/attachment/:id", checkAuth, addPrescriptionAttachment); 
router.get("/prescription/:patientId", checkAuth, getPrescriptions);
router.get("/prescription-single/:id", checkAuth, getPrescriptionById);
router.delete("/prescription/:id", checkAuth, deletePrescription);

router.post("/symptom-checker", generateSymptomSummary);
router.post("/save-checked-symptom/:patientId", saveSymptomReport);
router.get("/reports/:patientId", getSymptomReports);
router.delete("/report/:id", deleteSymptomReport);

module.exports = router;
