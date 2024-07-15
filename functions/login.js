const express = require('express');
const mysql = require('mysql2');
// const bodyParser = require('body-parser');
const multer  = require('multer');
const upload = multer();
const crypto = require('crypto');
const dbConfig = require('./dbConfig'); // 导入数据库配置

const app = express();
const port = 5001;

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // 用于提供静态文件

// 连接到MySQL数据库
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.post('/login', upload.none(), (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  console.log('Email:', email);
  console.log('Password:', password);

  const query = 'SELECT * FROM user WHERE Email = ?';
  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err.stack);
      res.status(500).send('Internal server error');
      return;
    }

    if (results.length === 0) {
      res.status(401).send('Email error');
      return;
    }

    const user = results[0];
    const hashedPW = crypto.createHash('md5').update(password + user.Salt).digest('hex');

    if (hashedPW !== user.HashedPW) {
      res.status(401).send('Password error');
      return;
    }

    if (user.Role === 0) {
      res.send('user');
    } else if (user.Role === 1) {
      res.send('admin');
    } else {
      res.status(401).send('Unknown role');
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
