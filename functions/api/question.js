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

// API to get all questions for a quiz
const getQuizQuestions = (req, res) => {
    const { QuizID } = req.params;

    const query = 'SELECT DISTINCT * FROM QuizQuestion JOIN Quiz ON QuizQuestion.QuizID = Quiz.QuizID WHERE Quiz.QuizID = ?;';
    connection.query(query, [QuizID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
};

// API to get question details
const getQuestion = (req, res) => {
    const { QuestionID } = req.params;

    const query = 'SELECT * FROM Question WHERE QuestionID = ?;';
    connection.query(query, [QuestionID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
};

// API to get questions detail for a quiz
const getQuestions = (req, res) => {
    const { QuizID } = req.params;

    const query = `
        SELECT DISTINCT 
            Question.QuestionID AS QuestionID,
            Question.Question AS Question,
            Question.QuestionType AS QuestionType,
            Question.Answer AS Answer
        FROM QuizQuestion
        JOIN Quiz ON QuizQuestion.QuizID = Quiz.QuizID
        JOIN Question ON QuizQuestion.QuestionID = Question.QuestionID
        WHERE Quiz.QuizID = ?;
    `;
    connection.query(query, [QuizID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
};

// 导出API
module.exports = { createQuestion, getQuizQuestions, getQuestion, getQuestions };