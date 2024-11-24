// 导入数据库配置
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

// API to create a new question
const createReward = (req, res) => {
    const { RewardName, RewardDescription, RewardPoint } = req.body;

    // Validate required fields
    if (!RewardName || !RewardDescription || !RewardPoint) {
        console.log('Error: Invalid input data.');
        return res.status(400).json({ error: 'Invalid input data.' });
    }

    const query = 'INSERT INTO `Reward` (RewardName, RewardDescription, RewardPoint) VALUES (?, ?, ?);';
    connection.query(query, [RewardName, RewardDescription, RewardPoint], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, id: results.insertId });
    });
};

const deleteReward = (req, res) => {
    const { RewardID } = req.params;

    // Validate required fields
    if (!RewardID) {
        console.log('Error: Invalid input data.');
        return res.status(400).json({ error: 'Invalid input data.' });
    }

    const query = 'DELETE FROM `Reward` WHERE RewardID = ?;';
    connection.query(query, [RewardID], (err, results) => {
        if (err) {
            console.error('Error deleting data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
}

const updateReward = (req, res) => {
    const { RewardID } = req.params;
    const { RewardName, RewardDescription, RewardPoint } = req.body;

    // Validate required fields
    if (!RewardID || !RewardName || !RewardDescription || !RewardPoint) {
        console.log('Error: Invalid input data.');
        return res.status(400).json({ error: 'Invalid input data.' });
    }

    const query = 'UPDATE `Reward` SET RewardName = ?, RewardDescription = ?, RewardPoint = ? WHERE RewardID = ?;';
    connection.query(query, [RewardName, RewardDescription, RewardPoint, RewardID], (err, results) => {
        if (err) {
            console.error('Error updating data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
}

// Get all rewards
const getRewards = (req, res) => {
    const query = 'SELECT * FROM `Reward`;';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error querying data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
}

// Get reward by ID
const getReward = (req, res) => {
    const { RewardID } = req.params;

    // Validate required fields
    if (!RewardID) {
        console.log('Error: Invalid input data.');
        return res.status(400).json({ error: 'Invalid input data.' });
    }
    
    const query = 'SELECT * FROM `Reward` WHERE RewardID = ?;';
    connection.query(query, [RewardID], (err, results) => {
        if (err) {
            console.error('Error querying data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results[0]);
    });
}

// Get UserRewardPoints
const updateOrCreateRewardPoint = (req, res) => {
    const { UserID, Action, ActionDetail, RewardPoint } = req.body;

    // Validate required fields
    if (!UserID || !Action || !RewardPoint) {
        console.log('Error: Invalid input data.');
        return res.status(400).json({ error: 'Invalid input data.' });
    }

    // Determine whether to increase or decrease points
    const isIncreaseAction = Action.toLowerCase() === 'increase';
    const isDecreaseAction = Action.toLowerCase() === 'decrease';

    // Ensure action is valid
    if (!isIncreaseAction && !isDecreaseAction) {
        console.log('Error: Invalid action type.');
        return res.status(400).json({ error: 'Invalid action type. Must be "Increase" or "Decrease".' });
    }

    // Insert the action into UserRewardPointHistory
    const insertHistoryQuery = `
        INSERT INTO UserRewardPointHistory (UserID, Action, ActionDetail, RewardPoint)
        VALUES (?, ?, ?, ?);
    `;
    
    connection.query(insertHistoryQuery, [UserID, Action, ActionDetail, RewardPoint], (err) => {
        if (err) {
            console.error('Error inserting history record:', err);
            return connection.rollback(() => {
                res.status(500).json({ error: 'Database error' });
            });
        }

        // Check if UserID exists in UserRewardPoint
        const checkExistQuery = `SELECT RewardPoint FROM UserRewardPoint WHERE UserID = ?;`;
        
        connection.query(checkExistQuery, [UserID], (err, results) => {
            if (err) {
                console.error('Error checking UserRewardPoint:', err);
                return connection.rollback(() => {
                    res.status(500).json({ error: 'Database error' });
                });
            }

            // Calculate new reward points based on action type
            let newRewardPoint = RewardPoint;
            if (isDecreaseAction) {
                newRewardPoint = -RewardPoint; // Negative value for decrease
            }

            if (results.length === 0) {
                // If no record exists, INSERT a new one
                const insertPointQuery = `
                    INSERT INTO UserRewardPoint (UserID, RewardPoint)
                    VALUES (?, ?);
                `;

                connection.query(insertPointQuery, [UserID, newRewardPoint], (err) => {
                    if (err) {
                        console.error('Error inserting UserRewardPoint:', err);
                        return connection.rollback(() => {
                            res.status(500).json({ error: 'Database error' });
                        });
                    }

                    // Commit transaction
                    connection.commit((err) => {
                        if (err) {
                            console.error('Error committing transaction:', err);
                            return connection.rollback(() => {
                                res.status(500).json({ error: 'Transaction commit error' });
                            });
                        }
                        res.json({ success: true, message: 'Reward points created successfully.' });
                    });
                });
            } else {
                // If a record exists, UPDATE the points
                const updatePointQuery = `
                    UPDATE UserRewardPoint 
                    SET RewardPoint = RewardPoint + ? 
                    WHERE UserID = ?;
                `;

                connection.query(updatePointQuery, [newRewardPoint, UserID], (err) => {
                    if (err) {
                        console.error('Error updating UserRewardPoint:', err);
                        return connection.rollback(() => {
                            res.status(500).json({ error: 'Database error' });
                        });
                    }

                    // Commit transaction
                    connection.commit((err) => {
                        if (err) {
                            console.error('Error committing transaction:', err);
                            return connection.rollback(() => {
                                res.status(500).json({ error: 'Transaction commit error' });
                            });
                        }
                        res.json({ success: true, message: 'Reward points updated successfully.' });
                    });
                });
            }
        });
    });
};

const getUsersReward = (req, res) => {
    const query = 'SELECT * FROM `UserRewardPoint`;';
    connection.query(query, [UserID], (err, results) => {
        if (err) {
            console.error('Error querying data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
}

const markUserRewardCompleated = (req, res) => {
    const { ID } = req.params;

    // Validate required fields
    if (!ID) {
        console.log('Error: Invalid input data.');
        return res.status(400).json({ error: 'Invalid input data.' });
    }

    const query = `UPDATE UserReward SET Status = 2 WHERE ID = ?;`;
    connection.query(query, [ID], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, message: 'User reward updated successfully.' });
    });
}

const getUserPoint = (req, res) => {
    const { UserID } = req.params;

    // Validate required fields
    if (!UserID) {
        console.log('Error: Invalid input data.');
        return res.status(400).json({ error: 'Invalid input data.' });
    }

    const query = 'SELECT * FROM `UserRewardPoint` WHERE UserID = ?;';
    connection.query(query, [UserID], (err, results) => {
        if (err) {
            console.error('Error querying data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results[0]);
    });
}

const getUsersPoint = (req, res) => {
    const query = `
        SELECT u.Name, urp.RewardPoint
        FROM UserRewardPoint urp
        JOIN User u ON urp.UserID = u.UserID
        ORDER BY urp.RewardPoint DESC;`;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error querying data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
}

// 导出API
module.exports = { createReward, deleteReward, updateReward, getRewards, updateOrCreateRewardPoint, getReward, getUsersReward, markUserRewardCompleated, getUserPoint, getUsersPoint };