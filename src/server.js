require("dotenv").config({ path: `.env` });
require("./configs/db.js");
const { Server } = require("socket.io");
const User = require("../src/models/user.js");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const path = require("path");

const { PORT, FRONTEND_URL } = require("./configs/index.js");
const {
  userRoutes,
  modelRoutes,
  authRoutes,
  clientRoutes,
  modelContentRoutes,
  interactionRoutes,
  chatRoutes,
  paymentRoutes,
  adminRoutes,
} = require("./routes/index.js");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: { FRONTEND_URL },
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// Store user socket mappings
const userSockets = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Associate user with their socket
  socket.on("register_user", async (userId) => {
    userSockets.set(userId, socket.id);
    //also set the user online
    await User.findByIdAndUpdate(userId, { isOnline: true });
    console.log(`User ${userId} registered with socket ${socket.id}`);
    io.emit("online_users", Array.from(userSockets.keys()));
  });

  // Join all user's chat rooms at once
  socket.on("join_user_chats", (chatIds) => {
    chatIds.forEach((chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room ${chatId}`);
    });
  });

  // Handle new message
  socket.on("send_message", (messageData) => {
    // Broadcast the message to the specific room
    socket.to(messageData.chatId).emit("receive_message", {
      ...messageData,
      chatId: messageData.chatId, // Ensure chatId is included
    });
  });

  // Handle update meeting
  socket.on("update_meet", (messageData) => {
    // Broadcast the message to the specific room
    socket.to(messageData.chatId).emit("update_meet", {
      ...messageData,
      chatId: messageData.chatId, // Ensure chatId is included
    });
  });

  // Handle typing status
  socket.on("typing", ({ chatId, userId, isTyping }) => {
    socket.to(chatId).emit("user_typing", { chatId, userId, isTyping });
  });

  socket.on("disconnect", async () => {
    // Remove user from userSockets mapping
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        userSockets.delete(userId);
        io.emit("online_users", Array.from(userSockets.keys()));
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

app.use(cors());
app.options("*", cors());

app.use(bodyParser.json({ limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

// routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/client", clientRoutes);
app.use("/model", modelRoutes);
app.use("/content", modelContentRoutes);
app.use("/interaction", interactionRoutes);
app.use("/chat", chatRoutes);
app.use("/payment", paymentRoutes);
app.use("/admin", adminRoutes);

// testing router
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Adult Api is running",
  });
});

//domain verification stripe
app.get(
  "/.well-known/apple-developer-merchantid-domain-association",
  (req, res) => {
    const filePath = path.join(
      __dirname,
      "staticfiles",
      "apple-developer-merchantid-domain-association"
    );
    console.log(filePath);
    // Set the correct content type
    res.set("Content-Type", "text/plain");

    // Send the file
    res.sendFile(filePath);
  }
);

try {
  server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}!`);
  });
} catch (error) {
  console.error("Error starting the server:", error);
}
