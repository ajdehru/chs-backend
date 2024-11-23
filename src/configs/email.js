const AWS = require("aws-sdk");
const nodemailer = require("nodemailer");
const {
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  AWS_ACCESS_KEY_ID,
  AWS_SES_EMAIL_FROM,
} = require(".");

// Configure AWS
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

// Create SES transporter
const transporter = nodemailer.createTransport({
  SES: new AWS.SES({ apiVersion: "2010-12-01" }),
});

const sendEmail = async (receiver, subject, html) => {
  const mailOptions = {
    from: AWS_SES_EMAIL_FROM,
    to: receiver,
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = {
  sendEmail,
};
