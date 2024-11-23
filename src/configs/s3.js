const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
} = require("./index");
const multerS3 = require("multer-s3");

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const s3Config = {
  s3: s3,
  bucket: AWS_BUCKET_NAME,
  acl: "public-read",
  key: function (req, file, cb) {
    cb(null, Date.now().toString() + file.originalname.replace(/\s/g, "-"));
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
};

const deleteS3File = async (fileKey) => {
  try {
    const params = {
      Bucket: AWS_BUCKET_NAME,
      Key: fileKey,
    };
    const command = new DeleteObjectCommand(params);
    return await s3.send(command);
  } catch (error) {
    console.log("S3 file deleted Error :", error);
    throw error;
  }
};

module.exports = {s3, s3Config, deleteS3File };
