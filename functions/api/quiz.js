// 导入数据库配置
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

// 获取所有Quiz
function getAllQuizzes(req, res) {
    const query = 'SELECT * FROM Quiz';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
}

// API to create a new quiz
const createQuiz = (req, res) => {
    const { QuizName, QuizDescription } = req.body;

    if (!QuizName) {
        console.log('Error: Crouse Name is required.'); // Debugging line
        return res.status(400).json({ error: 'Crouse Name is required.' });
    }

    const query = 'INSERT INTO `Quiz` (QuizName, QuizDescription) VALUES (?, ?);';
    connection.query(query, [QuizName, QuizDescription], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err); // Log the error
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Quiz created with ID:', results.insertId); // Debugging line
        res.json({ success: true, id: results.insertId });
    });
};

// API to delete a quiz
const deleteQuiz = (req, res) => {
    const { QuizID } = req.params;
    if (!QuizID) {
        console.log('Error: Quiz ID is required.'); // Debugging line
        return res.status(400).json({ error: 'Quiz ID is required.' });
    }

    const query = 'DELETE FROM `Quiz` WHERE QuizID = ?;';
    connection.query(query, [QuizID], (err, results) => {
        if (err) {
            console.error('Error deleting quiz:', err); // Log the error
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.affectedRows === 0) {
            console.log('No quiz found with that ID.'); // Debugging line
            return res.status(404).json({ error: 'Quiz not found' });
        }
        console.log('Quiz deleted with ID:', QuizID); // Debugging line
        res.json({ success: true, message: 'Quiz deleted successfully' });
    });
};

// API to update a quiz
const updateQuiz = (req, res) => {
    const { QuizID } = req.params;
    const { QuizName, QuizDescription } = req.body;

    if (!QuizID) {
        console.log('Error: Quiz ID is required.'); // Debugging line
        return res.status(400).json({ error: 'Quiz ID is required.' });
    }

    if (!QuizName) {
        console.log('Error: Quiz Name is required.'); // Debugging line
        return res.status(400).json({ error: 'Quiz Name is required.' });
    }

    const query = 'UPDATE `Quiz` SET QuizName = ?, QuizDescription = ? WHERE QuizID = ?;';
    connection.query(query, [QuizName, QuizDescription, QuizID], (err, results) => {
        if (err) {
            console.error('Error updating quiz:', err); // Log the error
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.affectedRows === 0) {
            console.log('No quiz found with that ID.'); // Debugging line
            return res.status(404).json({ error: 'Quiz not found' });
        }
        console.log('Quiz updated with ID:', QuizID); // Debugging line
        res.json({ success: true, message: 'Quiz updated successfully' });
    });
};

const getQuiz = (req, res) => {
    const { QuizID } = req.params;
    if (!QuizID) {
        console.log('Error: Quiz ID is required.'); // Debugging line
        return res.status(400).json({ error: 'Quiz ID is required.' });
    }

    const query = 'SELECT * FROM `Quiz` WHERE QuizID = ?;';
    connection.query(query, [QuizID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        if (results.length === 0) {
            console.log('No quiz found with that ID.'); // Debugging line
            return res.status(404).json({ error: 'Quiz not found' });
        }
        res.json(results[0]);
    });
};

// API to get all quizzes for a course
const getCourseQuizzes = (req, res) => {
    const { CourseID } = req.params;
    if (!CourseID) {
        console.log('Error: Course ID is required.'); // Debugging line
        return res.status(400).json({ error: 'Course ID is required.' });
    }

    const query = 'SELECT * FROM `QuizCourse` JOIN `Quiz` WHERE CourseID = ?;';
    connection.query(query, [CourseID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
};

// API to get all quizzes not in a course
const getQuizzesNotInCourse = (req, res) => {
    const { CourseID } = req.params;
    if (!CourseID) {
        console.log('Error: Course ID is required.'); // Debugging line
        return res.status(400).json({ error: 'Course ID is required.' });
    }

    const query = 'SELECT * FROM `Quiz` WHERE QuizID NOT IN (SELECT QuizID FROM `QuizCourse` WHERE CourseID = ?);';
    connection.query(query, [CourseID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
};

// Add quiz to course
const addQuizToCourse = (req, res) => {
    const { CourseID, QuizID } = req.body;
    if (!CourseID || !QuizID) {
        console.log('Error: Course ID and Quiz ID are required.'); // Debugging line
        return res.status(400).json({ error: 'Course ID and Quiz ID are required.' });
    }

    const query = 'INSERT INTO `QuizCourse` (CourseID, QuizID) VALUES (?, ?);';
    connection.query(query, [CourseID, QuizID], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err); // Log the error
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Quiz added to course success.'); // Debugging line
        res.json({ success: true });
    });
};

// remove quiz from course
const removeQuizFromCourse = (req, res) => {
    const { CourseID, QuizID } = req.body;
    if (!CourseID || !QuizID) {
        console.log('Error: Course ID and Quiz ID are required.'); // Debugging line
        return res.status(400).json({ error: 'Course ID and Quiz ID are required.' });
    }

    const query = 'DELETE FROM `QuizCourse` WHERE CourseID = ? AND QuizID = ?;';
    connection.query(query, [CourseID, QuizID], (err, results) => {
        if (err) {
            console.error('Error deleting quiz from course:', err); // Log the error
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.affectedRows === 0) {
            console.log('No quiz found with that ID.'); // Debugging line
            return res.status(404).json({ error: 'Quiz not found' });
        }
        console.log('Quiz removed from course with ID:', QuizID); // Debugging line
        res.json({ success: true, message: 'Quiz removed from course successfully' });
    });
};

// 获取用户未完成的所有quiz（对应课程）
function getUserCourseQuizzes(req, res) {
    console.log('Getting user course quizzes');
    const userID = req.user.id;
    const { CourseID } = req.params;
    console.log('CourseID:', CourseID);
    const query = `
        SELECT DISTINCT * 
        FROM QuizCourse 
        JOIN Quiz 
        ON QuizCourse.QuizID = Quiz.QuizID
        WHERE CourseID = ?;
    `;
    connection.query(query, [userID, CourseID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }
        res.json(results);
    });
}

// For user submit quiz 
const addQuizAnswer = (req, res) => {
    const { userid, quizid, answer } = req.body;

    if (!userid || !quizid || !answer) {
        console.log('Error: User ID, Quiz ID, and Answer are required.');
        return res.status(400).json({ error: 'User ID, Quiz ID, and Answer are required.' });
    }

    const query = 'INSERT INTO `userquizanswer` (UserID, QuizID, Answer) VALUES (?, ?, ?);';

    // Convert answer object to JSON string format
    const answerJson = JSON.stringify(answer);

    connection.query(query, [userid, quizid, answerJson], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        console.log('Quiz answer inserted successfully.');
        res.json({ success: true });
    });
};

// calculate User Score
const calculateUserScore = (req, res) => {
    const { UserID, QuizID } = req.params;

    // 查询用户的答案
    const userAnswerQuery = 'SELECT Answer FROM userquizanswer WHERE UserID = ? AND QuizID = ?';
    // 查询正确答案
    const correctAnswerQuery = 'SELECT CorrectAnswer FROM correctanswers WHERE QuizID = ?';

    connection.query(userAnswerQuery, [UserID, QuizID], (userErr, userResults) => {
        if (userErr) {
            console.error('Error querying user answers:', userErr.stack);
            res.status(500).send('Internal server error');
            return;
        }

        if (userResults.length === 0) {
            res.status(404).json({ error: 'User answers not found' });
            return;
        }

        // 解析用户的答案
        let userAnswersList;
        try {
            userAnswersList = JSON.parse(userResults[0].Answer);
        } catch (parseError) {
            console.error('Error parsing user Answer JSON:', parseError);
            res.status(500).send('Error parsing user answers');
            return;
        }

        connection.query(correctAnswerQuery, [QuizID], (correctErr, correctResults) => {
            if (correctErr) {
                console.error('Error querying correct answers:', correctErr.stack);
                res.status(500).send('Internal server error');
                return;
            }

            if (correctResults.length === 0) {
                res.status(404).json({ error: 'Correct answers not found' });
                return;
            }

            // 解析正确答案
            let correctAnswersList;
            try {
                correctAnswersList = JSON.parse(correctResults[0].CorrectAnswer);
            } catch (parseError) {
                console.error('Error parsing correct Answer JSON:', parseError);
                res.status(500).send('Error parsing correct answers');
                return;
            }

            // 计算分数
            let score = 0;
            userAnswersList.forEach((userAnswer) => {
                const correctAnswer = correctAnswersList.find(ca => ca.questionid === userAnswer.questionid);
                if (correctAnswer && correctAnswer.answer === userAnswer.answer) {
                    score += 1;
                }
            });

            // 返回用户的总得分
            res.json({
                UserID,
                QuizID,
                Score: score
            });
        });
    });
};


module.exports = { createQuiz, deleteQuiz, updateQuiz, getAllQuizzes, getQuiz, getCourseQuizzes, getQuizzesNotInCourse, addQuizToCourse, removeQuizFromCourse, getUserCourseQuizzes, addQuizAnswer, calculateUserScore };