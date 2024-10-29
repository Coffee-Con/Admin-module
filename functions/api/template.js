const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

const deleteTemplate = (req, res) => {
    const templateId = req.params.id;
    const query = 'DELETE FROM templates WHERE id = ?;';
    connection.query(query, [templateId], (err, results) => {
      if (err) {
        console.error('Error removing member:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
  });
};

module.exports = { deleteTemplate };