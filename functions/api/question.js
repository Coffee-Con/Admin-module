// 导入数据库配置
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

// API to create a new question
const createQuestion = (req, res) => {
    const { type, topic, answers, correctAnswers } = req.body;

    // Validate required fields
    if (!type || !topic || !Array.isArray(answers) || !Array.isArray(correctAnswers)) {
        console.log('Error: Invalid input data.');
        return res.status(400).json({ error: 'Invalid input data.' });
    }

    const query = 'INSERT INTO `Question` (Question, QuestionType, Answer, CorrectAnswer) VALUES (?, ?, ?, ?);';
    connection.query(query, [topic, type, JSON.stringify(answers), JSON.stringify(correctAnswers)], (err, results) => {
        console.log('Query:', query);
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Question created with ID:', results.insertId);
        res.json({ success: true, id: results.insertId });
    });
};

module.exports = { createQuestion };