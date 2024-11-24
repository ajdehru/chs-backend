const { FRONTEND_URL } = require("../configs");
const sendSms = require("../configs/sendSms");
const patientProfile = require("../models/patientProfile");
const User = require("../models/user");
const UserOtp = require("../models/userOtp");
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

    if (!phoneNumber || !password) {
      return sendResponse(res, 400, "Phone number and password are required!");
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      if (existingUser?.email == email?.toLowerCase()) {
        return sendResponse(res, 400, "This email is already used");
      }
      return sendResponse(res, 400, "This phone number is already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPatientUser = new patientProfile({
      firstName: name,
      phoneNumber,
      email: email?.toLowerCase(),
      address,
    });
    await newPatientUser.save();

    const newUser = new User({
      name,
      phoneNumber,
      email: email?.toLowerCase(),
      password: hashedPassword,
      address,
      role: capitalizeFirstLetter(role),
      profile: newPatientUser?._id,
      isVerified: false,
    });

    await newUser.save();

    sendOtpToPhoneNumber(phoneNumber);

    const user = await getUserByEmail(newUser?.email);

    return sendResponse(
      res,
      201,
      "Registration successful. An OTP has been sent to your phone number for verification.",
      user
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const user = await User?.findOne({ phoneNumber: req.body.phoneNumber });
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    await sendOtpToPhoneNumber(user?.phoneNumber);

    return sendResponse(res, 200, "Otp sent to phone number successfully.");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    const userOtp = await UserOtp.findOne({ phoneNumber });
    if (!userOtp) {
      return sendResponse(res, 400, "No otp found ");
    }

    if (userOtp?.otp !== otp || userOtp?.otpExpiry < Date.now()) {
      return sendResponse(res, 400, "Invalid or expired OTP");
    }

    await UserOtp.findByIdAndDelete(userOtp?._id);
    let user = await User?.findOneAndUpdate(
      { phoneNumber },
      { isVerified: true }
    );

    return sendResponse(res, 200, "OTP verified successfully", hideInfo(user));
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
    const userId = req.params?.userId;
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

    const { password, oldPassword, role, profile, notification } = req.body;

    if (profile) updateFields.profile = profile;
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
    const { phoneNumber, password } = req.body;

    // Check if email and password are provided
    if (!phoneNumber || !password) {
      return sendResponse(res, 400, "Email and Password are required!");
    }

    let user = await User.findOne({ phoneNumber });
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

    user = await getUserByEmail(user?.email);

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

const sendOtpToPhoneNumber = async (phoneNumber) => {
  const otp = Math.floor(1000 + Math.random() * 9000);

  const newUserOtp = new UserOtp({
    otp,
    otpExpiry: Date.now() + 10 * 60 * 1000,
    phoneNumber,
  });
  await newUserOtp.save();

  console.log("Otp : ", otp);
  const message = `Your verification code is ${otp}. It is valid for 10 minutes.`;
  // await sendSms(phoneNumber, message);
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
  verifyOtp,
};
