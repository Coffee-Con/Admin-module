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
  
  try {
    let data = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields) => {
        if (err) return reject(err);
        
        let data = {};
        Object.keys(fields).forEach(property => {
          data[property] = Array.isArray(fields[property]) ? fields[property] : fields[property];
        });
        resolve(data);
      });
    });

    // 获取名称和邮箱的数组
    const nameArray = data['name[]'];
    const emailArray = data['email[]'];
    const message = data.message[0]; // 将 data.message 作为字符串处理

    // 确保名称和邮箱的数组长度相同
    if (nameArray.length !== emailArray.length) {
      return res.status(400).send('Names and emails count mismatch');
    }

    // 依次遍历每个收件人并发送邮件
    for (let i = 0; i < nameArray.length; i++) {
      const namePlaceholder = nameArray[i];
      const linkPlaceholder = await generateLink.generateLink(emailArray[i]);

      // 用模板内容替换占位符
      const content = message
        .replace(/\[name\]/g, namePlaceholder)
        .replace(/\[link\]/g, linkPlaceholder);

      const htmlContent = marked.marked(content);

      const mail = {
        from: `${data.sendername} <${data.senderemail}>`,
        to: `${namePlaceholder} <${emailArray[i]}>`,
        subject: data.subject[0],  // 确保data.subject是字符串
        text: content,
        html: htmlContent
      };

      await transporter.sendMail(mail);
    }

    res.status(200).send('Email successfully sent to all recipients!'); 

  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).send('An error occurred while sending emails.');
  }
};

module.exports = { sendMailHandler };
