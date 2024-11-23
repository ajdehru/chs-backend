const Meeting = require("../models/meeting");
const Chat = require("../models/chat");
const Message = require("../models/message");
const { sendResponse } = require("../utils");
const { default: mongoose } = require("mongoose");
const { mongo } = require("mongoose");
const content = require("../models/content");
const clientFile = require("../models/clientFile");

async function createMeeting(req, res) {
  try {
    const {
      hostUserId,
      participantUserId,
      date,
      demoDate,
      location,
      time,
      message,
    } = req.body;

    const newMeeting = new Meeting({
      hostUserId,
      participantUserId,
      scheduledAt: new Date(date),
      location: {
        city: location,
        country: location,
      },
      scheduledTime: time?.toString(),
      status: "Pending",
      message,
    });

    const savedMeeting = await newMeeting.save();
    return sendResponse(res, 201, "Meeting created successfully", savedMeeting);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function editMeeting(req, res) {
  try {
    const { meetingId } = req.params;
    const updatedData = req.body;

    if (updatedData.scheduledAt) {
      updatedData.scheduledAt = new Date(updatedData.scheduledAt);
    }

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      meetingId,
      updatedData,
      { new: true }
    );

    if (!updatedMeeting) return sendResponse(res, 404, "Meeting not found");

    return sendResponse(
      res,
      200,
      "Meeting updated successfully",
      updatedMeeting
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getMeeting(req, res) {
  try {
    const { hostUserId, participantUserId, latest, all } = req.query;

    // const currentDate = new Date();
    const currentDate = new Date();
    const oneDayLater = new Date();
    oneDayLater.setDate(currentDate.getDate() - 1);

    let query = Meeting.find({
      $or: [
        { hostUserId: hostUserId, participantUserId: participantUserId },
        { hostUserId: participantUserId, participantUserId: hostUserId },
      ],
      scheduledAt: { $gte: oneDayLater },
      status: { $ne: all == "true" ? "" : "Cancelled" },
    });

    if (latest == "true") {
      query = query.sort({ scheduledAt: -1 }).limit(1);
    }

    const meetings = await query.exec();

    if (!meetings || meetings?.length == 0) {
      return sendResponse(res, 404, "No upcoming meetings found");
    }

    const message =
      latest == "true"
        ? "Latest meeting retrieved successfully"
        : "Meetings retrieved successfully";
    return sendResponse(
      res,
      200,
      message,
      latest == "true" ? meetings[0] : meetings
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function deleteMeetingsBulk(req, res) {
  try {
    const currentDate = new Date();

    const result = await Meeting.deleteMany({
      scheduledAt: { $lt: currentDate },
    });

    if (result.deletedCount > 0) {
      return sendResponse(
        res,
        200,
        `Successfully deleted ${result.deletedCount} old meetings`
      );
    } else {
      return sendResponse(res, 200, "No old meetings found to delete");
    }
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

// create new chat
async function createChat(req, res) {
  try {
    const { senderId, receiverId, message } = req.body;
    console.log(req.body);
    let chat = await Chat.findOne({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (!chat) {
      chat = await Chat.create({
        senderId,
        receiverId,
        lastMessage: "Say hi!",
      });
    } else {
      chat = await Chat.findByIdAndUpdate(
        chat._id,
        {
          senderId,
          receiverId,
          lastMessage: message,
          updatedAt: Date.now(),
        },
        { new: true }
      );
    }

    const newMessage = await Message.create({
      chatId: chat._id,
      senderId,
      receiverId,
      message,
    });

    return sendResponse(res, 201, "Message sent successfully", newMessage);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const deletedMessage = await Message.findByIdAndDelete(messageId);

    if (!deletedMessage) {
      return sendResponse(res, 404, "Message not found");
    }

    // Update lastMessage in Chat if the deleted message was the last one
    const lastMessage = await Message.findOne({
      chatId: deletedMessage.chatId,
    }).sort({ createdAt: -1 });
    if (lastMessage) {
      await Chat.findByIdAndUpdate(deletedMessage.chatId, {
        lastMessage: lastMessage.message,
      });
    }

    return sendResponse(res, 200, "Message deleted successfully");
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getAllMessages(req, res) {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ chatId })
      .populate("senderId", "username coverImage")
      .populate("receiverId", "username coverImage")
      .sort({ createdAt: 1 });
    return sendResponse(res, 200, "Messages retrieved successfully", messages);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getLastMessage(req, res) {
  try {
    const { chatId } = req.params;
    const lastMessage = await Message.findOne({ chatId })
      .populate("senderId", "username coverImage")
      .populate("receiverId", "username coverImage")
      .sort({ createdAt: -1 });

    return sendResponse(
      res,
      200,
      "Last message retrieved successfully",
      lastMessage
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

async function getAllChats(req, res) {
  try {
    const { userId } = req.params;
    // console.log(userId)
    const pipeline = [
      {
        $match: {
          $or: [
            { senderId: new mongo.ObjectId(userId) },
            { receiverId: new mongo.ObjectId(userId) },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "sender",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "receiverId",
          foreignField: "_id",
          as: "receiver",
        },
      },
      {
        $unwind: {
          path: "$receiver", // Unwind `senderInfo` array to get a single object
          preserveNullAndEmptyArrays: true, // Keeps the document if `senderInfo` is empty
        },
      },
      {
        $unwind: {
          path: "$sender", // Unwind `senderInfo` array to get a single object
          preserveNullAndEmptyArrays: true, // Keeps the document if `senderInfo` is empty
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          _id: 1,
          senderId: 1,
          receiverId: 1,
          lastMessage: 1,
          updatedAt: 1,
          createdAt: 1,
          receiver: {
            username: 1,
            coverImage: 1,
            plusImage: 1,
          },
          sender: {
            username: 1,
            coverImage: 1,
            plusImage: 1,
          },
        },
      },
    ];
    const chats = await Chat.aggregate(pipeline);

    let userWithProfile = await getUserProfiles(chats, userId);

    return sendResponse(
      res,
      200,
      "Chats retrieved successfully",
      userWithProfile
    );
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
}

const getUserProfiles = async (users, userId) => {
  return Promise.all(
    users.map(async (user) => {
      let profilePic = null;

      const imageId =
        userId == user?.senderId
          ? user?.receiver?.plusImage || user?.receiver.coverImage
          : user?.sender?.plusImage || user?.sender.coverImage;

      if (imageId) {
        const isMContent = await content.findOne({ _id: imageId });
        if (isMContent) {
          profilePic = isMContent?.url || null;
        } else {
          const isContent = await clientFile.findOne({ _id: imageId });
          profilePic = isContent?.fileUrl || null;
        }
      }
      user.receiver.coverImage = profilePic;
      user.sender.coverImage = profilePic;

      return user;
    })
  );
};

module.exports = {
  getMeeting,
  createMeeting,
  editMeeting,
  deleteMeetingsBulk,
  createChat,
  deleteMessage,
  getAllMessages,
  getLastMessage,
  getAllChats,
};
