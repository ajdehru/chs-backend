const multer = require("multer");
const multerS3 = require("multer-s3");
const { deleteS3File, s3Config, s3 } = require("../configs/s3");
const { sendResponse } = require("../utils");

const upload = multer({
  storage: multerS3({
    ...s3Config,
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadVideo = multer({
  storage: multerS3({
    ...s3Config,
    metadata: function (req, file, cb) {
      console.log(req, file,"req, file")
      cb(null, { ContentType: "application/octet-stream" });
    },
  }),
});

module.exports = { upload, uploadVideo };
