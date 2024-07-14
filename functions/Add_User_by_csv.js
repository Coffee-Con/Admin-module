const mysql = require('mysql2');
const fs = require('fs');
const csv = require('csv-parser');
const crypto = require('crypto');
const dbConfig = require('./dbConfig');

// 连接到MySQL数据库
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

// 读取CSV文件并插入数据
const readCSVAndInsertUsers = (filePath) => {
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const name = row.Name;
      const email = row.Email;
      const password = row.Password;
      const role = parseInt(row.Role, 10);
      const user = email;

      // 生成盐值和加密密码
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPW = crypto.createHash('md5').update(password + salt).digest('hex');

      // 插入数据到数据库
      const query = 'INSERT INTO user (User, Email, Name, Role, Salt, HashedPW) VALUES (?, ?, ?, ?, ?, ?)';
      connection.query(query, [user, email, name, role, salt, hashedPW], (err, results) => {
        if (err) {
          console.error('Error inserting data:', err.stack);
          return;
        }
        console.log('Inserted user:', email);
      });
    })
    .on('end', () => {
      console.log('CSV file successfully processed.');
      connection.end((err) => {
        if (err) {
          console.error('Error ending the connection:', err.stack);
          return;
        }
        console.log('Connection closed.');
      });
    });
};

// 读取并插入用户
readCSVAndInsertUsers('user-import.csv');
