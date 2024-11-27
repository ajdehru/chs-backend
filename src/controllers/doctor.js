const doctorProfile = require("../models/doctorProfile");
const User = require("../models/user");
const {
  sendResponse,
  handleingError,
  capitalizeFirstLetter,
} = require("../utils");

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params?.userId);
    const profileId = user?.profile;
    if (!profileId) {
      return sendResponse(res, 400, "Profile id is required");
    }

    const doctor = await doctorProfile.findById(profileId);
    if (!doctor) {
      return sendResponse(res, 404, "Doctor not found");
    }

    const updateFields = {};
    const updateUserFields = {};

    const {
      firstName,
      lastName,
      displayName,
      designation,
      email,
      availability,
      achievement,
      languages,
      country,
      state,
      city,
    } = req.body;

    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (country) updateFields.country = country;
    if (languages) updateFields.languages = languages;
    if (lastName) updateFields.lastName = lastName;
    if (displayName) updateFields.displayName = displayName;
    if (designation)
      updateFields.designation = capitalizeFirstLetter(designation);
    updateFields.availability = availability || false;
    if (achievement) updateFields.achievement = achievement;
    if (firstName) {
      updateFields.firstName = capitalizeFirstLetter(firstName);
      updateUserFields.name = capitalizeFirstLetter(firstName);
    }
    // if (address) {
    //   updateFields.address = address;
    //   updateUserFields.address = address;
    // }
    if (email) {
      updateFields.email = email?.toLowerCase();
      updateUserFields.email = email?.toLowerCase();
    }
    if (updateUserFields && Object?.keys(updateUserFields)?.length > 0) {
      await User.findByIdAndUpdate(user?._id, updateUserFields, {
        new: true,
      });
    }

    const updatedUser = await doctorProfile.findByIdAndUpdate(
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

const getAllDoctors = async (req, res) => {
  try {
    let doctors = await User.find({ role: "Doctor" }).populate("profile").exec();
    if (!doctors || doctors?.length == 0) {
      return sendResponse(res, 200, "Doctors not found");
    }

    return sendResponse(res, 200, "User Detail getting successfully", doctors);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

module.exports = {
  updateProfile,
  getAllDoctors,
};
