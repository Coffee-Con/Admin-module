const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const crypto = require('crypto');

app.get('/click-events-history', (req, res) => {
  const query = `
    SELECT ce.time, u.Name, u.Email
    FROM ClickEvent ce
    JOIN ClickKey ck ON ce.key = ck.key
    JOIN User u ON ck.userid = u.UserID
    ORDER BY ce.time DESC;
  `;

  connection.query(query, (error, results) => {
    if (error) {
      return res.status(500).send('Database query error');
    }
  });
});
