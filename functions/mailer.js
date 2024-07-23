const nodemailer = require('nodemailer');
const multiparty = require('multiparty');
const generateLink = require('./generateLink');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.ACCOUNT,
    pass: process.env.PASS,
  }
});

// verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

const sendMailHandler = (req, res) => {
  let form = new multiparty.Form();
  let data = {};
  form.parse(req, function (err, fields) {
    Object.keys(fields).forEach(function (property) {
      data[property] = fields[property].toString();
    });
    // console.log(data);

    // replace
    const namePlaceholder = data.name;
    const linkPlaceholder = "https://www.google.com";
    // const linkPlaceholder = generateLink.generateLink(data.email);
    console.log('Link:', linkPlaceholder);

    const mail = {
      from: process.env.SENDER,
      to: `${data.name} <${data.email}>`, // receiver email,
      subject: data.subject,
      // text: data.message.replace('[name]', data.name),
      text: data.message
              .replace(/\[name\]/g, namePlaceholder)
              .replace(/\[link\]/g, linkPlaceholder),
    };
    // console.log(mail);

    transporter.sendMail(mail, (err, info) => {
      if (err) {
        console.log(err);
        res.status(500).send('Something went wrong.');
      } else {
        res.status(200).send('Email successfully sent to recipient!');
      }
    });
  });
};

module.exports = { sendMailHandler };
