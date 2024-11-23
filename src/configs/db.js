const mongoose = require("mongoose");
const { MONGO_CONNECTION_STRING } = require("../configs");

// Establish the MongoDB connection
mongoose
  .connect(MONGO_CONNECTION_STRING)
  .then(() => console.log("Database connected successfully!"))
  .catch((error) => console.error("Database connection error:", error));

let db = mongoose.connection;

// Handle connection events
db.on("connected", () => {
  console.log("Mongoose connected to the database.");
});

db.on("error", (error) => {
  console.error("Mongoose connection error:", error);
});

db.on("disconnected", () => {
  console.log("Mongoose disconnected from the database.");
});

// Export the mongoose connection
module.exports = db;
