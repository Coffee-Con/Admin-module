const express = require('express');
const mysql = require('mysql2');
const multer  = require('multer');
const upload = multer();
const crypto = require('crypto');
const dbConfig = require('./functions/dbConfig'); // 导入数据库配置
const mailer = require('./functions/mailer'); // 导入邮件发送模块

const app = express();
const port = process.env.PORT || 5001;

app.use(express.static('public')); // 用于提供静态文件
app.use(express.urlencoded({ extended: true }));

// 连接到MySQL数据库
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

// 登录页面
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// 处理登录请求
app.post('/login', upload.none(), (req, res) => { // 使用 upload.none() 中间件处理表单数据
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

    // 根据用户角色跳转到不同页面
    if (user.Role === 0) {
      res.redirect('/user');
    } else if (user.Role === 1) {
      res.redirect('/admin/index');
    } else {
      res.status(401).send('Unknown role');
    }
  });
});

/*
// 用户页面
app.get('/user', (req, res) => {
  res.sendFile(__dirname + '/public/user.html');
});

// 管理员页面
app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});
*/
// 处理发送邮件请求
app.post('/send', mailer.sendMailHandler);
/*
// 首页
app.get('/index', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
*/
// 管理首页
app.get('/admin/index', (req, res) => {
  res.sendFile(__dirname + '/public/admin/index.html');
});


// click

app.use(express.json());
// 生成钓鱼链接页面
app.get('/generate-link', (req, res) => {
  res.sendFile(__dirname + '/public/generate-link.html');
});

// 处理生成链接的请求
app.post('/generate-link', upload.none(), (req, res) => {
  const email = req.body.email;
  console.log('Email:', email);
  // 为每个用户生成唯一的 key
  const key = crypto.randomBytes(16).toString('hex');
  console.log('Key:', key);

  // 从数据库中获取用户 ID
  connection.query('SELECT UserID FROM user WHERE (`Email`) = (?)', [email], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err.stack);
      res.status(500).send('Internal server error');
      return;
    }

    // 如果没有找到用户，则设置 UserID 为 0
    const userId = results.length > 0 ? results[0].UserID : 0;
    // const userId = 1; // For testing purposes
    console.log('User ID:', userId);

    // 将生成的 key 存储到数据库
    connection.query('INSERT INTO click_key (`key`, `userid`) VALUES (?, ?)', [key, userId], (err) => {
      if (err) {
        console.error('Error inserting key into the database:', err.stack);
        res.status(500).send('Internal server error');
        return;
      }

      // 返回生成的链接
      const link = `http://localhost:${port}/click/${key}`;
      res.send(`Click link generated: <a href="${link}" target="_blank">${link}</a>`);
    });
  });
});

// 记录点击事件
app.get('/click/:key', (req, res) => {
  const key = req.params.key;
  console.log('Key:', key);

  // 记录点击事件
  connection.query('INSERT INTO click_event (`key`) VALUES (?)', [key], (err) => {
    if (err) {
      console.error('Error inserting click event into the database:', err.stack);
    }

    // 可选: 显示一个确认页面
    res.send('Click recorded.');
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});