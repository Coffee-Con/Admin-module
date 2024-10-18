const express = require('express');
const app = express();
const mysql = require('mysql2');
const dbConfig = require('./dbConfig'); // 导入数据库配置

// 连接到MySQL数据库
const connection = mysql.createConnection(dbConfig);

// API to create a new group
const createGroup = (req, res) => {
  const { groupName } = req.body;

  if (!groupName) {
      console.log('Error: Group Name is required.'); // Debugging line
      return res.status(400).json({ error: 'Group Name is required.' });
  }

  const query = 'INSERT INTO `group` (GroupName) VALUES (?);';
  connection.query(query, [groupName], (err, results) => {
      if (err) {
          console.error('Error inserting data:', err); // Log the error
          return res.status(500).json({ error: 'Database error' });
      }
      console.log('Group created with ID:', results.insertId); // Debugging line
      res.json({ success: true, id: results.insertId });
  });
};

// API to fetch all groups
const groups = (req, res) => {
  const query = 'SELECT GroupID, GroupName FROM `group`;';
  connection.query(query, (err, results) => {
    console.log('Groups:', results); // Debugging line
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

  const query = 'INSERT INTO `group_user` (GroupID, UserID) VALUES (?, ?);';
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

  const query = 'DELETE FROM `group_user` WHERE GroupID = ? AND UserID = ?;';
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
      SELECT u.UserID, u.User, u.Email, u.Name 
      FROM user u 
      JOIN group_user gu ON u.UserID = gu.UserID 
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
      SELECT u.UserID, u.User, u.Email, u.Name 
      FROM user u 
      WHERE u.UserID NOT IN (
          SELECT gu.UserID 
          FROM group_user gu 
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

module.exports = { createGroup, groups, addGroupMember, removeGroupMember, getGroupMembers , getAvailableUsers};