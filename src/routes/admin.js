const express = require("express");
const router = express.Router();
const {
  forgotPassword,
  resetPassword,
  suspendUser,
  getAllContent,
  getReviews,
  getTravelDatesByModelId,
  addTravelDates,
  login,
} = require("../controllers/admin/index");
const {
  getAllPendingModal,
  getAverageRating,
  updateUserDocStatus,
  getAllClient,
  getClientById,
  getClientImages,
  updateClientProfile,
  getAllUserDoc,
  updateUserSizeStatus,
} = require("../controllers/admin/model");
const { checkAuth } = require("../middlewares/auth");
const { getPlans } = require("../controllers/admin/plan");
const { updateTravelDate, deleteTravelDate } = require("../controllers/model");

const {
  getAllUSersCount,
  getAllModal,
  getModelById,
  getClientReviews,
  deleteClientImages,
} = require("../controllers/admin/model");

const { checkAdminAuth } = require("../middlewares/auth");
const { updateContent, deleteContent } = require("../controllers/modelContent");
const {
  updateReview,
  getReviewsByUserId,
} = require("../controllers/interaction");
const {
  getClientPhotos,
  updateClientPhoto,
  deleteClientPhoto,
} = require("../controllers/client");
const { updateUserDiscount } = require("../controllers/user");

router.get("/plans", getPlans);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password", checkAdminAuth, resetPassword);

router.get("/user-count",checkAdminAuth, getAllUSersCount);
router.put("/suspend-account/:id", checkAdminAuth, suspendUser);
router.put("/update/discount/:id",checkAdminAuth, updateUserDiscount);

router.get("/active-models", checkAdminAuth, getAllModal);
router.get("/pending-models", checkAdminAuth, getAllPendingModal);
router.get("/get-average-rating/:id", getAverageRating);
router.get("/get-all-content/:id", getAllContent);
router.get("/modal/:id", getModelById);

router.get(
  "/client-sender-reviews/:userId",
  checkAdminAuth,
  checkAdminAuth,
  getReviews
);
router.get("/model-reviews/:userId", getReviewsByUserId);
router.put("/client-update-reviews/:reviewId", checkAdminAuth, updateReview);

router.post("/add-travel-dates/:id",checkAdminAuth, addTravelDates);
router.put("/update-travel-dates/:id",checkAdminAuth, updateTravelDate);
router.delete("/delete-travel-dates/:id",checkAdminAuth, deleteTravelDate);
router.get("/travel-dates/:id",checkAdminAuth, getTravelDatesByModelId);

router.get("/model-doc/:id", checkAdminAuth, getAllUserDoc);
router.put("/model-doc-status/:id", checkAdminAuth, updateUserDocStatus);
router.put("/model-size-status/:id", updateUserSizeStatus);
router.put("/model/content/update/:contentId", updateContent);
router.delete("/delete-content/:contentId", deleteContent);

router.get("/all-client", checkAdminAuth, getAllClient);
router.get("/client/:id", checkAdminAuth, getClientById);
router.get("/client-images/:id", checkAdminAuth, getClientPhotos);
router.put("/client-image-status/:id", checkAdminAuth, updateClientPhoto);
router.delete("/clite-delete-file/:id", checkAdminAuth, deleteClientPhoto);
router.put("/client-profile/:id", updateClientProfile);

module.exports = router;
