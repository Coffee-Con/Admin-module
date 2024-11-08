const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

const getClicks = (req, res) => {
  const query = `
    SELECT ce.time, u.Name, u.Email
    FROM click_event ce
    JOIN click_key ck ON ce.key = ck.key
    JOIN user u ON ck.userid = u.UserID
    ORDER BY ce.time DESC;
  `;

  connection.query(query, (error, results) => {
    if (error) {
      return res.status(500).send('Database query error');
    }
    res.json(results);});
};

const getClicksRisk = (req, res) => {
  const query = `
    SELECT COUNT(*) AS click_count_last_month
    FROM click_event
    WHERE time >= NOW() - INTERVAL 1 MONTH;
  `;

  connection.query(query, (error, results) => {
    if (error) {
      return res.status(500).send('Database query error');
    }
    res.json(results);});
}

module.exports = { getClicks, getClicksRisk };