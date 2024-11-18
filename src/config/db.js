const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const { DB_CONNECTION_URL } = require("../constants");

const connectDB = () => {
  console.log(DB_CONNECTION_URL, "===");
  mongoose
    .connect(DB_CONNECTION_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("Connection error", error));
};

module.exports = connectDB;
