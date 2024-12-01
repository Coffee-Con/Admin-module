const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

const getClicks = (req, res) => {
  const query = `
    SELECT 
        ce.time, 
        ck.Email, 
        u.Name
    FROM 
        ClickEvent ce
    JOIN 
        ClickKey ck ON ce.key = ck.key
    JOIN 
        User u ON ck.Email = u.Email;
  `;

  connection.query(query, (error, results) => {
    if (error) {
      return res.status(500).send('Database query error');
    }
    res.json(results);});
};

const getClicksRisk = (req, res) => {
  const query = `
    SELECT COUNT(DISTINCT ce.key) AS click_count_last_month
    FROM ClickEvent ce
    JOIN ClickKey ck ON ce.key = ck.key
    WHERE ce.time >= NOW() - INTERVAL 1 MONTH;
  `;

  connection.query(query, (error, results) => {
    if (error) {
      return res.status(500).send('Database query error');
    }
    res.json(results);});
}

// Get all email events
const getAllEmailEvents = (req, res) => {
  connection.query('SELECT * FROM MailEvent ORDER BY ID DESC', (err, results) => {
    if (err) {
      console.error('Error querying the database:', err.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
}

const getNameByEmail = (req, res) => {
  const email = req.query.email;
  connection.query('SELECT Name FROM User WHERE `Email` = ?', [email], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length > 0) {
      res.json({ Name: results[0].Name });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
}

const getIfClicked = (req, res) => {
  const key = req.params.Key;
  connection.query('SELECT * FROM ClickEvent WHERE `key` = ?', [key], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length > 0) {
      res.json({ clicked: true });
    } else {
      res.json({ clicked: false });
    }
  });
}

module.exports = { getClicks, getClicksRisk, getAllEmailEvents, getNameByEmail, getIfClicked };