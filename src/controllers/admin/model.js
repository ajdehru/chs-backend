const { sendResponse } = require("../../utils");
const User = require("../../models/user");
const transactionLog = require("../../models/transactionLog");
const report = require("../../models/report");
const Review = require("../../models/review");
const mongoose = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;
const Content = require("../../models/content");
const Client = require("../../models/client");
const modelDocument = require("../../models/modelDocument");
const model = require("../../models/model");

const getAllUSersCount = async (req, res) => {
  try {
    // Fetch users with populated fields
    const users = await User.find()
      .populate([{ path: "role" }, { path: "model" }, { path: "subscription" }])
      .lean()
      .exec();

    const currentDate = new Date();
    const threeMonthsAgo = new Date(currentDate);
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
    const oneYearAgo = new Date(currentDate);
    oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

    const payments = await transactionLog
      .find({ status: "Received" })
      .sort({ createdAt: -1 })
      .lean();

    const revenue = {
      monthly: 0,
      quarterly: 0,
      yearly: 0,
    };
    payments.forEach((payment) => {
      const paymentAmount = Number(payment.adminAmount) || 0;
      const paymentDate = new Date(payment.createdAt);

      //Monthly revenue
      if (
        paymentDate >= new Date(currentDate.setDate(currentDate.getDate() - 30))
      ) {
        revenue.monthly += paymentAmount;
      }

      // Quarterly and Yearly Revenue
      if (paymentDate >= threeMonthsAgo) {
        revenue.quarterly += paymentAmount;
      }
      if (paymentDate >= oneYearAgo) {
        revenue.yearly += paymentAmount;
      }
    });
    revenue.monthly = Math.round(revenue.monthly);
    revenue.quarterly = Math.round(revenue.quarterly);
    revenue.yearly = Math.round(revenue.yearly);

    const reportCount = await report.countDocuments({ status: "Pending" });

    const resp = {
      model: { gent: 0, elite_gent: 0, exclusive_elite_gent: 0 },
      client: { regular: 0, elite: 0 },
      verification: { new: 0, resubmitted: 0 },
      revenue: revenue,
      reports: { complaints: reportCount },
    };

    users.forEach((user) => {
      if (
        user.role &&
        user.role.role === "model" &&
        user.model &&
        user.subscription
      ) {
        if (user.status === "Active") {
          switch (user.subscription.subscriptionType) {
            case "Gent":
              resp.model.gent++;
              break;
            case "Elite_Gent":
              resp.model.elite_gent++;
              break;
            case "Exclusive_Elite_Gent":
              resp.model.exclusive_elite_gent++;
              break;
          }
        } else if (user.status === "Pending") {
          resp.verification.new++;
        } else if (user.status === "Rejected") {
          resp.verification.resubmitted++;
        } else if (user.status === "Suspended") {
          switch (user.subscription.subscriptionType) {
            case "Gent":
              resp.model.gent++;
              break;
            case "Elite_Gent":
              resp.model.elite_gent++;
              break;
            case "Exclusive_Elite_Gent":
              resp.model.exclusive_elite_gent++;
              break;
          }
        }
      } else if (
        user.role &&
        user.role.role === "client" &&
        user.subscription
      ) {
        switch (user.subscription.subscriptionType) {
          case "Regular_Client":
            resp.client.regular++;
            break;
          case "Elite_Client":
            resp.client.elite++;
            break;
        }
      }
    });

    return sendResponse(res, 200, "Plans retrieved successfully", resp);
  } catch (error) {
    console.error("Error in getPlans:", error);
    return sendResponse(res, 500, "An error occurred while fetching plans");
  }
};

async function getAllModal(req, res) {
  try {
    const status = req.query.status;
    let page = parseInt(req.query.currentPage) || 1;
    const limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    const users = await User.find()
      .populate("role")
      .populate("model")
      .populate("subscription")
      .populate("coverImage")
      .populate("plusImage")
      .exec();

    let data = users?.filter(
      (user) =>
        user?.role?.role === "model" &&
        user.subscription !== null &&
        user.model !== null &&
        (user.status?.toLowerCase() == "active" ||
          user.status?.toLowerCase() == "suspended")
    );

    if (status) {
      data = data.filter(
        (user) =>
          user.subscription.subscriptionType.toLowerCase() ===
            status.toLowerCase() ||
          user.status?.toLowerCase() === status.toLowerCase()
      );
    }

    const totalUsers = data?.length;
    let paginatedData = data.slice(skip, skip + limit);

    if (paginatedData?.length <= 0) {
      page = 1;
      skip = (page - 1) * limit;
      paginatedData = data.slice(skip, skip + limit);
    }

    return sendResponse(res, 200, "All models fetched!", paginatedData, {
      page,
      limit,
      totalUsers,
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}
async function getAllClient(req, res) {
  try {
    const status = req.query.status;
    let page = parseInt(req.query.currentPage) || 1;
    const limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    const users = await User.find()
      .populate("role")
      .populate("client")
      .populate("subscription")
      .exec();
    let data = users?.filter(
      (user) =>
        user?.role?.role === "client" &&
        user.subscription !== null &&
        user.client !== null
    );

    console.log(status, "admin12@yopmail.com");
    if (status) {
      data = data.filter(
        (user) =>
          user.subscription.subscriptionType.toLowerCase() ===
            status.toLowerCase() ||
          user.status?.toLowerCase() === status.toLowerCase()
      );
    }

    const totalUsers = data?.length;
    let paginatedData = data.slice(skip, skip + limit);

    if (paginatedData?.length <= 0) {
      page = 1;
      skip = (page - 1) * limit;
      paginatedData = data.slice(skip, skip + limit);
    }

    return sendResponse(res, 200, "All Clients fetched!", paginatedData, {
      page,
      limit,
      totalUsers,
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getModelById(req, res) {
  try {
    const model = await User.findById(req.params.id)
      .populate("role")
      .populate({
        path: "model",
        populate: {
          path: "social_media",
        },
      })
      .populate("coverImage")
      .populate("plusImage")
      .exec();
    if (
      !model
      // || model.model.verification_status !== "Verified"
    ) {
      return sendResponse(res, 404, "Model not found");
    }
    return sendResponse(res, 200, "Model fetched", model);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getClientById(req, res) {
  try {
    const client = await User.findById(req.params.id)
      .populate("role")
      .populate("client")
      .populate("subscription")
      .exec();
    if (!client) {
      return sendResponse(res, 404, "Client not found");
    }

    return sendResponse(res, 200, "Client fetched", client);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getClientImages(req, res) {
  try {
    const clientId = req.params.id;
    const images = await Content.find({
      userId: clientId,
      contentType: "image",
    })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    if (images.length === 0) {
      return sendResponse(res, 404, "No images found for this client.");
    }
    return sendResponse(res, 200, "Client Images fetched successfully", images);
  } catch (error) {
    return sendResponse(res, 500, "Error fetching client images");
  }
}
async function getClientReviews(req, res) {
  try {
    const userId = req.params.id;
    const reviews = await Review.find({
      receiverId: userId,
    })
      .populate({
        path: "senderId",
        select: "firstName lastName profile_image",
      })
      .populate({
        path: "receiverId",
        select: "firstName lastName profile_image",
      })
      .sort({ createdAt: -1 })
      .exec();
    return sendResponse(
      res,
      200,
      "Client Reviews fetched successfully",
      reviews
    );
  } catch (error) {
    return sendResponse(res, 500, "Error fetching client reviews");
  }
}
async function deleteClientImages(req, res) {
  try {
    const imageKey = req.params.key;
    const image = await Content.findOneAndDelete({
      key: imageKey,
    }).exec();
    if (!image) {
      return sendResponse(res, 404, "Image not found");
    }
    return sendResponse(res, 200, "Client Image deleted successfully");
  } catch (error) {
    return sendResponse(res, 500, "Error deleting client images");
  }
}

async function updateClientProfile(req, res) {
  try {
    const { stats } = req.body;

    if (stats?.cockSize) {
      stats.cockStatus = "Pending";
    }
    const updateData = { ...req.body };
    if (stats) {
      updateData.stats = stats;
    }

    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!updatedClient) {
      return sendResponse(res, 404, "Client not found");
    }

    return sendResponse(res, 200, "Profile Updated", updatedClient);
  } catch (error) {
    console.error("Error updating profile:", error);

    return sendResponse(res, 500, error.message);
  }
}

async function getAllPendingModal(req, res) {
  try {
    let page = parseInt(req.query.currentPage);
    const limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    const status = req.query.status;
    const users = await User.find()
      .populate("role")
      .populate("model")
      .populate("subscription")
      .exec();

    let data = users?.filter(
      (user) =>
        user?.role?.role === "model" &&
        user.subscription !== null &&
        user.model !== null &&
        (user.status?.toLowerCase() == "pending" ||
          user.status?.toLowerCase() == "rejected")
    );

    if (status) {
      data = data.filter(
        (user) => user.status?.toLowerCase() === status.toLowerCase()
      );
    }

    const totalUsers = data?.length;
    let paginatedData = data.slice(skip, skip + limit);

    if (paginatedData?.length <= 0) {
      page = 1;
      skip = (page - 1) * limit;
      paginatedData = data.slice(skip, skip + limit);
    }

    return sendResponse(res, 200, "Pending models fetched!", paginatedData, {
      page,
      limit,
      totalUsers,
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getAllUserDoc(req, res) {
  try {
    if (!req?.params?.id) {
      return sendResponse(res, 400, "User ID is required");
    }

    const modelDocs = await modelDocument.find({ userId: req.params.id });

    if (!modelDocs.length) {
      return sendResponse(res, 404, "Documents not found");
    }
    return sendResponse(res, 200, "Documents fetched successfully", modelDocs);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return sendResponse(res, 500, "Internal server error");
  }
}

async function updateUserSizeStatus(req, res) {
  try {
    const { status, reason } = req.body;

    if (!req?.params?.id) {
      return sendResponse(res, 400, "User ID is required");
    }

    if (!status) {
      return sendResponse(res, 400, "Status is required");
    }

    const modelDoc = await modelDocument.findOneAndUpdate(
      {
        userId: req.params.id,
        verificationType: { $in: ["Size"] },
      },
      {
        status: status,
        reasonForStatus: reason,
      }
    );

    if (!modelDoc) {
      return sendResponse(res, 404, "Document not found");
    }

    // First find the user and populate model
    const user = await User.findById(req.params.id).populate("model");

    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    if (!user?.model) {
      return sendResponse(res, 404, "Model document not found for this user");
    }

    const modelData = await model.findByIdAndUpdate(
      user?.model?._id,
      {
        $set: {
          "stats.cockStatus": status,
        },
      },
      { new: true }
    );

    return sendResponse(res, 200, "Verification status updated successfully", {
      modelData,
    });
  } catch (error) {
    console.error("Error updating document status:", error);
    return sendResponse(res, 500, error.message || "Internal server error");
  }
}

async function updateUserDocStatus(req, res) {
  try {
    const { status, reason } = req.body;

    if (!req?.params?.id) {
      return sendResponse(res, 400, "User ID is required");
    }

    if (!status) {
      return sendResponse(res, 400, "Status is required");
    }

    const modelDoc = await modelDocument.updateMany(
      {
        userId: req.params.id,
        verificationType: { $in: ["Selfie", "Identity"] },
      },
      {
        status: status,
        reasonForStatus: status?.toLowerCase() != "approved" ? reason : null,
      }
    );

    if (!modelDoc) {
      return sendResponse(res, 404, "Document not found");
    }

    // First find the user and populate model
    const user = await User.findById(req.params.id).populate("model");

    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    if (!user?.model) {
      return sendResponse(res, 404, "Model document not found for this user");
    }

    if (status?.toLowerCase() == "rejected") {
      await User.findByIdAndUpdate(req?.params?.id, {
        status: "Rejected",
        reasonForSuspension: reason,
      });
    }

    const modelData = await model.findByIdAndUpdate(user?.model?._id, {
      verification_status: status,
    });

    return sendResponse(res, 200, "Verification status updated successfully", {
      modelData,
    });
  } catch (error) {
    console.error("Error updating document status:", error);
    return sendResponse(res, 500, error.message || "Internal server error");
  }
}

async function getAverageRating(req, res) {
  try {
    const userId = req.params.id;

    const averageRating = await Review.aggregate([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const result =
      averageRating.length > 0
        ? parseFloat(averageRating[0].averageRating.toFixed(1))
        : 0;

    return sendResponse(res, 200, "Average rating fetched", {
      averageRating: result,
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}
module.exports = {
  getAllUSersCount,
  getAllModal,
  getAllClient,
  getModelById,
  getClientById,
  getClientReviews,
  deleteClientImages,
  getAllPendingModal,
  getAverageRating,
  updateUserDocStatus,
  getClientImages,
  updateClientProfile,
  getAllUserDoc,
  updateUserSizeStatus,
};
