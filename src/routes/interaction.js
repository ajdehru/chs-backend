const express = require("express");
const router = express.Router();

const { checkAuth } = require("../middlewares/auth");
const {
  createReview,
  updateReview,
  getRandomReviews,
  getReviewsByUserId,
  blockUser,
  unblockUser,
  getBlockedUsers,
  favoriteUser,
  getFavoriteUsers,
  createReport,
  updateReportStatus,
  deleteReview,
  getReports,
  checkIsFavoriteUsers
} = require('../controllers/interaction');

// Review routes
router.post("/review", checkAuth, createReview);
router.put("/:reviewId/review", checkAuth, updateReview);
router.delete("/:reviewId/review", checkAuth, deleteReview);
router.get("/random/reviews", getRandomReviews);
router.get("/:userId/reviews", getReviewsByUserId);

// Block user routes
router.post("/:userId/block", checkAuth, blockUser);
router.post("/:userId/unblock", checkAuth, unblockUser);
router.get("/:userId/blocked-users", checkAuth, getBlockedUsers);

// Favorite user routes
router.post("/:userId/favorite", checkAuth, favoriteUser);
router.get("/:userId/favorite-users", checkAuth, getFavoriteUsers);
router.get("/:userId/:interactedUserId", checkAuth, checkIsFavoriteUsers);
// Report user route
router.post("/report", checkAuth, createReport);
router.put("/:id/report", checkAuth, updateReportStatus);
router.get("/reports", checkAuth, getReports);

module.exports = router;
