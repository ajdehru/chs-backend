const express = require("express");
const router = express.Router();

const {
  getModels,
  getModelById,
  createModelProfile,
  updateModelProfile,
  uploadVerificationDocument,
  createTravelDate,
  updateTravelDate,
  deleteTravelDate,
  getTravelDatesByModelId,
  addModelSocialLink,
  uploadPhoto,
} = require("../controllers/model");
const { checkAuth } = require("../middlewares/auth");
const { upload, uploadVideo } = require("../middlewares/multerS3");

router.get("/", getModels);
router.get("/:userId", getModelById);
// router.post("/create", createModelProfile);
// router.post("/upload/photo", upload.array("files", 10), uploadPhoto);
// router.post("/upload/video", uploadVideo.array("files", 10), uploadPhoto);
router.post("/create", createModelProfile);
router.put("/:id", checkAuth, updateModelProfile);
router.post(
  "/:id/upload-verification",
  upload.single("file"),
  uploadVerificationDocument
);
router.post("/add-social", addModelSocialLink);

// Travel Date Routes
router.post("/travel-dates", checkAuth, createTravelDate);
router.put("/:id/travel-dates", checkAuth, updateTravelDate);
router.delete("/:id/travel-dates", checkAuth, deleteTravelDate);
router.get("/:id/travel-dates", getTravelDatesByModelId);

module.exports = router;
