// 导入数据库配置
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

function getUserInfo(req, res) {
    if (req.user.id != null) {
        const query = 'SELECT * FROM user WHERE UserID = ?';
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

module.exports = { getUserInfo };
