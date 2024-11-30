const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

const fs = require('fs');
const csv = require('csv-parser');
const crypto = require('crypto');

// Function to check if Email exists
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

// Read CSV file and insert data
const readCSVAndInsertUsers = (filePath, connection, callback) => {
  const users = new Map(); // Used to store user data, the key is Email and the value is user data object
  const duplicateEmails = new Set(); // Used to store duplicate Emails in CSV files

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

      // Handling duplicate emails in CSV files
      duplicateEmails.forEach(email => {
        console.log(`Repeat email in CSV: ${email}`);
      });

      // Check if the same email exists in the database and insert a new user
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

            const query = 'INSERT INTO User (Email, Name, Role, Salt, HashedPW, JoinDate, Education, ITLevel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            connection.query(query, [user.email, user.name, user.role, salt, hashedPW, user.JoinDate, user.Education, user.ITLevel], (err) => {
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
  const { email, name, password, role } = req.body;

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

      const query = 'INSERT INTO User (Email, Name, Role, Salt, HashedPW) VALUES (?, ?, ?, ?, ?)';
      connection.query(query, [email, name, role, salt, hashedPW], (err) => {
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
    const query = 'SELECT UserID, Email, Name, Role, JoinDate, Education, ITLevel FROM User;';
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
    const UserID = req.body.UserID;
    const selfID = req.user.id;

    if (!UserID) {
      return res.status(400).send('UserID is required');
    }

    if (UserID == selfID) {
      return res.status(400).send('Cannot delete yourself');
    } else {
      const query = 'DELETE FROM User WHERE UserID = ?';
      connection.query(query, [UserID], (err, results) => {
          if (err) {
              console.error('Error querying the database:', err.stack);
              return res.status(500).send('Internal server error');
          }
          res.json({ success: true, message: 'User deleted successfully'});
      });
    }
}

const updateUser = (req, res) => {
    const UserID = req.params.UserID;

    if (!UserID) {
      return res.status(400).send('UserID is required');
    }

    const { Email, Name, Role, JoinDate, Education, ITLevel } = req.body;
    if (!Email || !Name || !Role || !JoinDate || !Education || !ITLevel) {
      return res.status(400).send('Email, Name, Role, JoinDate, Education and ITLEvel are required');
    }

    const query = 'UPDATE User SET Email = ?, Name = ?, Role = ?, JoinDate = ?, Education = ?, ITLevel = ? WHERE UserID = ?';
    connection.query(query, [Email, Name, Role, JoinDate, Education, ITLevel, UserID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json({ success: true, message: 'User updated successfully'});
    });
}

// Read and insert users
// readCSVAndInsertUsers('user-import.csv');

module.exports = { addUsers, addUser: register, getUserInfo, getUsers, deleteUser, updateUser };