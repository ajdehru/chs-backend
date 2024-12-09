const { sendResponse } = require("../utils");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../configs");
const User = require("../models/user");

const uploadFile = async (req, res, next) => {
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

    return sendResponse(res, 200, "file is uploded successfully!", {
      file: "https://datingadult.s3.us-east-1.amazonaws.com/1732180773674Black-Minimal-Motivation-Quote-LinkedIn-Banner.png",
    });
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
  uploadFile,
};