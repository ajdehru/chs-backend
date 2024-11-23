const express = require("express");
const router = express.Router();

const {
  uploadContent,
  deleteContent,
  verifyContent,
  getModelContent,
  updateContent,
  getModelVerifiedContent,
  uploadPhoto,
} = require("../controllers/modelContent");
const { checkAuth } = require("../middlewares/auth");
const { upload, uploadVideo } = require("../middlewares/multerS3");

router.post(
  "/:modelId/upload",
  checkAuth,
  upload.single("file"),
  uploadContent
);

router.post("/upload/image", upload.array("files", 10), uploadPhoto);
router.post("/upload/video", uploadVideo.array("files", 10), uploadPhoto);
router.post(
  "/:modelId/video/upload",
  checkAuth,
  uploadVideo.single("file"),
  uploadContent
);
router.delete("/:contentId/delete", deleteContent);
router.put("/:contentId/verify/image", upload.single("files"), verifyContent);
router.put(
  "/:contentId/verify/video",
  uploadVideo.single("files"),
  verifyContent
);
router.put("/:contentId/update", updateContent);
router.get("/:userId", checkAuth, getModelContent);
router.get("/:userId/verified", getModelVerifiedContent);

module.exports = router;
