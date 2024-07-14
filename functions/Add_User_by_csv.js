const mysql = require('mysql2');
const fs = require('fs');
const csv = require('csv-parser');
const crypto = require('crypto');
const dbConfig = require('./dbConfig');  // 导入数据库配置

// 连接到MySQL数据库
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

// 检查Email是否存在的函数
const checkEmailExists = (email, callback) => {
  const query = 'SELECT COUNT(*) AS count FROM user WHERE Email = ?';
  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error checking email:', err.stack);
      callback(err, null);
      return;
    }
    const count = results[0].count;
    callback(null, count > 0);
  });
};

// 读取CSV文件并插入数据
const readCSVAndInsertUsers = (filePath) => {
  const users = new Map(); // 用于存储用户数据，键为Email，值为用户数据对象
  const duplicateEmails = new Set(); // 用于存储CSV文件中重复的Email

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const email = row.Email;
      if (users.has(email)) {
        duplicateEmails.add(email);
      } else {
        users.set(email, {
          name: row.Name,
          email: row.Email,
          password: row.Password,
          role: parseInt(row.Role, 10),
          user: row.Email
        });
      }
    })
    .on('end', () => {
      console.log('CSV file successfully processed.');

      // 处理CSV文件中的重复Email
      duplicateEmails.forEach(email => {
        console.log(`Repeat email in CSV: ${email}`);
      });

      // 检查数据库中是否存在相同的Email并插入新用户
      let processedCount = 0;
      users.forEach(user => {
        checkEmailExists(user.email, (err, exists) => {
          if (err) {
            console.error('Error during email existence check:', err);
            return;
          }

          if (exists) {
            console.log(`Repeat email in database: ${user.email}`);
          } else {
            // 生成盐值和加密密码
            const salt = crypto.randomBytes(16).toString('hex');
            const hashedPW = crypto.createHash('md5').update(user.password + salt).digest('hex');

            // 插入数据到数据库
            const query = 'INSERT INTO user (User, Email, Name, Role, Salt, HashedPW) VALUES (?, ?, ?, ?, ?, ?)';
            connection.query(query, [user.user, user.email, user.name, user.role, salt, hashedPW], (err, results) => {
              if (err) {
                console.error('Error inserting data:', err.stack);
                return;
              }
              console.log('Inserted user:', user.email);
            });
          }

          processedCount++;
          if (processedCount === users.size) {
            connection.end((err) => {
              if (err) {
                console.error('Error ending the connection:', err.stack);
                return;
              }
              console.log('Connection closed.');
            });
          }
        });
      });
    });
};

// 读取并插入用户
readCSVAndInsertUsers('user-import.csv');
