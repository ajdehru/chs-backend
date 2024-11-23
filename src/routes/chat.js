const express = require("express");
const router = express.Router();

const { checkAuth } = require("../middlewares/auth");
const {
  getMeeting,
  createMeeting,
  editMeeting,
  deleteMeetingsBulk,
  createChat,
  deleteMessage,
  getAllMessages,
  getLastMessage,
  getAllChats
} = require("../controllers/chat");

// meeting routes
router.get("/meeting", checkAuth, getMeeting);
router.post("/meeting/create", createMeeting);
router.put("/meeting/:meetingId/edit", checkAuth, editMeeting);

router.delete("/meeting/delete", checkAuth, deleteMeetingsBulk);

// chats routes
router.post("/create", createChat);
router.delete("/:messageId/message", checkAuth, deleteMessage);
router.get("/messages/:chatId", getAllMessages);
router.get("/chats/:userId", getAllChats);
router.get("/:chatId/letest", checkAuth, getLastMessage); 

module.exports = router;
