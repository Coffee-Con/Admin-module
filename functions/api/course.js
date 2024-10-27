// 导入数据库配置
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

// 获取所有课程
function getAllCourses(req, res) {
    const query = 'SELECT * FROM Course';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
}

// 获取对应用户的课程
function getUserCourses(req, res) {
    const userID = req.user.id;
    const query = `
        SELECT c.*
        FROM Course c
        JOIN Course_User cu ON c.CourseID = cu.CourseID
        WHERE cu.UserID = ?;
    `;
    connection.query(query, [userID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
}

module.exports = { getAllCourses, getUserCourses };