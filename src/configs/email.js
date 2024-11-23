const sgMail = require("@sendgrid/mail");
const { SENDGRID_API_KEY, SENDGRID_EMAIL_FROM } = require(".");

sgMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = async (email, subject, message) => {
  const emailData = {
    to: email,
    from: SENDGRID_EMAIL_FROM,
    subject,
    text: message,
    html: `<p>${message}</p>`,
  };

  try {
    await sgMail.send(emailData);
    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error.message);
    throw new Error("Failed to send email");
  }
};

module.exports = sendEmail;
