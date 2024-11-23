const { JWT_SECRET } = require("../configs");
const jwt = require("jsonwebtoken");
const serverResponses = require("./constant");

function responseError(statusCode, message) {
  let response = {
    status: false,
  };
  if (message) {
    response.message = message;
  }
  response.error = serverResponses[statusCode] || "Unknowm Error!";
  return response;
}

const sendResponse = (res, code, message, data, addOns) => {
  if (code == 200 || code == 201) {
    return res.status(code).json({ status: true, message, data, addOns });
  } else if (code == 404) {
    return res.status(code).json({ status: true, message, data: [] });
  }
  return res.status(code).json(responseError(code, message));
};

function generateToken(user, expiresIn = null) {
  const options = {};
  if (expiresIn) {
    options.expiresIn = expiresIn;
  }

  const token = jwt.sign({ user }, JWT_SECRET, options);
  return token;
}

const handleingError = (res, error) => {
  if (error instanceof Error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      return sendResponse(res, 400, "Account id is not correct");
    }

    if (error.name === "CastError" && error.kind === "ObjectId") {
      return sendResponse(res, 400, "Invalid ObjectId format");
    }

    if (error.name === "ValidationError") {
      return sendResponse(res, 400, "Validation failed: " + error.message);
    }

    if (
      error.message.includes("not found") ||
      error.name === "DocumentNotFoundError"
    ) {
      return sendResponse(res, 404, "User not found");
    }

    return sendResponse(res, 500, "Internal Server Error: " + error.message);
  }

  return sendResponse(res, 500, "An unexpected error occurred");
};

const capitalizeFirstLetter = (str) => {
  if (typeof str !== "string" || str.length === 0) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};

module.exports = {
  sendResponse,
  generateToken,
  handleingError,
  capitalizeFirstLetter,
};
