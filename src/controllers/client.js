const { deleteS3File } = require("../configs/s3");
const Client = require("../models/client");
const ClientFile = require("../models/clientFile");
const User = require("../models/user");
const { sendResponse } = require("../utils");

async function createClient(req, res) {
  try {
    const client = new Client(req.body);
    await client.save();

    if (req.body.userId) {
      await User.findByIdAndUpdate(
        req.body.userId,
        { client: client._id },
        { new: true }
      );
    }

    return sendResponse(res, 201, "Profile Created", client);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getClientById(req, res) {
  try {
    const client = await User.findById(req.params.userId)
      .populate("role")
      .populate("client")
      .exec();

    if (!client) {
      return sendResponse(res, 404, "Client not found");
    }

    if (client?.plusImage) {
      const file = await ClientFile.findOne({ _id: client.plusImage });
      if (file) {
        const clientData = { ...client.toObject(), plusImage: file };
        return sendResponse(res, 200, "Client fetched", clientData);
      }
    }

    return sendResponse(res, 200, "Client fetched", client);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getClientPhotos(req, res) {
  try {
    const clientFiles = await ClientFile.find({ userId: req.params.id });

    if (!clientFiles || clientFiles.length === 0) {
      return sendResponse(res, 200, "No files found for this client");
    }

    return sendResponse(
      res,
      200,
      "Client files retrieved successfully",
      clientFiles
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function updateClient(req, res) {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClient) {
      return sendResponse(res, 404, "Client not found");
    }
    return sendResponse(res, 200, "Client updated", updatedClient);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}
async function uploadClientPhoto(req, res) {
  try {
    const { files } = req;

    if (!files || files?.length === 0) {
      return sendResponse(res, 400, "No files uploaded");
    }

    const uploadPromises = files.map(async (file) => {
      const clientFile = new ClientFile({
        userId: req.params.userId,
        clientId: req.params.id || null,
        key: file.key,
        fileUrl: file.location,
      });
      await clientFile.save();
      return {
        key: file.key,
        fileUrl: file.location,
        _id: clientFile._id,
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    return sendResponse(res, 201, "Files Uploaded Successfully", uploadedFiles);
  } catch (error) {
    console.error("Error in uploadClientPhoto:", error);
    return sendResponse(
      res,
      500,
      "An error occurred while uploading the files",
      { error: error.message }
    );
  }
}

async function updateClientPhoto(req, res) {
  try {
    const fileId = req.params.id;
    if (!fileId) {
      return sendResponse(res, 400, "File ID is required");
    }

    const { status, userId } = req.body;
    if (status === undefined) {
      return sendResponse(res, 400, "Status is required");
    }
    if (!userId) {
      return sendResponse(res, 400, "User ID is required");
    }

    if (status === true) {
      await ClientFile.updateMany(
        {
          userId: userId,
          _id: { $ne: fileId },
          makeProfile: true,
        },
        {
          makeProfile: false,
        }
      );
    }

    const updatedFile = await ClientFile.findByIdAndUpdate(
      fileId,
      { makeProfile: status },
      { new: true }
    );

    await User.findByIdAndUpdate(
      userId,
      { plusImage: status ? updatedFile?._id : null },
      { new: true }
    );

    if (!updatedFile) {
      return sendResponse(res, 404, "Client file not found");
    }

    return sendResponse(res, 200, "File status updated successfully!");
  } catch (error) {
    console.error("Error updating client photo:", error);
    return sendResponse(res, 500, "Internal server error");
  }
}

async function deleteClientPhoto(req, res) {
  try {
    const { id } = req.params;

    const contentData = await ClientFile.findById(id);
    if (!contentData) {
      return sendResponse(res, 404, "Content detail not found!");
    }

    await deleteS3File(contentData.key);

    await ClientFile.findByIdAndDelete(id);

    await User.updateMany(
      { coverImage: id },
      { $set: { coverImage: null } },
      { new: true }
    );

    return sendResponse(res, 200, "Content deleted successfully.");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

module.exports = {
  createClient,
  getClientById,
  getClientPhotos,
  updateClient,
  uploadClientPhoto,
  deleteClientPhoto,
  updateClientPhoto,
};
