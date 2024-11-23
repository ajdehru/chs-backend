const Subscription = require("../../models/subscription");
const { sendResponse } = require("../../utils");

const getPlans = async (req, res) => {
  try {
    const { userRole } = req.query;
    let query = {};

    if (userRole === "client") {
      query = { name: { $in: ["Regular_Client", "Elite_Client"] } };
    } else if (userRole === "model") {
      query = { name: { $in: ["Gent", "Elite_Gent"] } };
    }

    const plans = await Subscription.find(query);

    if (plans.length === 0) {
      return sendResponse(res, 404, "No plans found for the specified role");
    }

    return sendResponse(res, 200, "Plans retrieved successfully", plans);
  } catch (error) {
    console.error("Error in getPlans:", error);
    return sendResponse(res, 500, "An error occurred while fetching plans");
  }
};

module.exports = {
  getPlans,
};
