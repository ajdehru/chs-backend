const Model = require("../models/profile");
const ModelDocument = require("../models/modelDocument");
const ModelContent = require("../models/content");
const SocialMedia = require("../models/social");
const TravelDates = require("../models/travelDates");
const User = require("../models/user");
const { sendResponse } = require("../utils");

async function getModels(req, res) {
  try {
    const users = await User.find()
      .populate("role")
      .populate("model")
      .populate("client")
      .populate("subscription")
      .populate("coverImage")
      .populate("plusImage")
      .exec();

    let data = users?.filter(
      (user) =>
        user?.role?.role === "model" &&
        user.subscription !== null &&
        user.model !== null &&
        user.status?.toLowerCase() == "active"
    );

    if (req?.query) {
      data = await handleFilter(req?.query, data, res);
    }

    let arrengedData = rearrangeModels(data);

    return sendResponse(res, 200, "All models fetched!", arrengedData);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

function rearrangeModels(data) {
  const order = ["Exclusive_Elite_Gent", "Elite_Gent", "Gent"];

  const sortedData = data.sort((a, b) => {
    const aType = a.subscription?.subscriptionType || "";
    const bType = b.subscription?.subscriptionType || "";
    return order.indexOf(aType) - order.indexOf(bType);
  });

  return sortedData;
}

async function handleFilter(query, data, res) {
  try {
    let filteredData = data;

    filteredData = data.filter((model) => {
      const stats = model.model.stats;
      
      if (
        query.age &&
        (stats.age < query?.age?.split(",")[0] ||
          stats.age > query?.age?.split(",")[1])
      )
        return false;
      if (
        query.height &&
        query.heightType != stats.heightType &&
        (stats.height < query?.height?.split(",")[0] ||
          stats.height > query?.height?.split(",")[1])
      )
        return false;
      if (
        query.weight &&
        query.weightType != stats.weightType &&
        (stats.weight < query?.weight?.split(",")[0] ||
          stats.weight > query?.weight?.split(",")[1])
      )
        return false;
      if (
        query.cockSize &&
        query.cockSizeType != stats.cockSizeType &&
        (stats.cockSize < query?.cockSize?.split(",")[0] ||
          stats.cockSize > query?.cockSize?.split(",")[1])
      )
        return false;

      if (query.smoking && stats.smoking !== query.smoking) return false;
      if (query.drinking && stats.drinking !== query.drinking) return false;
      if (query.foreskin && stats.foreskin !== query.foreskin) return false;
      if (query.tattoos && stats.tattoos !== query.tattoos) return false;
      if (query.condomsOnly && stats.condomsOnly !== query.condomsOnly)
        return false;
      if (query.hivStatus && stats.hivStatus !== query.hivStatus) return false;
      if (query.bodyType && stats.bodyType !== query.bodyType) return false;
      if (query.eyeColor && stats.eyeColor !== query.eyeColor) return false;
      if (query.bodyHair && stats.bodyHair !== query.bodyHair) return false;
      if (query.hairColor && stats.hairColor !== query.hairColor) return false;
      if (query.sexualRole && stats.sexualRole !== query.sexualRole)
        return false;
      if (query.orientation && stats.orientation !== query.orientation)
        return false;

      if (query.language) {
        const languages = query.language.split(",").map((lang) => lang.trim());
        if (!languages.some((lang) => stats.spokenLanguages.includes(lang))) {
          return false;
        }
      }
      if (query.hobbies) {
        const allhobbies = query.hobbies.split(",").map((lang) => lang.trim());
        if (!allhobbies.some((lang) => stats.hobbies.includes(lang))) {
          return false;
        }
      }

      if (query.piercings) {
        const allpiercings = query.piercings
          .split(",")
          .map((lang) => lang.trim());
        if (!allpiercings.some((lang) => stats.piercings.includes(lang))) {
          return false;
        }
      }
      if (query.tribe) {
        const alltribe = query.tribe.split(",").map((lang) => lang.trim());
        if (!alltribe.some((lang) => stats.tribe.includes(lang))) {
          return false;
        }
      }
      if (query.amInto) {
        const allamInto = query.amInto.split(",").map((lang) => lang.trim());
        if (!allamInto.some((lang) => stats.amInto.includes(lang))) {
          return false;
        }
      }

      return true;
    });

    if (query?.city || query.startDate || query.endDate) {
      filteredData = await handleSearch(query, filteredData, res);
    }
    return filteredData;
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function handleSearch(query, data, res) {
  try {
    const searchedData = [];

    for (const model of data) {
      const location = model.model.location;

      const modelTvlDates = await TravelDates.find({
        modelId: model.model._id,
      });

      if (!modelTvlDates || modelTvlDates.length === 0) {
        if (
          query.city &&
          location.city.toLowerCase() !== query.city.toLowerCase()
        ) {
          continue;
        }

        searchedData.push(model);
      } else {
        const matches = modelTvlDates.some((modelTvlDate) => {
          if (
            query.city &&
            modelTvlDate.location.city.toLowerCase() !==
              query.city.toLowerCase()
          ) {
            return false;
          }
          if (query.startDate && query.endDate) {
            const queryStartDate = new Date(query.startDate).getTime();
            const queryEndDate = new Date(query.endDate).getTime();
            const travelStartDate = new Date(modelTvlDate.startDate).getTime();
            const travelEndDate = new Date(modelTvlDate.endDate).getTime();

            if (
              travelStartDate > queryStartDate ||
              travelEndDate < queryEndDate
            ) {
              return false;
            }
          } else if (query.startDate) {
            const queryStartDate = new Date(query.startDate).getTime();
            const travelStartDate = new Date(modelTvlDate.startDate).getTime();
            if (travelStartDate > queryStartDate) {
              return false;
            }
          } else if (query.endDate) {
            const queryEndDate = new Date(query.endDate).getTime();
            const travelEndDate = new Date(modelTvlDate.endDate).getTime();

            if (travelEndDate < queryEndDate) {
              return false;
            }
          }
          return true;
        });

        if (matches) {
          searchedData.push(model);
        }
      }
    }

    return searchedData;
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getModelById(req, res) {
  try {
    const model = await User.findById(req.params.userId)
      .populate("role")
      .populate({
        path: "model",
        populate: {
          path: "social_media",
        },
      })
      .populate("coverImage")
      .populate("plusImage")
      .exec();

    if (
      !model
      // || model.model.verification_status !== "Verified"
    ) {
      return sendResponse(res, 404, "Model not found");
    }
    return sendResponse(res, 200, "Model fetched", model);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function createModelProfile(req, res) {
  try {
    const model = new Model(req.body);
    await model.save();

    if (req.body.userId) {
      await User.findByIdAndUpdate(
        req.body.userId,
        { model: model._id },
        { new: true }
      );
    }

    return sendResponse(res, 201, "Profile Created", model);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function updateModelProfile(req, res) {
  try {
    const { stats } = req.body;

    if (stats?.cockSize) {
      stats.cockStatus = "Pending";
    }

    const model = await Model.findById(req.params.id);
    if (!model) {
      return sendResponse(res, 404, "Model not found");
    }

    let preStats = { ...model.stats.toObject() };
    if (stats) {
      Object.keys(stats).forEach((key) => {
        preStats[key] = stats[key];
      });
    }

    const updatedData = { ...req.body, stats: preStats };

    const updatedModel = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData },
      { new: true }
    );

    return sendResponse(res, 200, "Profile Updated", updatedModel);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}
async function uploadVerificationDocument(req, res) {
  try {
    const { file } = req;
    if (!file) {
      return sendResponse(res, 400, "Documents not Uploaded!");
    }

    const { id: userId } = req.params;
    const { modelId, type: verificationType, status } = req.query;

    const fileData = {
      userId,
      modelId: modelId || null,
      verificationType,
      documentKey: file.key,
      documentURL: file.location,
      status: status || "Requested",
    };

    const modelDoc = await ModelDocument.findOneAndUpdate(
      {
        userId,
        verificationType,
      },
      {
        $set: fileData,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    const user = await User.findById(userId);

    if (user) {
      const model = await Model.findById(user.model);

      if (model) {
        if (verificationType === "Size") {
          model.stats.cockStatus = status || "Requested";
        } else if (
          verificationType === "Selfie" ||
          verificationType === "Identity"
        ) {
          model.verification_status = status || "Requested";
        }

        await model.save();
      }
    }
    return sendResponse(res, 200, "Documents Uploaded", modelDoc);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function uploadPhoto(req, res) {
  try {
    const { files } = req;

    if (!files || files?.length === 0) {
      return sendResponse(res, 400, "No files uploaded");
    }
    let { modelId, userId, isPublic, type } = req?.query;

    const uploadPromises = files.map(async (file) => {
      console.log(file, "file");
      const modelFile = new ModelContent({
        userId: userId || null,
        modelId: modelId || null,
        contentType: type,
        key: file.key,
        url: file.location,
        isPublic: isPublic || false,
      });
      await modelFile.save();
      return {
        key: file.key,
        fileUrl: file.location,
        _id: modelFile._id,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    return sendResponse(res, 201, "Files Uploaded Successfully", uploadedFiles);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function createTravelDate(req, res) {
  try {
    const modelTvl = new TravelDates(req.body);
    await modelTvl.save();

    return sendResponse(res, 201, "Travel Date Created", modelTvl);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function updateTravelDate(req, res) {
  try {
    const tvlDate = await TravelDates.findById(req.params.id);
    if (!tvlDate) {
      return sendResponse(res, 404, "Travel Date not found");
    }
    const { location, startDate, endDate } = req.body;

    const updatedLocation = {
      city: location?.city || tvlDate.location.city,
      country: location?.country || tvlDate.location.country,
    };

    const update = {
      ...req.body,
      location: updatedLocation,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };

    const updatedDate = await TravelDates.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    return sendResponse(res, 200, "Travel Date Updated", updatedDate);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function deleteTravelDate(req, res) {
  try {
    const deletedDate = await TravelDates.findByIdAndDelete(req.params.id);

    if (!deletedDate) {
      return sendResponse(res, 404, "Travel Date not found");
    }

    return sendResponse(res, 200, "Travel Date deleted successfully!");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getTravelDatesByModelId(req, res) {
  try {
    const modelTvlDate = await TravelDates.find({ modelId: req.params.id });
    if (!modelTvlDate || modelTvlDate.length === 0) {
      return sendResponse(res, 404, "No Travel Date found");
    }
    return sendResponse(
      res,
      200,
      "Travel Date getting successfully",
      modelTvlDate
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function addModelSocialLink(req, res) {
  try {
    const { modelId, socialMediaAccounts } = req.body;

    let modelSocial = await SocialMedia.findOne({ modelId });

    if (modelSocial) {
      if (socialMediaAccounts) {
        for (const [key, value] of Object.entries(socialMediaAccounts)) {
          modelSocial.socialMediaAccounts.set(key, value);
        }
      }

      modelSocial.updatedAt = Date.now();
      await modelSocial.save();

      return sendResponse(
        res,
        200,
        "Social media profile updated",
        modelSocial
      );
    } else {
      modelSocial = new SocialMedia({
        modelId,
        socialMediaAccounts,
      });

      await modelSocial.save();

      if (req.body.modelId) {
        await Model.findByIdAndUpdate(
          req.body.modelId,
          { social_media: modelSocial._id },
          { new: true }
        );
      }

      return sendResponse(
        res,
        201,
        "Social media profile created",
        modelSocial
      );
    }
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

module.exports = {
  getModels,
  getModelById,
  createModelProfile,
  updateModelProfile,
  uploadVerificationDocument,
  createTravelDate,
  updateTravelDate,
  deleteTravelDate,
  getTravelDatesByModelId,
  addModelSocialLink,
  uploadPhoto,
};
