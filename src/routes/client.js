const express = require("express");
const router = express.Router();

const { upload } = require("../middlewares/multerS3");
const { checkAuth } = require("../middlewares/auth");
const {
  uploadClientPhoto,
  deleteClientPhoto,
  createClient,
  getClientById,
  getClientPhotos,
  updateClient,
  updateClientPhoto,
} = require("../controllers/client");

router.post("/create", createClient);
router.post(
  "/upload/:id/:userId",
  upload.array("files", 10),
  uploadClientPhoto
);
router.put("/update/:id", checkAuth, updateClient);
router.get("/:userId", getClientById);
router.get("/photos/:id", getClientPhotos);
router.put("/make-profile/:id", checkAuth, updateClientPhoto);
router.delete("/delete/:id", checkAuth, deleteClientPhoto);

module.exports = router;
