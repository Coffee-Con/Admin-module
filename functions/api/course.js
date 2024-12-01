// Import database config
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);
const transporter = require('../emailConfig');

// Get all courses
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

// Get courses for a user
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
            JOIN ClickKey ck ON ck.Email COLLATE utf8mb4_unicode_ci = u.Email COLLATE utf8mb4_unicode_ci
            JOIN MailEvent me ON me.ID
            JOIN JSON_TABLE(
                me.ClickKeys,
                '$[*]' COLUMNS (
                    email VARCHAR(45) PATH '$.email',
                    clickkey VARCHAR(45) PATH '$.clickkey'
                )
            ) AS jt ON jt.email COLLATE utf8mb4_unicode_ci = ck.Email COLLATE utf8mb4_unicode_ci 
                    AND jt.clickkey COLLATE utf8mb4_unicode_ci = ck.key COLLATE utf8mb4_unicode_ci
            WHERE me.ID = ?;`
    }
    if (Level == 'Clicked') {
        // get users who clicked the event
        query = `
            SELECT DISTINCT u.UserID
            FROM User u
            JOIN ClickKey ck ON ck.Email COLLATE utf8mb4_unicode_ci = u.Email COLLATE utf8mb4_unicode_ci
            JOIN ClickEvent ce ON ce.key COLLATE utf8mb4_unicode_ci = ck.key COLLATE utf8mb4_unicode_ci
            JOIN MailEvent me ON me.ID
            JOIN JSON_TABLE(
                me.ClickKeys,
                '$[*]' COLUMNS (
                    email VARCHAR(45) PATH '$.email',
                    clickkey VARCHAR(45) PATH '$.clickkey'
                )
            ) AS jt ON jt.email COLLATE utf8mb4_unicode_ci = ck.Email COLLATE utf8mb4_unicode_ci 
                    AND jt.clickkey COLLATE utf8mb4_unicode_ci = ck.key COLLATE utf8mb4_unicode_ci
            WHERE me.ID = ?
            AND ce.time IS NOT NULL; -- Include only those users who have triggered a click event`
    }
    connection.query(query, [EventID], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            return res.status(500).send('Internal server error');
        }
        const users = results.map((result) => [result.UserID, CourseID]);

        // Insert users into the CourseUser table
        query = 'INSERT IGNORE INTO `CourseUser` (UserID, CourseID) VALUES ?;'; // IGNORE to prevent duplicate entries
        connection.query(query, [users], (err, results) => {
            if (err) {
                console.error('Error inserting data:', err); // Log the error
                return res.status(500).json({ error: 'Database error' });
            }
            // console.log('Users added to course:', results.affectedRows); // Debugging line

            queryUsers = 'SELECT Email FROM User WHERE UserID IN (?)';
            connection.query(queryUsers, [users.map((user) => user[0])], (err, results) => {
                if (err) {
                    console.error('Error querying the database:', err.stack);
                    return res.status(500).send('Internal server error');
                }
                const emails = results.map((result) => result.Email);

                // Send a email to the users
                const mailOptions = {
                    from: 'no-reply@staffcanvas.com',
                    to: emails,
                    subject: 'Enroll in a course',
                    text: `Please check your mobile app to learn more about the course. If you do not have the Mobile Application Downloaded, Please Access https://github.com/Coffee-Con/Staff-Canvas/releases`,
                    html: `<p>Please check your mobile app to learn more about the course. If you do not have the Mobile Application Downloaded, Please Access <a href="https://github.com/Coffee-Con/Staff-Canvas/releases">Staff Canvas</a></p>`
                };
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                    // console.error('Email sending error:', err);
                    return res.status(500).json({ success: false, message: 'Failed to send email, please try again later.' });
                    }
                });
                res.json({ success: true, message: 'Users added to course' });
            });
        });
    });
}

module.exports = { createCourse, deleteCourse, updateCourse, getAllCourses, getCourse, getUserCourses, addToCourseByEvent };