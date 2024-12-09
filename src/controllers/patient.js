const patientProfile = require("../models/patientProfile");
const User = require("../models/user");
const {
  sendResponse,
  handleingError,
  capitalizeFirstLetter,
} = require("../utils");
const bcrypt = require("bcrypt");
const { calculateAge } = require("../utils/helpers/patient");
const PatientAppointment = require("../models/userAppointment");
const PatientReports = require("../models/userReports");
const PatientPrescription = require("../models/userPrescription");
const symptomReport = require("../models/symptomReport");

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params?.userId);
    const profileId = user?.profile;
    if (!profileId) {
      return sendResponse(res, 400, "Profile id is required");
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
      // phoneNumber,
      email,
      bloodGroup,
      address,
      city,
      state,
      country,
      pinCode,
      gender,
    } = req.body;

    if (gender) updateFields.gender = capitalizeFirstLetter(gender);
    if (lastName) updateFields.lastName = lastName;
    if (bloodGroup) updateFields.bloodGroup = bloodGroup;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (country) updateFields.country = country;
    if (pinCode) updateFields.pinCode = pinCode;
    if (birthDate) {
      updateFields.birthDate = birthDate;

      let isAge = calculateAge(birthDate);
      updateFields.age = `${isAge?.years} years ${isAge?.months} months`;
    }

    // if (phoneNumber) {
    //   updateFields.phoneNumber = phoneNumber;
    //   updateUserFields.phoneNumber = phoneNumber;
    // }
    if (firstName) {
      updateFields.firstName = capitalizeFirstLetter(firstName);
      updateUserFields.name = capitalizeFirstLetter(firstName);
    }
    if (address) {
      updateFields.address = address;
      updateUserFields.address = address;
    }
    if (email) {
      updateFields.email = email?.toLowerCase();
      updateUserFields.email = email?.toLowerCase();
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

const createAppointment = async (req, res) => {
  try {
    if (!req.params?.patientId) {
      return sendResponse(res, 400, "Patient id is required!");
    }
    const {
      name,
      date,
      time,
      refDoctor,
      amount,
      reason,
      comments,
      status,
      appointmentFor,
      appointmentPersonName,
      isInsurance,
      symptoms,
      appointmentType,
    } = req.body;

    if (!refDoctor) {
      return sendResponse(res, 400, "Reference doctor is required!");
    }

    const newAppointment = new PatientAppointment({
      ...req.body,
      appointmentFor: appointmentFor
        ? capitalizeFirstLetter(appointmentFor)
        : "Self",
      appointmentPersonName: capitalizeFirstLetter(appointmentPersonName),
      appointmentType: appointmentType
        ? capitalizeFirstLetter(appointmentType)
        : "Consult",
      patientId: req.params?.patientId,
    });
    await newAppointment.save();

    return sendResponse(
      res,
      201,
      "New appointment is created successful.",
      newAppointment?.toObject()
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const addAppointmentAttachment = async (req, res) => {
  try {
    if (!req.params?.appoitmentId) {
      return sendResponse(res, 400, "Appoitment id is required!");
    }
    const { file } = req;

    let attched = null;
    if (file) {
      attched = file.location;
    }
    const newAppointment = await PatientAppointment.findByIdAndUpdate(
      req.params?.appoitmentId,
      {
        attachment: attched,
      }
    );

    return sendResponse(res, 201, "Attchedment added.", newAppointment);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getAppointments = async (req, res) => {
  try {
    if (!req.params?.patientId) {
      return sendResponse(res, 400, "Patient id is required!");
    }

    const Appointments = await PatientAppointment.find({
      userId: req.params?.userId,
    })
      .populate("refDoctor")
      .populate("patientId")
      .exec();

    return sendResponse(
      res,
      201,
      "All appointments  is getting successful.",
      Appointments
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getAppointmentById = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Appointment id is required!");
    }

    const Appointment = await PatientAppointment.findById(req.params?.id)
      .populate("refDoctor")
      .populate("patientId")
      .exec();

    return sendResponse(
      res,
      201,
      "Appointment is getting successful.",
      Appointment
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const updateAppointmentById = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Appointment id is required!");
    }

    const Appointment = await PatientAppointment.findByIdAndUpdate(
      req.params?.id,
      { ...req.body }
    );

    return sendResponse(
      res,
      201,
      "Appointment updated successfully.",
      Appointment
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Appointment id is required!");
    }

    const Appointment = await PatientAppointment.findByIdAndUpdate(
      req.params?.id,
      { status: req.body?.status }
    );

    return sendResponse(
      res,
      201,
      "Appointment status is updated successful.",
      Appointment
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const createReport = async (req, res) => {
  try {
    if (!req.params?.patientId) {
      return sendResponse(res, 400, "PatientId id is required!");
    }
    const { name, date, description } = req.body;

    if (!name || !description) {
      return sendResponse(
        res,
        400,
        "Report name and description are required!"
      );
    }

    const newReport = new PatientReports({
      ...req.body,
      patientId: req.params?.patientId,
    });

    await newReport.save();

    return sendResponse(res, 201, "Report is added successful.", newReport);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getReports = async (req, res) => {
  try {
    if (!req.params?.patientId) {
      return sendResponse(res, 400, "Patient id is required!");
    }

    const reports = await PatientReports.find({
      patientId: req.params?.patientId,
    })
      .populate("patientId")
      .exec();

    return sendResponse(
      res,
      201,
      "All reports are getting successful.",
      reports
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getReportById = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Report id is required!");
    }

    const report = await PatientReports.findById(req.params?.id)
      .populate("patientId")
      .exec();

    return sendResponse(res, 201, "Report is getting successful.", report);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const updateReportById = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Report id is required!");
    }

    const Report = await PatientReports.findByIdAndUpdate(req.params?.id, {
      ...req.body,
    });

    return sendResponse(res, 201, "Report is updated successful.", Report);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const addReportAttachment = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Report id is required!");
    }
    const { file } = req;

    let attched = null;
    if (file) {
      attched = file.location;
    }
    const report = await PatientReports.findByIdAndUpdate(req.params?.id, {
      attachment: attched,
    });

    return sendResponse(res, 201, "Attchedment added.", report);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const deleteReport = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Report id is required!");
    }

    const report = await PatientReports.findByIdAndDelete(req.params?.id);

    return sendResponse(res, 201, "Report is deleted.", report);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const createPrescription = async (req, res) => {
  try {
    if (!req.params?.patientId) {
      return sendResponse(res, 400, "PatientId id is required!");
    }
    const { name, date, refDoctor } = req.body;

    if (!name || !refDoctor) {
      return sendResponse(
        res,
        400,
        "Prescription name and doctor are required!"
      );
    }

    const newPrescription = new PatientPrescription({
      ...req.body,
      patientId: req.params?.patientId,
    });

    await newPrescription.save();

    return sendResponse(
      res,
      201,
      "New prescription is created successful.",
      newPrescription
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const addPrescriptionAttachment = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Prescription id is required!");
    }
    const { file } = req;

    let attched = null;
    if (file) {
      attched = file.location;
    }
    const report = await PatientPrescription.findByIdAndUpdate(req.params?.id, {
      attachment: attched,
    });

    return sendResponse(res, 201, "Prescription attchedment added.", report);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getPrescriptions = async (req, res) => {
  try {
    if (!req.params?.patientId) {
      return sendResponse(res, 400, "Patient id is required!");
    }

    const prescription = await PatientPrescription.find({
      patientId: req.params?.patientId,
    })
      .populate("patientId")
      .populate("refDoctor")
      .exec();

    return sendResponse(
      res,
      201,
      "Prescriptions is getting successful.",
      prescription
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getPrescriptionById = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Prescription id is required!");
    }

    const prescription = await PatientPrescription.findById(req.params?.id)
      .populate("patientId")
      .populate("refDoctor")
      .exec();

    return sendResponse(
      res,
      201,
      "Prescription is getting successful.",
      prescription
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const deletePrescription = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Prescription id is required!");
    }

    const prescription = await PatientPrescription.findByIdAndDelete(
      req.params?.id
    );

    return sendResponse(res, 201, "Prescription is deleted.", prescription);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const saveSymptomReport = async (req, res) => {
  try {
    if (!req.params?.patientId) {
      return sendResponse(res, 400, "PatientId id is required!");
    }

    const newReport = new symptomReport({
      ...req.body,
      patientId: req.params?.patientId,
    });

    await newReport.save();

    return sendResponse(
      res,
      201,
      "New symptom report is created successful.",
      newReport
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const getSymptomReports = async (req, res) => {
  try {
    if (!req.params?.patientId) {
      return sendResponse(res, 400, "PatientId id is required!");
    }

    const allReports = await symptomReport.find({
      patientId: req.params?.patientId,
    });

    return sendResponse(
      res,
      200,
      "All symptom reports is fetched successful.",
      allReports
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

const deleteSymptomReport = async (req, res) => {
  try {
    if (!req.params?.id) {
      return sendResponse(res, 400, "Report ID is required!");
    }

    const deletedReport = await symptomReport.findByIdAndDelete(req.params.id);
    if (!deletedReport) {
      return sendResponse(res, 404, "Symptom report not found!");
    }

    return sendResponse(res, 200, "Symptom report deleted successfully.");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

module.exports = {
  updateProfile,
  createAppointment,
  addAppointmentAttachment,
  getAppointments,
  getAppointmentById,
  updateAppointmentById,
  updateAppointmentStatus,
  createReport,
  getReports,
  getReportById,
  updateReportById,
  deleteReport,
  addReportAttachment,
  createPrescription,
  addPrescriptionAttachment,
  getPrescriptions,
  getPrescriptionById,
  deletePrescription,
  saveSymptomReport,
  getSymptomReports,
  deleteSymptomReport,
};
