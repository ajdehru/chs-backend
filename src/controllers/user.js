const { FRONTEND_URL } = require("../configs");
const User = require("../models/user");
const {
  sendResponse,
  generateToken,
  handleingError,
  capitalizeFirstLetter,
} = require("../utils");
const bcrypt = require("bcrypt");
// const { forSendEmail } = require("../utils/helpers/sendEmail");

const signUp = async (req, res) => {
  try {
    const { name, phoneNumber, email, password, address, role } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, "Email and Password are required!");
    }

    const existingUser = await User.findOne({ email: email?.toLowerCase() });
    if (existingUser) {
      return sendResponse(res, 400, "This email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      ...req.body,
      role: capitalizeFirstLetter(role),
      email: email?.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    const user = await getUserByEmail(email);

    const token = generateToken(user, "1h");

    const data = {
      name: user?.name || name,
      link: `${FRONTEND_URL}account-type?token=${token}`,
    };
    console.log(data, "data");
    // await forSendEmail({
    //   template: "verify-email.html",
    //   data,
    //   subject: "Email Verification",
    //   email: user.email,
    // });

    return sendResponse(
      res,
      201,
      "Registration successful. Please check your email for verification.",
      hideInfo(user)
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const user = await getUserByEmail(req.body.email);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    const token = generateToken(user, "5m");

    const data = {
      name: user?.username || "",
      link: `${FRONTEND_URL}reset-password?token=${token}`,
    };

    console.log(data, "data");
    // await forSendEmail({
    //   template: "reset-password.html",
    //   data,
    //   subject: "Reset Your Password",
    //   email: user.email,
    // });

    return sendResponse(res, 200, "Link Sent successfully.", []);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const userEmialVerify = async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = await User.findByIdAndUpdate(userId, { emailVerified: true });
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }
    const userDetails = await getUserByEmail(user.email);

    return sendResponse(
      res,
      200,
      "Email verification successfully",
      hideInfo(userDetails)
    );
  } catch (error) {
    return handleingError(res, error);
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return sendResponse(res, 400, "User ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    // if (!user.emailVerified) {
    //   return sendResponse(res, 400, "Please verify your email first!");
    // }

    const updateFields = {};

    const {
      email,
      password,
      oldPassword,
      name,
      phoneNumber,
      role,
      address,
      profile,
      notification,
    } = req.body;

    if (email) updateFields.email = email;
    if (name) updateFields.name = name;
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (profile) updateFields.profile = profile;
    if (address) updateFields.address = address;
    if (typeof notification !== "undefined")
      updateFields.notification = notification;

    if (password) {
      // if (typeof oldPassword !== undefined) {
      //   const isOldPasswordSame = await bcrypt.compare(
      //     oldPassword,
      //     user.password
      //   );
      //   if (!isOldPasswordSame) {
      //     return sendResponse(
      //       res,
      //       400,
      //       "Previous password is incorrect. Please enter a valid previous password."
      //     );
      //   }
      // }

      const isPasswordSame = await bcrypt.compare(password, user.password);
      if (isPasswordSame) {
        return sendResponse(
          res,
          400,
          "Please use a different password than your current one"
        );
      }
      updateFields.password = await bcrypt.hash(password, 10);
    }

    if (role) {
      updateFields.role = capitalizeFirstLetter(role);
    }

    // Update the user with only the provided fields
    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return sendResponse(res, 404, "User not found");
    }

    const userDetails = await getUserByEmail(updatedUser.email);
    return sendResponse(
      res,
      200,
      "User profile updated successfully",
      hideInfo(userDetails)
    );
  } catch (error) {
    return handleingError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return sendResponse(res, 400, "Email and Password are required!");
    }

    let user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      return sendResponse(res, 400, "This account does not exist.");
    }

    // Check if the user's email is verified
    // if (!user.emailVerified) {
    //   return sendResponse(res, 400, "Please verify your email first!");
    // }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return sendResponse(res, 400, "Incorrect password.");
    }

    user = await getUserByEmail(email);

    const token = generateToken(user);

    return sendResponse(res, 200, "Login successful", {
      ...hideInfo(user),
      accessToken: token,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, error.message);
  }
};

const getUpdatedProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    let user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 400, "This account does not exist.");
    }

    user = await getUserByEmail(user?.email);

    const token = generateToken(user);

    return sendResponse(res, 200, "getting updatedData successful", {
      ...hideInfo(user),
      accessToken: token,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, error.message);
  }
};

const updateDp = async (req, res) => {
  try {
    const userId = req.user._id;
    const { file } = req;

    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }
    if (file) {
      user.coverImage = file.location;
    }
    await user.save();

    return sendResponse(
      res,
      200,
      "User profile pic updated successfully",
      user
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getUser = async (req, res) => {
  try {
    const { _id } = req.user;
    const user = await User.findById(_id).populate("profile");
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    return sendResponse(res, 200, "User Detail getting successfully", user);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const updateUserDiscount = async (req, res) => {
  // try {
  //   const userId = req.params.id;
  //   const { discount } = req.body;
  //   if (!userId) {
  //     return sendResponse(res, 400, "User ID is required");
  //   }
  //   if (discount === undefined) {
  //     return sendResponse(res, 400, "Discount value is required");
  //   }
  //   const user = await UserSubscription.findOneAndUpdate(
  //     { user: userId },
  //     {
  //       stripeDiscount: discount,
  //       subscriptionType:
  //         discount == "0" ? "Elite_Gent" : "Exclusive_Elite_Gent",
  //     },
  //     { new: true }
  //   );
  //   console.log(user, userId);
  //   if (!user) {
  //     return sendResponse(res, 404, "User not found");
  //   }
  //   return sendResponse(
  //     res,
  //     200,
  //     "User discount has been updated successfully",
  //     hideInfo(user)
  //   );
  // } catch (error) {
  //   return handleingError(res, error);
  // }
};

const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email: email?.toLowerCase() })
      .populate("profile")
      .populate("subscription")
      .exec();

    if (!user) return null;

    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw new Error("Failed to fetch user by email.");
  }
};

const hideInfo = (data) => {
  if (!data) return null;

  const user = ({
    password: hashPwd,
    notification,
    ...withoutSensitiveInfo
  } = data.toObject());

  return withoutSensitiveInfo;
};

module.exports = {
  signUp,
  login,
  updateUser,
  updateDp,
  getUser,
  forgotPassword,
  userEmialVerify,
  getUserByEmail,
  hideInfo,
  updateUserDiscount,
  getUpdatedProfile,
};
