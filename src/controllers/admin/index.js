const { sendResponse, generateToken } = require("../../utils");
const User = require("../../models/user");
const bcrypt = require("bcrypt");
const { JWT_SECRET } = require("../../configs");
const jwt = require("jsonwebtoken");
const { getUserByEmail, hideInfo } = require("../../controllers/user");
const { FRONTEND_ADMIN_URL } = require("../../configs");
const { forSendEmail } = require("../../utils/helpers/sendEmail");
const Content = require("../../models/content");
const Review = require("../../models/review");
const TravelDates = require("../../models/travelDates");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, "Email and Password are required!");
    }

    let user = await User.findOne({ email: email?.toLowerCase() }).populate(
      "role"
    );

    if (!user) {
      return sendResponse(res, 400, "This account does not exist.");
    }

    // Check if the user's role is not 'admin'
    if (user.role?.role !== "admin") {
      return sendResponse(
        res,
        400,
        "Access denied: You do not have permission to access this resource."
      );
    }

    // Check if the user's email is verified
    if (!user.emailVerified) {
      return sendResponse(res, 400, "Please verify your email first!");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return sendResponse(res, 401, "Invalid password. Please try again.");
    }

    // Generate a token for the user
    const token = generateToken(user);

    // Hide sensitive information before sending the response
    user = hideInfo(user);

    // Return the response with the user data and access token
    return sendResponse(res, 200, "Login successful", {
      ...user,
      accessToken: token,
    });
  } catch (error) {
    // Log the error and return a 500 response
    console.error(error);
    return sendResponse(res, 500, error.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const user = await getUserByEmail(req.body.email);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    // Check if the user's role is not 'admin'
    if (user.role?.role !== "admin") {
      return sendResponse(
        res,
        400,
        "Access denied: You do not have permission to access this resource."
      );
    }

    const token = generateToken(user, "5m");

    const data = {
      name: user?.username || "",
      // link: `https://stg-admin.paragongents.com/auth/reset-password?token=${token}`,
      link: `${FRONTEND_ADMIN_URL}auth/reset-password?token=${token}`,
    };

    console.log(data, "data");
    await forSendEmail({
      template: "reset-password.html",
      data,
      subject: "Reset Your Password",
      email: user.email,
    });

    return sendResponse(res, 200, "Link Sent successfully.", []);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    let user = await User.findById(req?.user?._id).populate("role");
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    const isPasswordSame = await bcrypt.compare(password, user.password);
    if (isPasswordSame) {
      return sendResponse(
        res,
        400,
        "Please use a different password than your current one"
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    return sendResponse(res, 200, "Password reset successfully");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const suspendUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason, status } = req.body;

    const user = await User.findById(userId).populate("model");
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }
    if (
      status?.toLowerCase() == "active" &&
      user?.model &&
      user?.model?.verification_status?.toLowerCase() != "approved"
    ) {
      return sendResponse(res, 402, `Model document is not verified!`);
    }

    const isContent = await Content.findOne({ userId, verified: "Approved" });

    if (status?.toLowerCase() == "active" && user?.model && !isContent) {
      return sendResponse(res, 402, `Model Media is not verified!`);
    }
    const suspendedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          status: status,
          reasonForSuspension: reason,
        },
      },
      { new: true } //to return the updated document.
    );

    if (suspendedUser) {
      return sendResponse(res, 200, `User ${status} successfully`);
    } else {
      return sendResponse(res, 400, "User suspension failed");
    }
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getAllContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.find({ userId: id })
      .populate("userId")
      .sort({ createdAt: -1 })
      .exec();

    return sendResponse(
      res,
      200,
      "User content retrieved successfully.",
      content
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ senderId: userId })
      .populate("senderId")
      .populate("receiverId")
      .exec();
    return sendResponse(res, 200, "Reviews retrieved successfully.", reviews);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getTravelDatesByModelId = async (req, res) => {
  try {
    const today = new Date();

    const modelTvlDate = await TravelDates.find({
      modelId: req.params.id,
      // endDate: { $gte: today }, //Only getting dates from today onward.
    });
    if (!modelTvlDate || modelTvlDate.length === 0) {
      return sendResponse(res, 200, "No Travel Date found", []);
    }
    return sendResponse(
      res,
      200,
      "Travel Date retrieved successfully",
      modelTvlDate
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const addTravelDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, startDate, endDate } = req.body;
    const newTravelDate = new TravelDates({
      modelId: id,
      location,
      startDate,
      endDate,
    });
    const savedTravelDate = await newTravelDate.save();
    res.status(201).json({
      status: true,
      message: "Travel date added successfully",
      data: savedTravelDate,
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedContent = await Content.findByIdAndDelete(id);
    if (!deletedContent) {
      return sendResponse(res, 404, "Content not found");
    }
    return sendResponse(res, 200, "Content deleted successfully");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
module.exports = {
  login,
  forgotPassword,
  resetPassword,
  suspendUser,
  getAllContent,
  getReviews,
  getTravelDatesByModelId,
  addTravelDates,
  deleteContent,
};
