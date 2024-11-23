const twilio = require("twilio");

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = require(".");

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendSms = async (phoneNumber, message) => {
  try {
    const response = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`SMS sent successfully to ${phoneNumber}: SID ${response.sid}`);
  } catch (error) {
    console.error(`Failed to send SMS to ${phoneNumber}:`, error.message);
    throw new Error("Failed to send SMS");
  }
};

module.exports = sendSms;
