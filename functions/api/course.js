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
        JOIN CourseUser cu ON c.CourseID = cu.CourseID
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

// API to create a new course
const createCourse = (req, res) => {
    const { CourseName, CourseDescription } = req.body;

    if (!CourseName) {
        console.log('Error: Crouse Name is required.'); // Debugging line
        return res.status(400).json({ error: 'Crouse Name is required.' });
    }

    const query = 'INSERT INTO `Course` (CourseName, CourseDescription) VALUES (?, ?);';
    connection.query(query, [CourseName, CourseDescription], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err); // Log the error
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Course created with ID:', results.insertId); // Debugging line
        res.json({ success: true, id: results.insertId });
    });
};

// API to delete a course
const deleteCourse = (req, res) => {
    const { CourseID } = req.params;
    if (!CourseID) {
        console.log('Error: Course ID is required.'); // Debugging line
        return res.status(400).json({ error: 'Course ID is required.' });
    }

    const query = 'DELETE FROM `Course` WHERE CourseID = ?;';
    connection.query(query, [CourseID], (err, results) => {
        if (err) {
            console.error('Error deleting course:', err); // Log the error
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.affectedRows === 0) {
            console.log('No course found with that ID.'); // Debugging line
            return res.status(404).json({ error: 'Course not found' });
        }
        console.log('Course deleted with ID:', CourseID); // Debugging line
        res.json({ success: true, message: 'Course deleted successfully' });
    });
};

// API to update a course
const updateCourse = (req, res) => {
    const { CourseID } = req.params;
    const { CourseName, CourseDescription } = req.body;

    if (!CourseID) {
        console.log('Error: Course ID is required.'); // Debugging line
        return res.status(400).json({ error: 'Course ID is required.' });
    }

    if (!CourseName) {
        console.log('Error: Course Name is required.'); // Debugging line
        return res.status(400).json({ error: 'Course Name is required.' });
    }

    const query = 'UPDATE `Course` SET CourseName = ?, CourseDescription = ? WHERE CourseID = ?;';
    connection.query(query, [CourseName, CourseDescription, CourseID], (err, results) => {
        if (err) {
            console.error('Error updating course:', err); // Log the error
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.affectedRows === 0) {
            console.log('No course found with that ID.'); // Debugging line
            return res.status(404).json({ error: 'Course not found' });
        }
        console.log('Course updated with ID:', CourseID); // Debugging line
        res.json({ success: true, message: 'Course updated successfully' });
    });
};

const getCourse = (req, res) => {
    const { CourseID } = req.params;
    if (!CourseID) {
        console.log('Error: Course ID is required.'); // Debugging line
        return res.status(400).json({ error: 'Course ID is required.' });
    }

    const query = 'SELECT * FROM `Course` WHERE CourseID = ?;';
    connection.query(query, [CourseID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            return res.status(500).send('Internal server error');
        }
        if (results.length === 0) {
            console.log('No course found with that ID.'); // Debugging line
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(results[0]);
    });
}

module.exports = { createCourse, deleteCourse, updateCourse, getAllCourses, getCourse, getUserCourses };