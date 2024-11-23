const { sendResponse } = require("../utils");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../configs");
const User = require("../models/user");
const moment = require("moment");

const checkTokenExpirey = async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return sendResponse(res, 401, "Authentication token is required");
    }

    const token = authorization.replace(/^Bearer\s/, "");

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return sendResponse(res, 401, "Token has expired");
      }
      return sendResponse(res, 401, "Authentication token is invalid");
    }

    const user = await User.findById(decoded.user._id || decoded.user.id);

    if (!user) {
      return sendResponse(res, 401, "Authentication token is invalid");
    }
    return sendResponse(res, 200, "Token is valid");
  } catch (error) {
    console.error(error, "error");
    return sendResponse(res, 500, "An error occurred while checking the token");
  }
};

const checkAuth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    // console.log(authorization,"xx");
    if (!authorization) {
      return sendResponse(res, 401, "Authentication token is required");
    }

    const token = authorization.replace(/^Bearer\s/, "");
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.user._id || decoded.user.id);

    if (!user) {
      return sendResponse(res, 401, "Authentication token is invalid");
    }

    switch (user.status?.toLowerCase()) {
      case "suspended":
        return sendResponse(res, 401, "Your account has been suspended!");
      case "blocked":
        return sendResponse(
          res,
          401,
          "Your account has been blocked by the admin!"
        );
      case "rejected":
        return sendResponse(
          res,
          401,
          "Your account has been rejected by the admin!"
        );
      case "active":
        req.user = user;
        return next();
      case "pending":
        req.user = user;
        return next();
      default:
        return sendResponse(res, 401, "Account status is not recognized");
    }
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return sendResponse(res, 401, "Invalid token provided");
    }
    if (err.name === "TokenExpiredError") {
      return sendResponse(res, 401, "Token has expired");
    }
    return sendResponse(res, 500, "Internal server error");
  }
};

const checkAdminAuth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return sendResponse(res, 401, "Authentication token is required");
    }

    const token = authorization.replace(/^Bearer\s/, "");
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(
      decoded.user._id || decoded.user.id
    ).populate("role");

    if (!user) {
      return sendResponse(res, 401, "Authentication token is invalid");
    }

    // Check if the user's role is not 'admin'
    if (user.role?.role !== "admin") {
      return sendResponse(
        res,
        400,
        "Access denied: You do not have permission to access this resource."
      );
    }

    switch (user.status?.toLowerCase()) {
      case "active":
        req.user = user;
        return next();
      default:
        return sendResponse(res, 401, "Account status is not recognized");
    }
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return sendResponse(res, 401, "Invalid token provided");
    }
    if (err.name === "TokenExpiredError") {
      return sendResponse(res, 401, "Token has expired");
    }
    return sendResponse(res, 500, "Internal server error");
  }
};

module.exports = {
  checkAuth,
  checkAdminAuth,
  checkTokenExpirey,
};
