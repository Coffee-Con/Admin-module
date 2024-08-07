const nodemailer = require('nodemailer');
const multiparty = require('multiparty');
const marked = require('marked');
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

const sendMailHandler = async (req, res) => {
  let form = new multiparty.Form();
  let data = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields) => {
      if (err) reject(err);
      let data = {};
      Object.keys(fields).forEach(property => {
        data[property] = fields[property].toString();
      });
      resolve(data);
    });
  });

  const namePlaceholder = data.name;
  const linkPlaceholder = await generateLink.generateLink(data.email);

  content = data.message
              .replace(/\[name\]/g, namePlaceholder)
              .replace(/\[link\]/g, linkPlaceholder);

  const htmlContent = marked.marked(content);

  // var sender_name = data.sendername;
  // var sender = data.senderemail;

  const mail = {
    from: `${data.sendername} <${data.senderemail}>`, // sender address
    to: `${data.name} <${data.email}>`, // receiver email
    subject: data.subject,
    text: content,
    html: htmlContent
  };

  await transporter.sendMail(mail);
  res.status(200).send('Email successfully sent to recipient!'); 
};

module.exports = { sendMailHandler };
