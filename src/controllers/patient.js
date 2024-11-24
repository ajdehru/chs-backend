const patientProfile = require("../models/patientProfile");
const User = require("../models/user");
const {
  sendResponse,
  handleingError,
  capitalizeFirstLetter,
} = require("../utils");
const bcrypt = require("bcrypt");
const { calculateAge } = require("../utils/helpers/patient");

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params?.userId);
    const profileId = user?.profile;
    if (!profileId) {
      return sendResponse(res, 400, "Patient ID is required");
    }

    const patient = await patientProfile.findById(profileId);
    if (!patient) {
      return sendResponse(res, 404, "Patient not found");
    }

    const updateFields = {};
    const updateUserFields = {};

    const {
      firstName,
      lastName,
      birthDate,
      phoneNumber,
      email,
      bloodGroup,
      address,
      city,
      state,
      country,
      pinCode,
      gender,
    } = req.body;

    if (gender) updateFields.gender = gender;
    if (lastName) updateFields.lastName = lastName;
    if (bloodGroup) updateFields.bloodGroup = bloodGroup;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (country) updateFields.country = country;
    if (pinCode) updateFields.pinCode = pinCode;
    if (birthDate) {
      updateFields.birthDate = birthDate;

      let isAge = calculateAge(birthDate);
      updateFields.age = `${isAge?.years} years ${isAge?.months
        .toString()
        .padStart(2, "0")} months`;
    }
    if (phoneNumber) {
      updateFields.phoneNumber = phoneNumber;
      updateUserFields.phoneNumber = phoneNumber;
    }
    if (firstName) {
      updateFields.firstName = firstName;
      updateUserFields.name = firstName;
    }
    if (address) {
      updateFields.address = address;
      updateUserFields.address = address;
    }
    if (email) {
      updateFields.email = email?.toLoWerCase();
      updateUserFields.email = email?.toLoWerCase();
    }
    if (updateUserFields && Object?.keys(updateUserFields)?.length > 0) {
      await User.findByIdAndUpdate(user?._id, updateUserFields, {
        new: true,
      });
    }

    const updatedUser = await patientProfile.findByIdAndUpdate(
      profileId,
      updateFields,
      {
        new: true,
      }
    );

    if (!updatedUser) {
      return sendResponse(res, 404, "Patient Profile not found");
    }

    return sendResponse(
      res,
      200,
      "User profile updated successfully",
      updatedUser
    );
  } catch (error) {
    return handleingError(res, error);
  }
};

module.exports = {
  updateProfile,
};
