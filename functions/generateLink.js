const crypto = require('crypto');
const mysql = require('mysql2');
const dbConfig = require('./dbConfig');
require('dotenv').config();

const connection = mysql.createConnection(dbConfig);
const port = process.env.PORT || 5001;

const generateLink = (email) => {
  return new Promise((resolve, reject) => {
    console.log('Email:', email);
    const key = crypto.randomBytes(16).toString('hex');
    console.log('Key:', key);

    connection.query('SELECT UserID FROM user WHERE (`Email`) = (?)', [email], (err, results) => {
      if (err) {
        console.error('Error querying the database:', err.stack);
        reject('Internal server error');
        return;
      }

      const userId = results.length > 0 ? results[0].UserID : 0;
      console.log('User ID:', userId);

      connection.query('INSERT INTO click_key (`key`, `userid`) VALUES (?, ?)', [key, userId], (err) => {
        if (err) {
          console.error('Error inserting key into the database:', err.stack);
          reject('Internal server error');
          return;
        }

        const link = `http://localhost:${port}/click/${key}`;
        resolve(link);
      });
    });
  });
};

module.exports = { generateLink };
