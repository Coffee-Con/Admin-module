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

const addToCourseByEvent = (req, res) => {
    const { CourseID } = req.body;
    const { EventID } = req.body;
    const { Level } = req.params;

    if (!CourseID) {
        // console.log('Error: Course ID is required.'); // Debugging line
        return res.status(400).json({ error: 'Course ID is required.' });
    }

    if (!EventID) {
        // console.log('Error: Event ID is required.'); // Debugging line
        return res.status(400).json({ error: 'Event ID is required.' });
    }

    let query = '';
    if (Level == 'All') {
        // get users who attended the event
        query = `
            SELECT DISTINCT u.UserID
            FROM User u
            JOIN ClickKey ck ON ck.Email = u.Email
            JOIN MailEvent me ON me.ID
            JOIN JSON_TABLE(
                me.ClickKeys,
                '$[*]' COLUMNS (
                    email VARCHAR(45) PATH '$.email',
                    clickkey VARCHAR(45) PATH '$.clickkey'
                )
            ) AS jt ON jt.email = ck.Email AND jt.clickkey = ck.key
            WHERE me.ID = ?;`
    }
    if (Level == 'Clicked') {
        // get users who clicked the event
        query = `
            SELECT DISTINCT u.UserID
            FROM User u
            JOIN ClickKey ck ON ck.Email = u.Email
            JOIN MailEvent me ON me.ID
            JOIN JSON_TABLE(
                me.ClickKeys,
                '$[*]' COLUMNS (
                    email VARCHAR(45) PATH '$.email',
                    clickkey VARCHAR(45) PATH '$.clickkey'
                )
            ) AS jt ON jt.email = ck.Email AND jt.clickkey = ck.key
            WHERE me.ID = ?;`
    }
    connection.query(query, [EventID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            return res.status(500).send('Internal server error');
        }
        const users = results.map((result) => [result.UserID, CourseID]);

        // Insert users into the CourseUser table
        query = 'INSERT IGNORE INTO `CourseUser` (UserID, CourseID) VALUES ?;';
        connection.query(query, [users], (err, results) => {
            if (err) {
                console.error('Error inserting data:', err); // Log the error
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('Users added to course:', results.affectedRows); // Debugging line
            res.json({ success: true, message: 'Users added to course' });
        });
    });
}

module.exports = { createCourse, deleteCourse, updateCourse, getAllCourses, getCourse, getUserCourses, addToCourseByEvent };