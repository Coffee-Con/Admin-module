require('dotenv').config();

const nodemailer = require('nodemailer');
const multiparty = require('multiparty');
const marked = require('marked');
const crypto = require('crypto');
const path = require('path');

const mysql = require('mysql2');
const dbConfig = require('../dbConfig'); 
const connection = mysql.createConnection(dbConfig);
const transporter = require('../emailConfig');

const host = new URL(process.env.BASE_URL).host;

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

    // Get name and email arrays
    const nameArray = data['name[]'];
    const emailArray = data['email[]'];
    const message = data.message[0];
    const senderName = data.sendername[0];
    const senderEmail = data.senderemail[0];
    const subject = data.subject[0];

    // 确保名称和邮箱的数组长度相同
    if (nameArray.length !== emailArray.length) {
      return res.status(400).send('Names and emails count mismatch');
    }

    // Prepare ClickKeys JSON array
    const clickKeysArray = [];
    
    // 依次遍历每个收件人并发送邮件
    for (let i = 0; i < nameArray.length; i++) {
      const namePlaceholder = nameArray[i];
      const email = emailArray[i];
      const { link: linkPlaceholder, key } = await generateLink(email); // 生成点击链接和密钥

      // 用模板内容替换占位符
      const content = message
        .replace(/\[name\]/g, namePlaceholder)
        .replace(/\[link\]/g, linkPlaceholder);

      const htmlContent = marked.marked(content);

      const mail = {
        from: `${senderName} <${senderEmail}>`,
        to: `${namePlaceholder} <${email}>`,
        subject: subject,
        text: content,
        html: htmlContent
      };

      await transporter.sendMail(mail); // 发送邮件

      // 添加到 ClickKeys 数组
      clickKeysArray.push({ email, clickkey: key });
    }

    // 构建 SQL 插入
    const query = `INSERT INTO MailEvent (ClickKeys, Content) VALUES (?, ?);`;
    const contentData = {
      sendername: senderName,
      senderemail: senderEmail,
      subject: subject,
      message: message
    };

    connection.query(query,[JSON.stringify(clickKeysArray), JSON.stringify(contentData)],(err, results) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).send('Emails successfully sent and data logged to database!');}
    );

  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).send('An error occurred while sending emails.');
  }
};

// 生成随机 Token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// 验证验证码并发送带 Token 的邮件
const verifyCaptcha = async (req, res) => {
  const { captchaInput, email } = req.body;

  // 验证验证码是否正确（忽略大小写）
  if (req.session.captcha && captchaInput.toLowerCase() === req.session.captcha.toLowerCase()) {
    try {
      // 检查邮箱是否在数据库中存在
      const query = 'SELECT UserID FROM `User` WHERE email = ?';
      connection.query(query, [email], (err, rows) => {
        if (err) {
          console.error('数据库查询错误:', err);
          return res.status(500).json({ success: false, message: '数据库错误，请稍后重试。' });
        }

        if (rows.length === 0) {
          return res.status(400).json({ success: false, message: '该邮箱未注册，请重试。' });
        }

        const userID = rows[0].UserID;

        // 生成唯一的 token 并存储到数据库
        const token = generateToken();
        const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // Token 有效期1小时

        const insertQuery = 'INSERT INTO ResetTokens (user_id, token, token_expiry) VALUES (?, ?, ?)';
        connection.query(insertQuery, [userID, token, expiryTime], (err, results) => {
          if (err) {
            console.error('Token 数据库插入错误:', err);
            return res.status(500).json({ success: false, message: '数据库错误，请稍后重试。' });
          }

          // 构建带 Token 的重置密码链接
          const resetLink = `https://${host}/resetPassword.html?changepasswordToken=${token}`;

          // 发送邮件
          const mailOptions = {
            from: 'no-reply@staffcanvas.com',
            to: email,
            subject: 'Password reset request',
            text: `Please click on the link below to reset your password: \n\n${resetLink}\n\nThis link will expire in 1 hour.`
          };

          transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
              console.error('邮件发送错误:', err);
              return res.status(500).json({ success: false, message: '邮件发送失败，请稍后重试。' });
            }
            return res.status(200).json({ success: true, message: '验证码正确！请到对应邮箱更新密码。' });
          });
        });
      });
    } catch (err) {
      console.error('服务器错误:', err);
      return res.status(500).json({ success: false, message: '内部服务器错误，请稍后重试。' });
    }
  } else {
    return res.status(400).json({ success: false, message: '验证码错误，请重新输入。' });
  }
};

// for mobile app
// 验证验证码并发送带 Token 的邮件
const verifyCaptcha2 = async (req, res) => {
  const { email } = req.body;

  // 验证验证码是否正确（忽略大小写）
  try {
    // 检查邮箱是否在数据库中存在
    const query = 'SELECT UserID FROM `User` WHERE email = ?';
    connection.query(query, [email], (err, rows) => {
      if (err) {
        console.error('Database Query Error:', err);
        return res.status(500).json({ success: false, message: 'Database Error, Please Try Again Later.' });
      }

      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: 'This Email Account is NOT Registered, Please Try Again.' });
      }

      const userID = rows[0].UserID;

      // 生成唯一的 token 并存储到数据库
      const token = generateToken();
      const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // Token 有效期1小时

      const insertQuery = 'INSERT INTO reset_tokens (user_id, token, token_expiry) VALUES (?, ?, ?)';
      connection.query(insertQuery, [userID, token, expiryTime], (err, results) => {
        if (err) {
          console.error('Token 数据库插入错误:', err);
          return res.status(500).json({ success: false, message: 'Database Error, Please Try Again Later.' });
        }

        // 构建带 Token 的重置密码链接
        const resetLink = `https://${host}/resetPassword.html?changepasswordToken=${token}`;

        // 发送邮件
        const mailOptions = {
          from: 'no-reply@staffcanvas.com',
          to: email,
          subject: 'Password reset request',
          text: `Please click on the link below to reset your password: \n\n${resetLink}\n\nThis link will expire in 1 hour.`
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error('邮件发送错误:', err);
            return res.status(500).json({ success: false, message: 'Email was Unsuccessfully Sent, Please Try again later!' });
          }
          return res.status(200).json({ success: true, message: 'Verfication Code is Correct! Please Procceed To The Corresponding Email for Reset' });
        });
      });
    });
  } catch (err) {
    console.error('服务器错误:', err);
    return res.status(500).json({ success: false, message: 'Internal server error, please try again later.' });
  }
};

// 验证 Token 并展示重置密码页面
const resetPassword = (req, res) => {
  const { newPassword, changepasswordToken } = req.body;

  if (!newPassword || !changepasswordToken) {
      return res.status(400).json({ success: false, message: 'New Password and Token is Required.' });
  }
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'The password must contain uppercase letters, lowercase letters, numbers, special characters and be at least 8 characters long.'});
  }

  // 查找与 token 关联的用户
  const query = `
    SELECT u.UserID, u.Salt 
    FROM ResetTokens rt
    JOIN User u ON rt.user_id = u.UserID
    WHERE rt.token = ? AND rt.token_expiry > NOW()
  `;
  connection.query(query, [changepasswordToken], async (err, rows) => {
      if (err) {
          console.error('数据库查询错误:', err);
          return res.status(500).json({ success: false, message: 'Internal server error, please try again later.' });
      }

      if (rows.length === 0) {
          return res.status(400).json({ success: false, message: 'Token Invalid or Out of Date, Please Request For New Password Reset。' });
      }

      const userId = rows[0].UserID;
      const salt = rows[0].Salt;

      // 对新密码进行哈希处理
      const hashedPW = crypto.createHash('md5').update(newPassword + salt).digest('hex');

      // 更新用户的密码
      const updateQuery = 'UPDATE User SET HashedPW = ? WHERE UserID = ?';
      connection.query(updateQuery, [hashedPW, userId], (err, results) => {
          if (err) {
              console.error('Update Password Error:', err);
              return res.status(500).json({ success: false, message: 'Interal Server Error, Please Try Again Later!' });
          }

          // 可选：删除已使用的重置 token
          const deleteQuery = 'DELETE FROM ResetTokens WHERE token = ?';
          connection.query(deleteQuery, [changepasswordToken], (err) => {
              if (err) {
                  console.error('Delete Token Error:', err);
              }
          });
          return res.status(200).json({ success: true, message: 'Reset Password Successful!' });
      });
  });
};

const generateLink = async (Email) => {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('hex');

    connection.query('INSERT INTO ClickKey (`key`, `Email`) VALUES (?, ?)', [key, Email], (err) => {
      if (err) {
        console.error('Error inserting key into the database:', err.stack);
        reject('Internal server error');
        return;
      }

      const link = `https://${host}/click/${key}`;
      resolve({ link, key });
    });
  });
};

const clickLinkHandler = (req, res) => {
  const key = req.params.key;

  // 记录点击事件
  connection.query('INSERT INTO ClickEvent (`key`) VALUES (?)', [key], (err) => {
    if (err) {
      console.error('Error inserting click event into the database:', err.stack);
    }

    // 显示一个确认页面
    res.sendFile(path.join(__dirname, '../../public', 'ClickRecorded.html'));
  });
};

module.exports = { sendMailHandler, verifyCaptcha, verifyCaptcha2, resetPassword, generateLink, clickLinkHandler };
