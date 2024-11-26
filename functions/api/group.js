const express = require('express');
const app = express();
const mysql = require('mysql2');
const dbConfig = require('../dbConfig'); // Import database config
const connection = mysql.createConnection(dbConfig);

// API to create a new group
const createGroup = (req, res) => {
  const { groupName } = req.body;

  if (!groupName) {
      console.log('Error: Group Name is required.'); // Debugging line
      return res.status(400).json({ error: 'Group Name is required.' });
  }

  const query = 'INSERT INTO `Group` (GroupName) VALUES (?);';
  connection.query(query, [groupName], (err, results) => {
      if (err) {
          console.error('Error inserting data:', err); // Log the error
          return res.status(500).json({ error: 'Database error' });
      }
      // console.log('Group created with ID:', results.insertId); // Debugging line
      res.json({ success: true, id: results.insertId });
  });
};

// API to fetch all groups
const groups = (req, res) => {
  const query = 'SELECT GroupID, GroupName FROM `Group`;';
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.json(results);
  });
};

// API to add a group member
const addGroupMember = (req, res) => {
  const { groupId, userId } = req.body;

  if (!groupId || !userId) {
      return res.status(400).json({ error: 'Group ID and User ID are required.' });
  }

  const query = 'INSERT INTO `GroupUser` (GroupID, UserID) VALUES (?, ?);';
  connection.query(query, [groupId, userId], (err, results) => {
      if (err) {
          console.error('Error adding member:', err);
          return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
  });
};

// API to remove a group member
const removeGroupMember = (req, res) => {
  const { groupId, userId } = req.body;

  if (!groupId || !userId) {
      return res.status(400).json({ error: 'Group ID and User ID are required.' });
  }

  const query = 'DELETE FROM `GroupUser` WHERE GroupID = ? AND UserID = ?;';
  connection.query(query, [groupId, userId], (err, results) => {
      if (err) {
          console.error('Error removing member:', err);
          return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
  });
};

// API to get members of a specific group
const getGroupMembers = (req, res) => {
  const { groupId } = req.params;
  const query = `
      SELECT u.UserID, u.Email, u.Name 
      FROM User u 
      JOIN GroupUser gu ON u.UserID = gu.UserID 
      WHERE gu.GroupID = ?;`;
  connection.query(query, [groupId], (err, results) => {
      if (err) {
          console.error('Error fetching group members:', err);
          return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
  });
};

// API to fetch available users not in the selected group
const getAvailableUsers = (req, res) => {
  const { groupId } = req.params;
  const query = `
      SELECT u.UserID, u.Email, u.Name 
      FROM User u 
      WHERE u.UserID NOT IN (
          SELECT gu.UserID 
          FROM GroupUser gu 
          WHERE gu.GroupID = ?
      );`;

  connection.query(query, [groupId], (err, results) => {
      if (err) {
          console.error('Error fetching available users:', err);
          return res.status(500).json({ error: 'Database error' });
      }
      res.json(results); // Return available users
  });
};

const fillRecipient = (req, res) => {
  const groupId = req.params.groupId;

  if (!groupId) {
    res.json([]);
    return;
  }

  const query = 'SELECT u.Name, u.Email FROM `User` u JOIN `GroupUser` gu ON u.UserID = gu.UserID WHERE gu.GroupID = ?';
  connection.query(query, [groupId], (err, results) => {
    if (err) {
      console.error('Error fetching recipients:', err);
      return res.status(500).json({ error: 'Failed to load recipients', details: err });
    }
    console.log('Recipients:', results);
    res.json(results);
  });
};

module.exports = { createGroup, groups, addGroupMember, removeGroupMember, getGroupMembers , getAvailableUsers, fillRecipient };