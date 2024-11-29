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

    // Make sure the name and email arrays are the same length
    if (nameArray.length !== emailArray.length) {
      return res.status(400).send('Names and emails count mismatch');
    }

    // Prepare ClickKeys JSON array
    const clickKeysArray = [];
    
    // Iterate through each recipient and send mail
    for (let i = 0; i < nameArray.length; i++) {
      const namePlaceholder = nameArray[i];
      const email = emailArray[i];
      const { link: linkPlaceholder, key } = await generateLink(email); // Generate click link and key

      // Replace placeholder with template content
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

      await transporter.sendMail(mail); // Send mail

      // Add to the ClickKeys array
      clickKeysArray.push({ email, clickkey: key });
    }

    // INSERT INTO MailEvent
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

// Generate Random Token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Verify the verification code and send an email with a token
const verifyCaptcha = async (req, res) => {
  const { captchaInput, email } = req.body;

  // Verify that the verification code is correct (ignore case)
  if (req.session.captcha && captchaInput.toLowerCase() === req.session.captcha.toLowerCase()) {
    try {
      // Check if the mailbox exists in the database
      const query = 'SELECT UserID FROM `User` WHERE email = ?';
      connection.query(query, [email], (err, rows) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false, message: 'Database error, please try again later.' });
        }

        if (rows.length === 0) {
          return res.status(400).json({ success: false, message: 'The email address is not registered, please try again.' });
        }

        const userID = rows[0].UserID;

        // Generate a unique token and store it in the database
        const token = generateToken();
        const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // Token is valid for 1 hour

        const insertQuery = 'INSERT INTO ResetTokens (user_id, token, token_expiry) VALUES (?, ?, ?)';
        connection.query(insertQuery, [userID, token, expiryTime], (err, results) => {
          if (err) {
            console.error('Token database insertion error:', err);
            return res.status(500).json({ success: false, message: 'Database error, please try again later.' });
          }

          // Construct a reset password link with a token
          const resetLink = `https://${host}/resetPassword.html?changepasswordToken=${token}`;

          // Send email
          const mailOptions = {
            from: `no-reply@${host}`,
            to: email,
            subject: 'Password reset request',
            text: `Please click on the link below to reset your password: \n\n${resetLink}\n\nThis link will expire in 1 hour.`,
            html: `Please click on the link below to reset your password: <br><br><a href="${resetLink}">${resetLink}</a><br><br>This link will expire in 1 hour.`
          };

          transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
              console.error('Email sending error:', err);
              return res.status(500).json({ success: false, message: 'Failed to send email, please try again later.' });
            }
            return res.status(200).json({ success: true, message: 'The verification code is correct! Please go to the corresponding email address to update your password.' });
          });
        });
      });
    } catch (err) {
      console.error('Server Error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error, please try again later.' });
    }
  } else {
    return res.status(400).json({ success: false, message: 'The verification code is incorrect, please re-enter it.' });
  }
};

// for mobile app
// Verify the verification code and send an email with a token
const verifyCaptcha2 = async (req, res) => {
  const { email } = req.body;

  // Verify that the verification code is correct (ignore case)
  try {
    // Check if the mailbox exists in the database
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

      // Generate a unique token and store it in the database
      const token = generateToken();
      const expiryTime = new Date(Date.now() + 60 * 60 * 1000); // Token is valid for 1 hour

      const insertQuery = 'INSERT INTO reset_tokens (user_id, token, token_expiry) VALUES (?, ?, ?)';
      connection.query(insertQuery, [userID, token, expiryTime], (err, results) => {
        if (err) {
          console.error('Token database insertion error:', err);
          return res.status(500).json({ success: false, message: 'Database Error, Please Try Again Later.' });
        }

        // Construct a reset password link with a token
        const resetLink = `https://${host}/resetPassword.html?changepasswordToken=${token}`;

        // Send email
        const mailOptions = {
          from: `no-reply@${host}`,
          to: email,
          subject: 'Password reset request',
          text: `Please click on the link below to reset your password: \n\n${resetLink}\n\nThis link will expire in 1 hour.`,
          html: `Please click on the link below to reset your password: <br><br><a href="${resetLink}">${resetLink}</a><br><br>This link will expire in 1 hour.`
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
            console.error('Email sending error:', err);
            return res.status(500).json({ success: false, message: 'Email was Unsuccessfully Sent, Please Try again later!' });
          }
          return res.status(200).json({ success: true, message: 'Verfication Code is Correct! Please Procceed To The Corresponding Email for Reset' });
        });
      });
    });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error, please try again later.' });
  }
};

// Verify the Token and display the reset password page
const resetPassword = (req, res) => {
  const { newPassword, changepasswordToken } = req.body;

  if (!newPassword || !changepasswordToken) {
      return res.status(400).json({ success: false, message: 'New Password and Token is Required.' });
  }
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'The password must contain uppercase letters, lowercase letters, numbers, special characters and be at least 8 characters long.'});
  }

  // Find the user associated with the token
  const query = `
    SELECT u.UserID, u.Salt 
    FROM ResetTokens rt
    JOIN User u ON rt.user_id = u.UserID
    WHERE rt.token = ? AND rt.token_expiry > NOW()
  `;
  connection.query(query, [changepasswordToken], async (err, rows) => {
      if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false, message: 'Internal server error, please try again later.' });
      }

      if (rows.length === 0) {
          return res.status(400).json({ success: false, message: 'Token Invalid or Out of Date, Please Request For New Password Reset。' });
      }

      const userId = rows[0].UserID;
      const salt = rows[0].Salt;

      // Hash the new password
      const hashedPW = crypto.createHash('md5').update(newPassword + salt).digest('hex');

      // Update the user's password
      const updateQuery = 'UPDATE User SET HashedPW = ? WHERE UserID = ?';
      connection.query(updateQuery, [hashedPW, userId], (err, results) => {
          if (err) {
              console.error('Update Password Error:', err);
              return res.status(500).json({ success: false, message: 'Interal Server Error, Please Try Again Later!' });
          }

          // Delete the used reset token
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

  // Recording click events
  connection.query('INSERT INTO ClickEvent (`key`) VALUES (?)', [key], (err) => {
    if (err) {
      console.error('Error inserting click event into the database:', err.stack);
    }

    // Display a clicked page
    res.sendFile(path.join(__dirname, '../../public', 'ClickRecorded.html'));
  });
};

const markEmailEventAsCompleted = (req, res) => {
  const { ID } = req.params;

  connection.query('UPDATE MailEvent SET Status = 1 WHERE ID = ?', [ID], (err) => {
    if (err) {
      console.error('Error updating mail event status:', err);
      return res.status(500).send('Error updating mail event status');
    }
    res.send('Mail event status updated successfully!');
  });
}
  

module.exports = { sendMailHandler, verifyCaptcha, verifyCaptcha2, resetPassword, generateLink, clickLinkHandler, markEmailEventAsCompleted };
