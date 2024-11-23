const { deleteS3File } = require("../configs/s3");
const Content = require("../models/content");

const ModelFiles = require("../models/modelFiles");
const User = require("../models/user");
const { sendResponse, capitalizeFirstLetter } = require("../utils");

async function uploadContent(req, res) {
  try {
    const { modelId } = req.params;
    const { contentType, isPublic } = req.body;
    const { file } = req;

    if (!file) return sendResponse(res, 400, "No file uploaded.");

    const newContent = new Content({
      modelId,
      contentType,
      key: file.key,
      url: file.location,
      isPublic: isPublic || false,
    });

    await newContent.save();
    return sendResponse(res, 201, "Content uploaded successfully.", newContent);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function deleteContent(req, res) {
  try {
    const { contentId } = req.params;

    const contentData = await Content.findById(contentId);
    if (!contentData) {
      return sendResponse(res, 404, "Content detail not found!");
    }

    await deleteS3File(contentData.key);

    await Content.findByIdAndDelete(contentId);

    await User.updateMany(
      { coverImage: contentId },
      { $set: { coverImage: null } },
      { new: true }
    );

    await User.updateMany(
      { plusImage: contentId },
      { $set: { plusImage: null } },
      { new: true }
    );

    return sendResponse(res, 200, "Content deleted successfully.");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function updateContent(req, res) {
  try {
    const { contentId } = req.params;
    let {
      isPublic,
      reason,
      verified,
      makeCoverPhoto,
      make18Photo,
      userId,
      access,
    } = req.body;
    const updateFields = {};
    if (typeof isPublic !== "undefined") {
      updateFields.isPublic = isPublic;
      const content = await Content.findById(contentId);
      if (!isPublic) {
        makeCoverPhoto = false;
        make18Photo = false;
        updateFields.access = ["EC"];
        updateFields.preAccess = content?.access || [];
      } else {
        updateFields.access = content?.preAccess || [];
      }
    }
    if (typeof verified !== "undefined") {
      updateFields.verified = verified;
      if (verified) {
        updateFields.reason = null;
      }
    }
    if (typeof reason !== "undefined") {
      updateFields.reason = reason;
    }
    if (typeof access !== "undefined") {
      const content = await Content.findById(contentId);
      let isAccess = content?.access || [];
      console.log(isAccess, "content");

      if (typeof access?.NC !== "undefined") {
        if (access?.NC) {
          isAccess = ["NC", "RC", "EC"];
          updateFields.isPublic = true;
        } else if (!access?.NC) {
          isAccess = ["RC", "EC"];
          makeCoverPhoto = false;
          updateFields.isPublic = true;
        }
      }
      if (typeof access?.RC !== "undefined") {
        if (access?.RC) {
          isAccess = ["RC", "EC"];
          makeCoverPhoto = false;
          updateFields.isPublic = true;
        } else if (!access?.RC) {
          updateFields.preAccess = isAccess;
          isAccess = ["EC"];
          makeCoverPhoto = false;
          make18Photo = false;
          updateFields.isPublic = false;
        }
      }
      if (typeof access?.EC !== "undefined") {
        if (access?.EC) {
          updateFields.preAccess = isAccess;
          isAccess = ["EC"];
          makeCoverPhoto = false;
          make18Photo = false;
          updateFields.isPublic = false;
        } else if (!access?.EC) {
          isAccess = [];
        }
      }
      updateFields.access = isAccess;
    }

    if (
      typeof makeCoverPhoto !== "undefined" ||
      typeof make18Photo !== "undefined"
    ) {
      // if (makeCoverPhoto) {
      if (makeCoverPhoto === true) {
        await Content.updateMany(
          {
            userId: userId,
            _id: { $ne: contentId },
            makeCover: true,
          },
          {
            makeCover: false,
          }
        );
      }
      if (make18Photo === true) {
        await Content.updateMany(
          {
            userId: userId,
            _id: { $ne: contentId },
            makePlus: make18Photo,
          },
          {
            makePlus: false,
          }
        );
      }

      const updatedFile = await Content.findByIdAndUpdate(
        contentId,
        { makeCover: makeCoverPhoto, makePlus: make18Photo },
        { new: true }
      );

      const userDetails = await User.findById(userId);

      const updates = {};

      if (makeCoverPhoto) {
        updates.coverImage = updatedFile?._id;
      } else if (updatedFile?._id.equals(userDetails?.coverImage)) {
        updates.coverImage = null;
      }

      if (make18Photo) {
        updates.plusImage = updatedFile?._id;
      } else if (updatedFile?._id.equals(userDetails?.plusImage)) {
        updates.plusImage = null;
      }

      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(userId, updates, { new: true });
      }
    }

    const content = await Content.findByIdAndUpdate(contentId, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!content) {
      return sendResponse(res, 404, "Content not found.");
    }

    return sendResponse(res, 200, "Content status updated.", content);
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
    let { status } = req.body;

    modelId = modelId === "null" ? null : modelId;
    userId = userId === "null" ? null : userId;

    if (status) {
      if (!Array.isArray(status)) {
        status = [status];
      }
      isPublic = status?.map((val) => val === "true");
      console.log(isPublic, "status");
    }

    const uploadPromises = files.map(async (file, index) => {
      const modelFile = new Content({
        userId: userId || null,
        modelId: modelId || null,
        contentType: capitalizeFirstLetter(type),
        key: file.key,
        url: file.location,
        isPublic: isPublic[index] || false,
      });
      await modelFile.save();
      return modelFile;
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    return sendResponse(res, 201, "Files Uploaded Successfully", uploadedFiles);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function verifyContent(req, res) {
  try {
    const { contentId } = req.params;
    const { file } = req;

    if (!contentId) return sendResponse(res, 400, "Content ID is required.");
    if (!file) return sendResponse(res, 400, "No file uploaded.");

    if (file.location) {
      const updatedContent = await Content.findByIdAndUpdate(
        contentId,
        { docUrl: file.location, verified: "Requested" },
        { new: true }
      );

      if (!updatedContent) {
        return sendResponse(res, 404, "Content not found.");
      }

      return sendResponse(
        res,
        200,
        "Content verification uploaded successfully.",
        updatedContent
      );
    }

    return sendResponse(res, 400, "File upload failed.");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getModelVerifiedContent(req, res) {
  try {
    const { userId } = req.params;

    const content = await Content.find({ userId: userId, verified: "Approved" })
      .sort({ createdAt: -1 })
      .exec();

    return sendResponse(
      res,
      200,
      "Model content retrieved successfully.",
      content
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getModelContent(req, res) {
  try {
    const { userId } = req.params;

    const content = await Content.find({ userId: userId })
      .sort({ createdAt: -1 })
      .exec();

    return sendResponse(
      res,
      200,
      "Model content retrieved successfully.",
      content
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

module.exports = {
  uploadPhoto,
  uploadContent,
  deleteContent,
  verifyContent,
  updateContent,
  getModelContent,
  getModelVerifiedContent,
};
