require('dotenv').config();

const nodemailer = require('nodemailer');
const multiparty = require('multiparty');
const marked = require('marked');
const crypto = require('crypto');


const mysql = require('mysql2');
const dbConfig = require('../dbConfig'); 
const connection = mysql.createConnection(dbConfig);

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

    // Prepare to store data for MailEvent
    const emailsData = [];
    const clickKeysData = [];
    const contentData = [];

    // 依次遍历每个收件人并发送邮件
    for (let i = 0; i < nameArray.length; i++) {
      const namePlaceholder = nameArray[i];
      const email = emailArray[i];
      const { linkPlaceholder, key } = await generateLink(emailArray[i]);

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

      // Store details for MailEvent
      emailsData.push(email);
      clickKeysData.push(key);
    }

    const query = `INSERT INTO MailEvent (Emails, ClickKeys, Content) VALUES (?, ?, ?);`;
    connection.query(query, [JSON.stringify(emailsData), JSON.stringify(clickKeysData), JSON.stringify({sendername: data.sendername[0],
      senderemail: data.senderemail[0], subject: data.subject[0], message: data.message[0]})], (err, results) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).json({ error: 'Database error' });
      }}
    );

    res.status(200).send('Email successfully sent to all recipients!'); 

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
          const resetLink = `${process.env.BASE_URL}:${process.env.PORT}/resetPassword.html?changepasswordToken=${token}`;

          // 发送邮件
          const mailOptions = {
            from: 'no-reply@staffcanvas.com',
            to: email,
            subject: '密码重置请求',
            text: `请点击以下链接以重置密码：\n\n${resetLink}\n\n该链接将在1小时后失效。`
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

      const insertQuery = 'INSERT INTO reset_tokens (user_id, token, token_expiry) VALUES (?, ?, ?)';
      connection.query(insertQuery, [userID, token, expiryTime], (err, results) => {
        if (err) {
          console.error('Token 数据库插入错误:', err);
          return res.status(500).json({ success: false, message: '数据库错误，请稍后重试。' });
        }

        // 构建带 Token 的重置密码链接
        const resetLink = `${process.env.BASE_URL}:${process.env.PORT}/resetPassword.html?changepasswordToken=${token}`;

        // 发送邮件
        const mailOptions = {
          from: 'no-reply@staffcanvas.com',
          to: email,
          subject: '密码重置请求',
          text: `请点击以下链接以重置密码：\n\n${resetLink}\n\n该链接将在1小时后失效。`
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
    return res.status(500).json({ success: false, message: 'Internal server error, please try again later.' });
  }
};

// 验证 Token 并展示重置密码页面
const resetPassword = (req, res) => {
  const { newPassword, changepasswordToken } = req.body;

  if (!newPassword || !changepasswordToken) {
      return res.status(400).json({ success: false, message: '新密码和 Token 是必需的。' });
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
          return res.status(400).json({ success: false, message: 'Token 无效或已过期，请重新请求重置密码。' });
      }

      const userId = rows[0].UserID;
      const salt = rows[0].Salt;

      // 对新密码进行哈希处理
      const hashedPW = crypto.createHash('md5').update(newPassword + salt).digest('hex');

      // 更新用户的密码
      const updateQuery = 'UPDATE User SET HashedPW = ? WHERE UserID = ?';
      connection.query(updateQuery, [hashedPW, userId], (err, results) => {
          if (err) {
              console.error('更新密码错误:', err);
              return res.status(500).json({ success: false, message: '内部服务器错误，请稍后重试。' });
          }

          // 可选：删除已使用的重置 token
          const deleteQuery = 'DELETE FROM ResetTokens WHERE token = ?';
          connection.query(deleteQuery, [changepasswordToken], (err) => {
              if (err) {
                  console.error('删除 Token 错误:', err);
              }
          });

          return res.status(200).json({ success: true, message: '密码重置成功！' });
      });
  });
};

const generateLink = async (email) => {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('hex');

    connection.query('SELECT UserID FROM User WHERE (`Email`) = (?)', [email], (err, results) => {
      if (err) {
        console.error('Error querying the database:', err.stack);
        reject('Internal server error');
        return;
      }

      const userId = results.length > 0 ? results[0].UserID : 0;

      connection.query('INSERT INTO ClickKey (`key`, `userid`) VALUES (?, ?)', [key, userId], (err) => {
        if (err) {
          console.error('Error inserting key into the database:', err.stack);
          reject('Internal server error');
          return;
        }

        const link = `${process.env.BASE_URL}:${process.env.PORT}/click/${key}`;
        resolve({ link, key });
      });
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
    res.send(
      '<h1>Your click has been recorded.</h1>'
    );
  });
};

module.exports = { sendMailHandler, verifyCaptcha, verifyCaptcha2, resetPassword, generateLink, clickLinkHandler };
