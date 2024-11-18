const express = require("express");
const connectDB = require("./src/config/db");
const dotenv = require("dotenv");
const userRoutes = require("./src/routes/userRoutes");
const { PORT } = require("./src/constants");

dotenv.config();

const app = express();

app.use(express.json());

connectDB();

app.use("/api", userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
