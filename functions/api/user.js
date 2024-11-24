const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

const fs = require('fs');
const csv = require('csv-parser');
const crypto = require('crypto');

// 检查Email是否存在的函数
const checkEmailExists = (email, connection, callback) => {
  const query = 'SELECT COUNT(*) AS count FROM User WHERE Email = ?';
  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error checking email:', err.stack);
      callback(err, null);
      return;
    }
    const count = results[0].count;
    callback(null, count > 0);
  });
};

// 读取CSV文件并插入数据
const readCSVAndInsertUsers = (filePath, connection, callback) => {
  const users = new Map(); // 用于存储用户数据，键为Email，值为用户数据对象
  const duplicateEmails = new Set(); // 用于存储CSV文件中重复的Email

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const email = row.Email;
      if (users.has(email)) {
        duplicateEmails.add(email);
      } else {
        users.set(email, {
          name: row.Name,
          email: row.Email,
          password: row.Password,
          role: parseInt(row.Role, 10),
          user: row.Email,
          JoinDate: row.JoinDate,
          Education: row.Education,
          ITLevel: row.ITLevel,
        });
      }
    })
    .on('end', () => {
      console.log('CSV file successfully processed.');

      // 处理CSV文件中的重复Email
      duplicateEmails.forEach(email => {
        console.log(`Repeat email in CSV: ${email}`);
      });

      // 检查数据库中是否存在相同的Email并插入新用户
      let processedCount = 0;
      let totalUsers = users.size;
      let hasError = false;

      if (totalUsers === 0) {
        // No users to process
        return callback(null, 'No users found in the CSV file.');
      }

      users.forEach(user => {
        checkEmailExists(user.email, connection, (err, exists) => {
          if (err) {
            console.error('Error during email existence check:', err);
            hasError = true;
            return;
          }

          if (exists) {
            console.log(`Repeat email in database: ${user.email}`);
          } else {
            const salt = crypto.randomBytes(16).toString('hex');
            const hashedPW = crypto.createHash('md5').update(user.password + salt).digest('hex');

            const query = 'INSERT INTO User (User, Email, Name, Role, Salt, HashedPW, JoinDate, Education, ITLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            connection.query(query, [user.user, user.email, user.name, user.role, salt, hashedPW, user.JoinDate, user.Education, user.ITLevel], (err) => {
              if (err) {
                console.error('Error inserting data:', err.stack);
                hasError = true;
                return;
              }
              console.log('Inserted user:', user.email);
            });
          }

          processedCount++;
          if (processedCount === totalUsers) {
            callback(null, 'Users added successfully!');
            /*
            connection.end((err) => {
              if (err) {
                console.error('Error ending the connection:', err.stack);
                return callback(err, null);
              }
              console.log('Connection closed.');
              if (hasError) {
                return callback('Some errors occurred during processing.');
              }
              callback(null, 'Users added successfully!');
            });*/
          }
        });
      });
    })
    .on('error', (err) => {
      console.error('Error reading CSV file:', err);
      callback(err, null);
    });
};

// Register a new user
const register = (req, res) => {
  const { user, email, name, password, role } = req.body;

  // Password strength regular expression: at least 8 characters, including uppercase letters, lowercase letters, numbers, and special characters
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).send('The password must contain uppercase letters, lowercase letters, numbers, special characters and be at least 8 characters long.');
  }

  // Check if the mailbox already exists
  checkEmailExists(email, connection, (err, exists) => {
    if (err) {
      console.error('Error during email existence check:', err);
      return res.status(500).send('Server error');
    }

    if (exists) {
      return res.status(400).send('Email already registered');
    } else {
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPW = crypto.createHash('md5').update(password + salt).digest('hex');

      const query = 'INSERT INTO User (User, Email, Name, Role, Salt, HashedPW) VALUES (?, ?, ?, ?, ?, ?)';
      connection.query(query, [user, email, name, role, salt, hashedPW], (err) => {
        if (err) {
          console.error('Error inserting data:', err.stack);
          return res.status(500).send('Error inserting data');
        }
        console.log('Inserted user:', email);
        res.json({ success: true });
      });
    }
  });
};

const addUsers = (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // console.log('File uploaded:', req.file);

  const filePath = req.file.path;

  // Use the Add_User_by_csv.js script
  readCSVAndInsertUsers(filePath, connection, (err, result) => {
    if (err) {
      console.error('Error adding users:', err);
      return res.status(500).send('Error adding users.');
    }
    // res.send('Users added successfully!');
    res.send(result);
  });
};

function getUserInfo(req, res) {
  if (req.user.id != null) {
      const query = 'SELECT * FROM User WHERE UserID = ?';
      connection.query(query, [req.user.id], (err, results) => {
          if (err) {
              console.error('Error querying the database:', err.stack);
              res.status(500).send('Internal server error');
              return;
          }
          if (results.length === 0) {
              res.status(404).send('User not found');
              return;
          }
          const user = results[0];
          res.json(user);
      });
  } else {
      res.status(401).send('Unauthorized');
  }
}

const getUsers = (req, res) => {
    const query = 'SELECT UserID, Email, Name, Role FROM User;';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
}

const deleteUser = (req, res) => {
    const userID = req.params.userID;
    const query = 'DELETE FROM User WHERE UserID = ?';
    connection.query(query, [userID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json({ success: true, message: 'User deleted successfully'});
    });
}

const updateUser = (req, res) => {
    const userID = req.params.userID;
    const { email, name, role } = req.body;
    const query = 'UPDATE User SET Email = ?, Name = ?, Role = ? WHERE UserID = ?';
    connection.query(query, [email, name, role, userID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json({ success: true, message: 'User updated successfully'});
    });
}

// 读取并插入用户
// readCSVAndInsertUsers('user-import.csv');
module.exports = { addUsers, addUser: register, getUserInfo, getUsers, deleteUser, updateUser };