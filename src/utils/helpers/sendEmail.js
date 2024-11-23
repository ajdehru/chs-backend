const path = require("path");
const ejs = require("ejs");
const fs = require("fs");
const { sendEmail } = require("../../configs/email");

const forSendEmail = async ({ template, data, subject, email }) => {
  const templatePath = path.join(__dirname,"../../templates/", template);
  var compiled = ejs.compile(
    fs.readFileSync(path.resolve(templatePath), "utf8")
  );

  var html = compiled(data);
  const info = await sendEmail(email, subject, html);
  return info;
};

module.exports = {
  forSendEmail,
};
