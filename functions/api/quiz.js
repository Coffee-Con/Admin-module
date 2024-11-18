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
        // console.log('Quiz created with ID:', results.insertId); // Debugging line
        res.status(200).json({ success: true, id: results.insertId });
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
            // console.log('No quiz found with that ID.'); // Debugging line
            return res.status(404).json({ error: 'Quiz not found' });
        }
        // console.log('Quiz deleted with ID:', QuizID); // Debugging line
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

    const query = 'SELECT * FROM `QuizCourse` JOIN `Quiz` ON `QuizCourse`.`QuizID` = `Quiz`.`QuizID` WHERE `QuizCourse`.`CourseID` = ?;';
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
        res.json({ success: true, message: 'Quiz removed from course successfully' });
    });
};

// 获取用户的所有quiz（对应课程）
const getUserCourseQuizzes = (req, res) => {
    const userID = req.user.id;
    const { CourseID } = req.params;

    if (!CourseID || !userID) {
        return res.status(400).json({ error: 'Course ID and User ID are required.' });
    }

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

const getUserUnCompletedQuizzes = (req, res) => {
    const { UserID, CourseID } = req.params;

    if (!UserID) {
        // console.log('Error: User ID is required.');
        return res.status(400).json({ error: 'User ID is required.' });
    }

    // Base query to get uncompleted quizzes for a user
    let query = `
        SELECT DISTINCT q.* 
        FROM Quiz q
        LEFT JOIN UserQuizStatus uqs ON q.QuizID = uqs.QuizID AND uqs.UserID = ?
        WHERE uqs.StatusID IS NULL OR uqs.StatusID != 2
    `;
    
    // If CourseID is provided, add it as a condition to filter quizzes by course
    if (CourseID) {
        query = `
            SELECT DISTINCT q.* 
            FROM QuizCourse qc
            JOIN Quiz q ON qc.QuizID = q.QuizID
            LEFT JOIN UserQuizStatus uqs ON q.QuizID = uqs.QuizID AND uqs.UserID = ?
            WHERE qc.CourseID = ? AND (uqs.StatusID IS NULL OR uqs.StatusID != 2);
        `;
    }

    // Execute the query
    connection.query(query, CourseID ? [UserID, CourseID] : [UserID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            return res.status(500).send('Internal server error');
        }
        res.json(results);
    });
}

const getUserCompletedQuizzes = (req, res) => {
    const { UserID, CourseID } = req.params;

    if (!UserID) {
        // console.log('Error: User ID is required.');
        return res.status(400).json({ error: 'User ID is required.' });
    }

    // Base query to get uncompleted quizzes for a user
    let query = `
        SELECT DISTINCT q.* 
        FROM Quiz q
        LEFT JOIN UserQuizStatus uqs ON q.QuizID = uqs.QuizID AND uqs.UserID = ?
        WHERE uqs.StatusID = 2;
    `;
    
    // If CourseID is provided, add it as a condition to filter quizzes by course
    if (CourseID) {
        query = `
            SELECT DISTINCT q.* 
            FROM QuizCourse qc
            JOIN Quiz q ON qc.QuizID = q.QuizID
            LEFT JOIN UserQuizStatus uqs ON q.QuizID = uqs.QuizID AND uqs.UserID = ?
            WHERE qc.CourseID = ? AND uqs.StatusID = 2;
        `;
    }

    // Execute the query
    connection.query(query, CourseID ? [UserID, CourseID] : [UserID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            return res.status(500).send('Internal server error');
        }
        res.json(results);
    });
}


// For user submit quiz 
const addUserQuizAnswer = async (req, res) => {
    const { UserID, QuizID, Answer } = req.body;

    if (!UserID || !QuizID || !Answer) {
        console.log('Error: User ID, Quiz ID, and Answer are required.');
        return res.status(400).json({ error: 'User ID, Quiz ID, and Answer are required.' });
    }

    const query = 'INSERT INTO `UserQuizAnswer` (UserID, QuizID, Answer) VALUES (?, ?, ?);';

    // Convert answer object to JSON string format
    const AnswerJson = JSON.stringify(Answer);

    try {
        await new Promise((resolve, reject) => {
            connection.query(query, [UserID, QuizID, AnswerJson], (err, results) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    return reject('Database error');
                }
                resolve(results);
            });
        });

        // 使用 await 等待标记 Quiz 为已完成
        const statusResult = await markQuizAsCompleted(req);
        if (statusResult?.message) {
            console.log(statusResult.message);
        }

        // 使用 await 等待分数计算并返回结果
        const scoreResult = await addUserQuizScore(req);
        res.json(scoreResult);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// For after user submit quiz, add the score to the database
const addUserQuizScore = (req, res) => {
    return new Promise((resolve, reject) => {
        const { UserID, QuizID, Answer } = req.body;
    
        if (!UserID || !QuizID || !Answer || !Array.isArray(Answer)) {
            console.log('Error: User ID, Quiz ID, and Answer array are required.');
            return res.status(400).json({ error: 'User ID, Quiz ID, and Answer array are required.' });
        }

        /*
        // 查询数据库中是否已经存在该用户对该 Quiz 的答题记录，如果存在则不再重复计算分数，直接返回错误
        const query = 'SELECT * FROM `UserQuizScore` WHERE UserID = ? AND QuizID = ?;';
        connection.query(query, [UserID, QuizID], (err, results) => {
            if (err) {
                console.error('Error querying the database:', err.stack);
                return res.status(500).send('Internal server error');
            }

            if (results.length > 0) {
                console.log('User already has a score for this quiz.');
                return res.status(400).json({ error: 'User already has a score for this quiz.' });
            }
        });
        */

        // 初始化总分和正确答题计数
        let totalScore = 0;
        let correctAnswersCount = 0;

        // 遍历用户提交的答案数组，逐题查询数据库以获取正确答案
        const checkAnswerPromises = Answer.map(({ QuestionID, Answer: userAnswer }) => {
            return new Promise((resolve, reject) => {
                // 查询数据库，获取指定 questionid 的正确答案
                const query = 'SELECT Answer, QuestionType FROM `Question` WHERE QuestionID = ?;';
                connection.query(query, [QuestionID], (err, results) => {
                    if (err) {
                        console.error('Error querying the database:', err.stack);
                        return reject('Internal server error');
                    }

                    if (results.length === 0) {
                        console.log(`No question found for QuestionID: ${QuestionID}`);
                        return resolve(false);
                    }

                    // 解析数据库中的正确答案
                    const answerData = results[0].Answer;
                    const questionType = results[0].QuestionType;

                    // 提取正确答案列表
                    const correctAnswers = answerData
                        .filter((option) => option.correct)
                        .map((option) => option.text);

                    // 判断用户答案是否正确
                    let isCorrect = false;
                    if (questionType === 2) { // 填空题
                        // 填空题：用户答案匹配任意一个正确答案
                        isCorrect = correctAnswers.includes(userAnswer);
                    } else if (questionType === 1) { // 选择题
                        // 选择题：用户答案与正确答案匹配
                        isCorrect = correctAnswers.includes(userAnswer);
                    }

                    // 统计正确答案的数量
                    if (isCorrect) {
                        correctAnswersCount += 1;
                    }

                    resolve(true);
                });
            });
        });

        // 使用 Promise.all 处理所有答题结果
        Promise.all(checkAnswerPromises)
            .then(() => {
                // 计算总分
                totalScore = Math.round((correctAnswersCount / Answer.length) * 100);

                // 插入用户分数到 UserQuizScore 表
                const insertQuery = 'INSERT INTO `UserQuizScore` (UserID, QuizID, Score) VALUES (?, ?, ?);';
                connection.query(insertQuery, [UserID, QuizID, totalScore], (err, results) => {
                    if (err) {
                        console.error('Error inserting score into the database:', err.stack);
                        return res.status(500).send('Internal server error');
                    }
                    const insertedId = results.insertId;
                    resolve({ ID: insertedId, UserID, QuizID, Score: totalScore });
                });
            })
            .catch((error) => reject(error));
        });
};

// Mark as completed
const markQuizAsCompleted = (req) => {
    return new Promise((resolve, reject) => {
        const { UserID, QuizID } = req.body;

        // 查询是否已经存在
        const query1 = 'SELECT * FROM `UserQuizStatus` WHERE UserID = ? AND QuizID = ?;';
        connection.query(query1, [UserID, QuizID], (err, results) => {
            if (err) {
                console.error('Error querying the database:', err.stack);
                return reject('Internal server error');
            }

            if (results.length > 0) {
                console.log('User already completed.');
                return resolve({ message: 'User already completed.' });
            }

            // 插入已完成状态
            const query2 = 'INSERT INTO `UserQuizStatus` (UserID, QuizID, StatusID) VALUES (?, ?, 2);';
            connection.query(query2, [UserID, QuizID], (err, results) => {
                if (err) {
                    console.error('Error inserting data:', err);
                    return reject('Database error');
                }
                resolve({ success: true });
            });
        });
    });
};

// Get user quiz socre
const getUserQuizScores = (req, res) => {
    const { UserID, QuizID } = req.params;

    if (!UserID || !QuizID) {
        console.log('Error: User ID and Quiz ID are required.');
        return res.status(400).json({ error: 'User ID and Quiz ID are required.' });
    }

    const query = 'SELECT ID, Score, SubmitTime FROM `UserQuizScore` WHERE UserID = ? AND QuizID = ?;';
    connection.query(query, [UserID, QuizID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }

        if (results.length === 0) {
            console.log('No quiz found with that ID.');
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.json(results);
    });
}

const getUserQuizScore = (req, res) => {
    const { UserID, QuizID, ID } = req.params;

    if (!UserID || !QuizID || !ID) {
        console.log('Error: User ID, Quiz ID, and ID are required.');
        return res.status(400).json({ error: 'User ID, Quiz ID, and SubmitID are required.' });
    }

    const query = 'SELECT ID, Score, SubmitTime FROM `UserQuizScore` WHERE UserID = ? AND QuizID = ? AND ID = ?;';
    connection.query(query, [UserID, QuizID, ID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }

        if (results.length === 0) {
            console.log('No quiz found with that ID.');
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.json(results);
    });
}

// save user quiz answer to database (every question)
const saveUserQuizQuestionAnswer = (req, res) => {
    const { UserID, QuizID, QuestionID, Answer } = req.body;

    if (!UserID || !QuizID || !QuestionID || !Answer) {
        console.log('Error: User ID, Quiz ID, Question ID, and Answer are required.');
        return res.status(400).json({ error: 'User ID, Quiz ID, Question ID, and Answer are required.' });
    }

    // 查询数据库中是否已经存在该用户对该 Question 的答题记录，如果有则更新，否则插入
    const query = 'SELECT * FROM `UserQuizQuestionAnswer` WHERE UserID = ? AND QuizID = ? AND QuestionID = ?;';

    connection.query(query, [UserID, QuizID, QuestionID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            return res.status(500).send('Internal server error');
        }

        if (results.length > 0) {
            // 更新用户答题记录
            const updateQuery = 'UPDATE `UserQuizQuestionAnswer` SET Answer = ? WHERE UserID = ? AND QuizID = ? AND QuestionID = ?;';
            connection.query(updateQuery, [Answer, UserID, QuizID, QuestionID], (err, results) => {
                if (err) {
                    console.error('Error updating user quiz answer:', err.stack);
                    return res.status(500).send('Internal server error');
                }
                res.json({ success: true, message: 'User quiz answer updated successfully' });
            });
        } else {
            // 插入用户答题记录
            const insertQuery = 'INSERT INTO `UserQuizQuestionAnswer` (UserID, QuizID, QuestionID, Answer) VALUES (?, ?, ?, ?);';
            connection.query(insertQuery, [UserID, QuizID, QuestionID, Answer], (err, results) => {
                if (err) {
                    console.error('Error inserting user quiz answer:', err.stack);
                    return res.status(500).send('Internal server error');
                }
                res.json({ success: true, message: 'User quiz answer saved successfully' });
            });
        }
    });
};

// get user quiz answer from database (every question verion)
const getUserQuizAnswers = (req, res) => {
    const { UserID, QuizID } = req.params;

    if (!UserID || !QuizID) {
        console.log('Error: User ID and Quiz ID are required.');
        return res.status(400).json({ error: 'User ID and Quiz ID are required.' });
    }

    const query = 'SELECT QuestionID, Answer FROM `UserQuizQuestionAnswer` WHERE UserID = ? AND QuizID = ?;';
    connection.query(query, [UserID, QuizID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            res.status(500).send('Internal server error');
            return;
        }

        if (results.length === 0) {
            console.log('No quiz found with that ID.');
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.json(results);
    });
}

// Rank the user's quiz score
const getLeaderboard = (req, res) => {
    const { QuizID } = req.params;
    const { CourseID } = req.params;

    if (!QuizID) {
        console.log('Error: Quiz ID is required.');
        return res.status(400).json({ error: 'Quiz ID is required.' });
    }

    // Base query to get leaderboard for a quiz
    let query = `
        SELECT uqs.UserID, uqs.Score, uqs.SubmitTime, u.FirstName, u.LastName
        FROM UserQuizScore uqs
        JOIN User u ON uqs.UserID = u.UserID
        WHERE uqs.QuizID = ?
        ORDER BY uqs.Score DESC, uqs.SubmitTime ASC;
    `;

    // If CourseID is provided, add it as a condition to filter quizzes by course
    if (CourseID) {
        query = `
            SELECT uqs.UserID, uqs.Score, uqs.SubmitTime, u.FirstName, u.LastName
            FROM UserQuizScore uqs
            JOIN User u ON uqs.UserID = u.UserID
            JOIN UserCourse uc ON u.UserID = uc.UserID
            WHERE uqs.QuizID = ? AND uc.CourseID = ?
            ORDER BY uqs.Score DESC, uqs.SubmitTime ASC;
        `;
    }

    // Execute the query
    connection.query(query, CourseID ? [QuizID, CourseID] : [QuizID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            return res.status(500).send('Internal server error');
        }
        res.json(results);
    });
};

module.exports = { createQuiz, deleteQuiz, updateQuiz, getAllQuizzes, getQuiz, getCourseQuizzes, getQuizzesNotInCourse, addQuizToCourse, removeQuizFromCourse, getUserCourseQuizzes, addUserQuizAnswer, addUserQuizScore, getUserQuizScores, getUserQuizScore, saveUserQuizQuestionAnswer, getUserQuizAnswers, getUserUnCompletedQuizzes, getUserCompletedQuizzes, getLeaderboard };