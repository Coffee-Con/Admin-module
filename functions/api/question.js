// 导入数据库配置
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

// API to create a new question
const createQuestion = (req, res) => {
    const { type, topic, answers } = req.body;

    // Validate required fields
    if (!type || !topic || !Array.isArray(answers)) {
        console.log('Error: Invalid input data.');
        return res.status(400).json({ error: 'Invalid input data.' });
    }

    const query = 'INSERT INTO `Question` (Question, QuestionType, Answer) VALUES (?, ?, ?);';
    connection.query(query, [topic, type, JSON.stringify(answers)], (err, results) => {
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

        if (results.length > 0) {
            const question = results[0];
            
            // 初始化空数组用于存放答案文本
            let answersList = [];
    
            try {
                // 检查 Answer 是否为字符串类型，否则转换为 JSON 字符串
                let answerData = question.Answer;
                if (typeof answerData !== 'string') {
                    answerData = JSON.stringify(answerData); // 将对象转换为 JSON 字符串
                }
    
                // 解析 Answer 字段
                const answers = JSON.parse(answerData);
    
                // 提取 text 字段生成 list<string>
                if (Array.isArray(answers)) {
                    answersList = answers.map(answer => answer.text);
                }
            } catch (parseError) {
                console.error('Error parsing Answer JSON:', parseError);
            }    
    
            // 返回问题和答案列表，不包含正确性信息
            res.json({
                QuestionID: question.QuestionID,
                QuestionType: question.QuestionType,
                Question: question.Question,
                Answer: answersList, // 如果为空，返回 []
            });
        }
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
        
        // Initialize an array to store formatted questions
        const formattedQuestions = results.map((question) => {
            // Initialize an empty array to store answer texts
            let answersList = [];

            try {
                // Check if Answer is a string; if not, convert it to a JSON string
                let answerData = question.Answer;
                if (typeof answerData !== 'string') {
                    answerData = JSON.stringify(answerData); // Convert object to JSON string
                }

                // Parse the Answer field
                const answers = JSON.parse(answerData);

                // Extract the text field to generate a list of strings
                if (Array.isArray(answers)) {
                    answersList = answers.map(answer => answer.text);
                }
            } catch (parseError) {
                console.error('Error parsing Answer JSON:', parseError);
            }

            // Return the formatted question object
            return {
                QuestionID: question.QuestionID,
                QuestionType: question.QuestionType,
                Question: question.Question,
                Answer: answersList, // Return [] if parsing fails or no answers found
            };
        });

        // Send the formatted questions as a response
        res.json(formattedQuestions);
    });
};

// Delete a question
const deleteQuestion = (req, res) => {
    const { QuestionID } = req.params;

    const query = 'DELETE FROM Question WHERE QuestionID = ?;'
    connection.query(query, [QuestionID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json({ success: true });
    });
}

// Get all questions
const getAllQuestions = (req, res) => {
    const query = 'SELECT * FROM COMP.Question;';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
}

const updateQuestion = (req, res) => {
    const { QuestionID, type, topic, answers } = req.body;

    // Validate required fields
    if (!QuestionID || !type || !topic || !Array.isArray(answers)) {
        console.log('Error: Invalid input data.');
        return res.status(400).json({ error: 'Invalid input data.' });
    }

    const query = 'UPDATE `Question` SET Question = ?, QuestionType = ?, Answer = ? WHERE QuestionID = ?;';
    connection.query(query, [topic, type, JSON.stringify(answers), QuestionID], (err, results) => {
        console.log('Query:', query);
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Question updated with ID:', QuestionID);
        res.json({ success: true, id: QuestionID });
    });
}

// 导出API
module.exports = { createQuestion, getQuizQuestions, getQuestion, getQuestions, deleteQuestion, getAllQuestions, updateQuestion };