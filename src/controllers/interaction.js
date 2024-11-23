const Review = require("../models/review");
const UserInteraction = require("../models/intercation");
const Report = require("../models/report");
const { sendResponse } = require("../utils");

async function createReview(req, res) {
  try {
    const { senderId, receiverId, rating, comments } = req.body;

    if (rating < 1 || rating > 5) {
      return sendResponse(
        res,
        400,
        "Invalid rating. Must be between 1 and 5 stars."
      );
    }
    if (rating < 5 && !comments) {
      return sendResponse(
        res,
        400,
        "Comments are required for ratings less than 5 stars."
      );
    }

    const review = new Review({
      senderId,
      receiverId,
      rating,
      comments,
    });

    await review.save();
    return sendResponse(res, 200, "Review created successfully.", review);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function updateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { rating, comments, status } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return sendResponse(res, 404, "Review not found.");
    }

    if (typeof rating !== "undefined") {
      review.rating = rating;
    }
    if (typeof comments !== "undefined") {
      review.comments = comments;
    }
    if (typeof status !== "undefined") {
      review.status = status;
    }

    await review.save();

    return sendResponse(res, 200, "Review updated successfully.", review);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return sendResponse(res, 404, "Review not found.");
    }

    return sendResponse(res, 200, "Review deleted successfully.");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getRandomReviews(req, res) {
  try {
    const reviews = await Review.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: "$senderId",
          review: { $first: "$$ROOT" },
        },
      },
      { $sample: { size: 6 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "senderDetails",
        },
      },
      { $unwind: "$senderDetails" },

      {
        $lookup: {
          from: "contents",
          localField: "senderDetails.coverImage",
          foreignField: "_id",
          as: "senderDetails.coverImageData",
        },
      },

      {
        $lookup: {
          from: "contents",
          localField: "senderDetails.plusImage",
          foreignField: "_id",
          as: "senderDetails.plusImageData",
        },
      },

      {
        $lookup: {
          from: "clientfiles",
          localField: "senderDetails.coverImage",
          foreignField: "_id",
          as: "senderDetails.fileImageData",
        },
      },

      {
        $replaceRoot: { newRoot: { $mergeObjects: ["$review", "$$ROOT"] } },
      },
      { $project: { review: 0 } },
    ]);

    return sendResponse(
      res,
      200,
      "Random reviews retrieved successfully.",
      reviews
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getReviewsByUserId(req, res) {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({
      receiverId: userId,
    })
      .populate({
        path: "senderId",
        populate: [
          { path: "coverImage", model: "Content" },
          { path: "plusImage", model: "Content" },
        ],
      })
      .populate("receiverId")
      .sort({ createdAt: -1 })
      .exec();
    return sendResponse(res, 200, "Reviews retrieved successfully.", reviews);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

// Block/Unblock functionalities
async function blockUser(req, res) {
  try {
    const { userId } = req.params;
    const { interactedUserId } = req.body;

    const isUser = await UserInteraction.find({
      userId,
      interactedUserId,
      type: "Block",
    });

    let interaction = isUser;
    if (!isUser) {
      interaction = new UserInteraction({
        userId,
        interactedUserId,
        type: "Block",
      });

      await interaction.save();
    }

    return sendResponse(res, 200, "User blocked successfully.", interaction);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function unblockUser(req, res) {
  try {
    const { userId } = req.params;
    const { interactedUserId } = req.body;

    await UserInteraction.deleteOne({
      userId,
      interactedUserId,
      type: "Block",
    });

    return sendResponse(res, 200, "User unblocked successfully.");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getBlockedUsers(req, res) {
  try {
    const { userId } = req.params;

    const blockedUsers = await UserInteraction.find({
      userId,
      type: "Block",
    })
      .populate({
        path: "interactedUserId",
        populate: {
          path: "role",
        },
      })
      .exec();

    return sendResponse(
      res,
      200,
      "Blocked users retrieved successfully.",
      blockedUsers
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

// Favorite/Unfavorite functionalities
async function favoriteUser(req, res) {
  try {
    const { userId } = req.params;
    const { interactedUserId, type } = req.body;

    const isAlready = await UserInteraction.find({
      userId,
      interactedUserId,
      type: type,
    });

    if (isAlready && isAlready.length > 0) {
      await UserInteraction.deleteOne({
        userId,
        interactedUserId,
        type: type,
      });
      return sendResponse(res, 200, "User unfavorited successfully.");
    } else {
      const interaction = new UserInteraction({
        userId,
        interactedUserId,
        type: type,
      });
      await interaction.save();
      return sendResponse(
        res,
        200,
        "User favorited/blocked successfully.",
        interaction
      );
    }
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getFavoriteUsers(req, res) {
  try {
    const { userId } = req.params;
    const favoriteUsers = await UserInteraction.find({
      userId,
      type: "Favorite",
    })
      .populate({
        path: "interactedUserId",
        populate: {
          path: "role",
        },
      })
      .exec();
    return sendResponse(
      res,
      200,
      "Favorite users retrieved successfully.",
      favoriteUsers
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function checkIsFavoriteUsers(req, res) {
  try {
    const { userId, interactedUserId } = req.params;
    const favoriteUsers = await UserInteraction.findOne({
      userId,
      interactedUserId,
      type: "Favorite",
    }).exec();

    const blockUsers = await UserInteraction.findOne({
      userId,
      interactedUserId,
      type: "Block",
    }).exec();

    return sendResponse(res, 200, "Favorite users cheking.", {
      favorite: favoriteUsers ? true : false,
      block: blockUsers ? true : false,
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

// Report functionalities
async function createReport(req, res) {
  try {
    const {
      reporterUserId,
      reportedUserId,
      contentId,
      contentType,
      reportType,
      details,
    } = req.body;

    const report = new Report({
      reporterUserId,
      reportedUserId,
      contentId,
      contentType,
      reportType,
      details,
    });

    await report.save();
    return sendResponse(res, 200, "Report created successfully.", report);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function updateReportStatus(req, res) {
  try {
    const { status, adminId } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: status, reviewedBy: adminId },
      { new: true }
    );

    if (!report) {
      return sendResponse(res, 404, "Report not found.");
    }
    return sendResponse(
      res,
      200,
      "Report status updated successfully.",
      report
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getReports(req, res) {
  try {
    const reports = await Report.find()
      .populate("reporterUserId")
      .populate("reportedUserId")
      .populate("contentId");

    if (!reports) {
      return sendResponse(res, 404, "Report not found.");
    }
    return sendResponse(
      res,
      200,
      "Report status updated successfully.",
      reports
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

module.exports = {
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
  checkIsFavoriteUsers,
};
