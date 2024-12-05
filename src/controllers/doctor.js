const doctorProfile = require("../models/doctorProfile");
const User = require("../models/user");
const PatientAppointment = require("../models/userAppointment");
const DoctorClinic = require("../models/doctorClinc");

const {
  sendResponse,
  handleingError,
  capitalizeFirstLetter,
} = require("../utils");
const { default: mongoose } = require("mongoose");

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
    let doctors = await User.find({ role: "Doctor" })
      .populate("profile")
      .exec();
    if (!doctors || doctors?.length == 0) {
      return sendResponse(res, 200, "Doctors not found");
    }

    return sendResponse(res, 200, "User Detail getting successfully", doctors);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getDoctorDashboardData = async (req, res) => {
  try {
    const doctorId = req.params?.doctorId;

    if (!doctorId) {
      return sendResponse(res, 400, "Doctor ID is required!");
    }

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // Query for today's appointments
    const todayAppointments = await PatientAppointment.find({
      refDoctor: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate("patientId");

    // Query for all patients (unique patients)
    const allPatients = await PatientAppointment.find({
      refDoctor: doctorId,
    }).distinct("patientId");

    // Get today's unique patients
    const todayPatients = [
      ...new Set(todayAppointments.map((a) => a.patientId)),
    ];

    // Get the last upcoming appointment
    const lastUpcomingAppointment = await PatientAppointment.findOne({
      refDoctor: doctorId,
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .populate("patientId");

    // Query for yesterday's data for percentage analysis
    const startOfYesterday = new Date(
      startOfDay.setDate(startOfDay.getDate() - 1)
    );
    const endOfYesterday = new Date(endOfDay.setDate(endOfDay.getDate() - 1));

    const yesterdayAppointments = await PatientAppointment.find({
      refDoctor: doctorId,
      date: { $gte: startOfYesterday, $lte: endOfYesterday },
    });

    // Calculate percentage change for appointments and patients
    const yesterdayAppointmentsCount = yesterdayAppointments.length;
    const todayAppointmentsCount = todayAppointments.length;
    const appointmentsChange =
      yesterdayAppointmentsCount === 0
        ? todayAppointmentsCount * 100
        : ((todayAppointmentsCount - yesterdayAppointmentsCount) /
            yesterdayAppointmentsCount) *
          100;

    const yesterdayPatients = [
      ...new Set(yesterdayAppointments.map((a) => a.patientId)),
    ];
    const patientsChange =
      yesterdayPatients.length === 0
        ? todayPatients.length * 100
        : ((todayPatients.length - yesterdayPatients.length) /
            yesterdayPatients.length) *
          100;

    // Construct response data
    const responseData = {
      lastUpcomingAppointment,
      totalPatients: allPatients.length,
      todayAppointments: todayAppointmentsCount,
      todayPatients: todayPatients.length,
      percentageChange: {
        appointments: appointmentsChange.toFixed(2),
        patients: patientsChange.toFixed(2),
      },
    };

    return sendResponse(
      res,
      200,
      "Dashboard data fetched successfully.",
      responseData
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getAllPatientAppointment = async (req, res) => {
  try {
    if (!req.params?.doctorId) {
      return sendResponse(res, 400, "Doctor id is required!");
    }

    let { status, time } = req.query;
    let queryParam = { refDoctor: req.params?.doctorId };

    if (status) {
      queryParam.status = status;
    }

    if (time) {
      const now = new Date();
      if (time === "today") {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        queryParam.date = { $gte: startOfDay, $lte: endOfDay };
      } else if (time === "week") {
        const startOfWeek = new Date(now.setDate(now.getDate() - 7));
        queryParam.date = { $gte: startOfWeek, $lte: now };
      } else if (time === "month") {
        const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));
        queryParam.date = { $gte: startOfMonth, $lte: now };
      }
    }

    const Appointments = await PatientAppointment.find(queryParam)
      .populate("patientId")
      .exec();

    return sendResponse(
      res,
      200,
      "Doctor's appointments fetched successfully.",
      Appointments
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getAllPatientsWithAppointmentDetails = async (req, res) => {
  try {
    const doctorId = req.params?.doctorId;

    if (!doctorId) {
      return sendResponse(res, 400, "Doctor ID is required!");
    }

    // Fetch all unique patients for the doctor
    const patients = await PatientAppointment.aggregate([
      { $match: { refDoctor:new mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: "$patientId",
          patientName: { $first: "$appointmentPersonName" },
        },
      },
    ]);

    const patientDetails = await Promise.all(
      patients.map(async (patient) => {
        const lastCompletedAppointment = await PatientAppointment.findOne({
          refDoctor: doctorId,
          patientId: patient._id,
          status: "Completed",
        })
          .sort({ date: -1 })
          .select("date time reason comments appointmentType");

        const upcomingAppointment = await PatientAppointment.findOne({
          refDoctor: doctorId,
          patientId: patient._id,
          status: "Pending",
        })
          .sort({ date: 1 })
          .select("date time reason comments appointmentType");

        return {
          patientId: patient._id,
          patientName: patient.patientName,
          lastCompletedAppointment,
          upcomingAppointment,
        };
      })
    );

    return sendResponse(
      res,
      200,
      "Patient details fetched successfully.",
      patientDetails
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getDoctorClinic = async (req, res) => {
  try {
    if (!req.params?.doctorId) {
      return sendResponse(res, 400, "Doctor id is required!");
    }

    let queryParam = { doctorId: req.params?.doctorId };

    const doctorClinic = await DoctorClinic.find(queryParam)
      .populate("doctorId")
      .exec();

    return sendResponse(
      res,
      200,
      "Doctor clinic details fetched successfully.",
      doctorClinic
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
module.exports = {
  updateProfile,
  getAllDoctors,
  getAllPatientAppointment,
  getDoctorDashboardData,
  getDoctorClinic,
  getAllPatientsWithAppointmentDetails,
};
