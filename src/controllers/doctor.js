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
const patientProfile = require("../models/patientProfile");

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
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const endOfToday = new Date(now.setHours(23, 59, 59, 999));

    // Query for today's appointments
    const todayAppointments = await PatientAppointment.find({
      refDoctor: doctorId,
      date: { $gte: startOfToday, $lte: endOfToday },
    }).populate("patientId");

    // Query for all unique patients
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
      startOfToday.setDate(startOfToday.getDate() - 1)
    );
    const endOfYesterday = new Date(
      endOfToday.setDate(endOfToday.getDate() - 1)
    );

    const yesterdayAppointments = await PatientAppointment.find({
      refDoctor: doctorId,
      date: { $gte: startOfYesterday, $lte: endOfYesterday },
    });

    // Calculate percentage change for today's appointments and patients
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

    // Query for total patients change compared to last week
    const startOfLastWeek = new Date(
      now.setDate(now.getDate() - now.getDay() - 6)
    ); // Start of last week
    const endOfLastWeek = new Date(now.setDate(startOfLastWeek.getDate() + 6)); // End of last week

    const lastWeekPatients = await PatientAppointment.find({
      refDoctor: doctorId,
      date: { $gte: startOfLastWeek, $lte: endOfLastWeek },
    }).distinct("patientId");

    const lastWeekPatientsCount = lastWeekPatients.length;
    const totalPatientsChange =
      lastWeekPatientsCount === 0
        ? 0
        : ((allPatients.length - lastWeekPatientsCount) /
            lastWeekPatientsCount) *
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
        totalPatients: totalPatientsChange.toFixed(2),
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

    let { status, time, startDate, endDate } = req.query;
    let queryParam = { refDoctor: req.params?.doctorId };

    if (status) {
      queryParam.status = status;
    }

    if (time) {
      const now = new Date();
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      const endOfToday = new Date(now.setHours(23, 59, 59, 999));

      if (time === "today") {
        queryParam.date = { $gte: startOfToday, $lte: endOfToday };
      } else if (time === "week") {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 6));
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        queryParam.date = { $gte: sevenDaysAgo, $lte: endOfToday };
      } else if (time === "month") {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 29));
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        queryParam.date = { $gte: thirtyDaysAgo, $lte: endOfToday };
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      queryParam.date = { $gte: start, $lte: end };
    }

    let Appointments = await PatientAppointment.find(queryParam)
      .populate("patientId")
      .exec();

    if (Appointments && Appointments?.length > 0) {
      Appointments = await getWithProfileImg(Appointments);
    }

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

const getWithProfileImg = async (appointments) => {
  try {
    const newAppointments = await Promise.all(
      appointments.map(async (it) => {
        const user = await User.findOne({ profile: it?.patientId?._id }); // Use `_id` from populated patientId
        return {
          ...it._doc,
          patientId: {
            ...it?.patientId._doc,
            coverImage: user?.coverImage || null,
          },
        };
      })
    );

    return newAppointments;
  } catch (error) {
    console.error("Error fetching user with profile:", error);
    throw new Error("Failed to fetch user with profile.");
  }
};

const getAllPatientsWithAppointmentDetails = async (req, res) => {
  try {
    const doctorId = req.params?.doctorId;

    if (!doctorId) {
      return sendResponse(res, 400, "Doctor ID is required!");
    }

    // Step 1: Fetch all unique patient IDs for the doctor
    const patients = await PatientAppointment.aggregate([
      { $match: { refDoctor: new mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: "$patientId",
        },
      },
    ]);

    // Step 2: Fetch appointment details for each patient
    const patientDetails = await Promise.all(
      patients.map(async (patient) => {
        const lastCompletedAppointment = await PatientAppointment.findOne({
          refDoctor: doctorId,
          patientId: patient._id,
          status: { $in: ["Completed", "Cancelled"] }, // Use $in for multiple conditions
        })
          .sort({ date: -1 }) // Latest first
          .select("date time reason comments appointmentType");

        const upcomingAppointment = await PatientAppointment.findOne({
          refDoctor: doctorId,
          patientId: patient._id,
          status: { $in: ["Accepted", "Pending"] }, // Use $in for multiple conditions
        })
          .sort({ date: 1 }) // Earliest first
          .select("date time reason comments appointmentType");

        const patientData = await patientProfile.findOne({ _id: patient._id });

        return {
          patientId: patientData || null,
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
    console.error("Error in getAllPatientsWithAppointmentDetails:", error);
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

const getAppointmentsCountForAllStatuses = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return sendResponse(res, 400, "Doctor ID is required!");
    }

    const objectIdDoctorId = new mongoose.Types.ObjectId(doctorId);

    const counts = await PatientAppointment.aggregate([
      { $match: { refDoctor: objectIdDoctorId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log(counts, "AppointmentsCount");

    const result = counts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    return sendResponse(
      res,
      200,
      "Doctor's appointment counts fetched successfully.",
      result
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
  getAppointmentsCountForAllStatuses,
};
