const express = require('express');
const mysql = require('mysql2');

const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });

const crypto = require('crypto');
const dbConfig = require('./functions/dbConfig'); // 导入数据库配置
const mailer = require('./functions/mailer'); // 导入邮件发送模块

// const ollama = require('ollama'); // AI
const { default: ollama } = require('ollama');
const { addUsers, addUser} = require('./functions/readCSVAndInsertUsers'); // 导入添加用户模块

// const upload = require('./functions/middlewares/upload'); // 导入上传文件中间件

const app = express();
const port = process.env.PORT || 5001;

app.use(express.static('public')); // 用于提供静态文件
app.use(express.urlencoded({ extended: true }));

// 连接到MySQL数据库
console.log("Try to connect the databse");
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
const { requireAuth } = require('./functions/api/authFunctions');

const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key';  // JWT 秘钥
// 处理登录请求
app.post('/login', upload.none(), (req, res) => { // 使用 upload.none() 中间件处理表单数据
  const email = req.body.email;
  const password = req.body.password;

  const query = 'SELECT * FROM user WHERE Email = ?';
  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err.stack);
      res.status(500).send('Internal server error');
      return;
    }

    if (results.length === 0) {
      res.status(401).send('Email error'); // change to email and password error
      return;
    }

    const user = results[0];
    const hashedPW = crypto.createHash('md5').update(password + user.Salt).digest('hex');

    if (hashedPW !== user.HashedPW) {
      res.status(401).send('Password error'); // change to email and password error
      return;
    } else {
      const token = jwt.sign({ id: user.UserID, email: user.Email, Role: user.Role }, SECRET_KEY, { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true });
    }

    // 根据用户角色跳转到不同页面
    if (user.Role === 0) {
      res.redirect('/user'); // 404 后续修改
    } else if (user.Role === 1) {
      res.redirect('/admin/index');
    } else {
      res.status(401).send('Unknown role'); // 如果出现需要修改
    }
  });
});

// Register
// Handle file upload
app.post('/addUsers', upload.single('csvfile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  console.log('File uploaded:', req.file);

  const filePath = req.file.path;

  console.log('File uploaded:', filePath);
  // Use the Add_User_by_csv.js script
  addUsers.addUsers(filePath, connection, (err, result) => {
    if (err) {
      console.error('Error adding users:', err);
      return res.status(500).send('Error adding users.');
    }
    // res.send('Users added successfully!');
    res.send(result);
  });
});
app.post('/addUser', addUser);

// captcha testing后续需修改位置 /* */
const svgCaptcha = require('svg-captcha');
const session = require('express-session');

// 使用 session 中间件
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // 在开发环境下可以不使用 https
}));

// 创建验证码路由
app.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.create({
        noise: 2, // 噪点数量
        color: true, // 生成彩色验证码
        background: '#ccffcc', // 背景颜色
        ignoreChars: '0o1i', // 忽略容易混淆的字符
    });
    
    // 将验证码文本保存到 session 中
    req.session.captcha = captcha.text;

    // console.log(`生成的验证码: ${captcha.text}`);

    // 返回 SVG 图片
    res.type('svg');
    res.status(200).send(captcha.data);
});

app.post('/verify-captcha', mailer.verifyCaptcha);

// 等mobile端完成后删除
app.use(express.json());
app.post('/api/verify-captcha', mailer.verifyCaptcha2);

app.use(express.json());
app.post('/reset-password', mailer.resetPassword);

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

// 管理首页
const cookieParser = require('cookie-parser');
app.use(cookieParser()); // cookie
app.get('/admin/index', requireAuth, (req, res) => {
  res.sendFile(__dirname + '/public/admin/index.html');
});

// click
app.use(express.json());
// 生成钓鱼链接的测试页面
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


// AI
app.post('/chat', upload.none(), async (req, res) => {
  const userMessage = req.body.message;
  // console.log('User message:', userMessage);

  /*
  const response = await ollama.chat({
      model: 'llama3.1:latest',
      messages: [{ role: 'user', content: userMessage }],
    });
    console.log(response.message.content);
    res.json({ message: response.message.content });
  */
  const predefinedText = 
`Please generate the body of a phishing email based on the following title. This email is used for anti-phishing testing within the company. The email should include placeholders [name] and [link].

Title: Urgent: Please Update Your Company Account Information Immediately

Instructions:

The email must include the placeholders [name] and [link] for personalization.
The tone should be formal and urgent to prompt the recipient to click the link quickly.
Provide a plausible reason to make the recipient believe immediate action is required.
Example Title: Urgent: Please Update Your Company Account Information Immediately

Output:
Dear [name],

To enhance the security of our system, we are updating all employees' account information. Please click the following link and follow the instructions to complete the update:

[link]

Please ensure this is done within 24 hours, or your account will be temporarily disabled.

Thank you for your cooperation.

Best regards,
IT Support Team
——————————
Give me the text only. Don't say anything like: Here's the body of a phishing email based on the title:.
The following are the titles you need to use to generate content: `;

  try {
    const response = await ollama.chat({
      model: 'qwen2.5:0.5b', // change to 0.5b? to get info faster
      messages: [{ role: 'user', content: predefinedText + userMessage }],
    });
    res.json({ message: response.message.content });
  } catch (error) {
    console.error('Error calling ollama.chat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/confirmTemp', upload.none(), (req, res) => {
  const { Subject, Content } = req.body;

  // Check if both subject and content are provided
  if (!Subject || !Content) {
    return res.status(400).json({ error: 'Subject and content are required.' });
  }
  // Insert data into the email_template table
  const query = 'INSERT INTO email_template (content) VALUES (?)';
  const contentJson = JSON.stringify({ subject: Subject, content: Content });

  connection.query(query, contentJson, (error, results) => {
    if (error) {
      console.error('Error inserting data:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('Results:', results);
    res.json({ success: true, id: results.insertId });
  });
});

// Route to get templates
app.get('/templates', (req, res) => {
  const query = 'SELECT id, content FROM email_template';

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    // console.log('Templates:', results);
    res.json(results);
  });
});

// Route to get a single template by ID
app.get('/template/:id', (req, res) => {
  const templateId = req.params.id;
  const query = 'SELECT content FROM email_template WHERE id = ?';

  connection.query(query, templateId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(results[0]);
  });
});

// Route to get all groups
app.get('/groups', (req, res) => {
  const query = 'SELECT GroupID, GroupName FROM `group`';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching groups:', err);
      return res.status(500).json({ error: 'Failed to load groups', details: err });
    }
    res.json(results);
  });
});

const { deleteTemplate } = require('./functions/api/template');
app.delete('/delete-template/:id', deleteTemplate);

// Route to get recipients for a specific group
app.get('/fillRecipient/:groupId', (req, res) => {
  const groupId = req.params.groupId;
  const query = 'SELECT u.Name, u.Email FROM `user` u JOIN `group_user` gu ON u.UserID = gu.UserID WHERE gu.GroupID = ?';
  connection.query(query, [groupId], (err, results) => {
    if (err) {
      console.error('Error fetching recipients:', err);
      return res.status(500).json({ error: 'Failed to load recipients', details: err });
    }
    console.log('Recipients:', results);
    res.json(results);
  });
});

// History
const { getClicks, getClicksRisk } = require('./functions/api/click');
app.get('/click-events-history', getClicks);
app.get('/click-risk', getClicksRisk);
// History end

// Group
const { createGroup, groups, addGroupMember, removeGroupMember, getGroupMembers, getAvailableUsers } = require('./functions/group'); // 导入Group模块
app.use('/groups', groups);
app.use('/create-group', createGroup);
app.use('/add-group-member', addGroupMember);
app.use('/remove-group-member', removeGroupMember);
// app.use('/group-members', getGroupMembers);
app.get('/group-members/:groupId', getGroupMembers);
app.get('/available-users/:groupId', getAvailableUsers);
// Group end

// Mobile API
const bodyParser = require('body-parser');
const cors = require('cors');
const { authenticateToken, login } = require('./functions/api/authFunctions');
const { checkAdmin } = require('./functions/api/checkAdmin');
const { getUserInfo } = require('./functions/api/user');
const { getAllCourses, getUserCourses, getCourse } = require('./functions/api/course');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 登录路由
app.post('/api/login', (req, res) => login(req, res));

// 管理员判断路由
app.get('/api/check-admin', authenticateToken, checkAdmin);

app.get('/api/getUserCourses', authenticateToken, getUserCourses);

app.get('/api/getUserInfo', authenticateToken, getUserInfo);
// Mobile API end

// Course
const { createCourse, deleteCourse, updateCourse } = require('./functions/api/course');
app.use('/create-course', createCourse);
app.delete('/delete-course/:CourseID', deleteCourse);
app.put('/update-course/:CourseID', updateCourse);
app.get('/getCourses', getAllCourses);
app.get('/getCourse/:CourseID', getCourse);
// Course end

// Quiz
const { createQuiz, deleteQuiz, updateQuiz, getAllQuizzes, getQuiz, getCourseQuizzes, getQuizzesNotInCourse, addQuizToCourse, removeQuizFromCourse, getUserCourseQuizzes } = require('./functions/api/quiz');
app.use('/create-quiz', createQuiz);
app.delete('/delete-quiz/:QuizID', deleteQuiz);
app.put('/update-quiz/:QuizID', updateQuiz);
app.get('/getQuizzes', getAllQuizzes);
app.get('/getQuiz/:QuizID', getQuiz);
app.get('/getCourseQuizzes/:CourseID', getCourseQuizzes);
app.get('/getQuizzesNotInCourse/:CourseID', getQuizzesNotInCourse);
app.post('/addQuizToCourse', addQuizToCourse);
app.delete('/removeQuizFromCourse', removeQuizFromCourse);
app.get('/api/getUserCourseQuizzes/:CourseID',authenticateToken, getUserCourseQuizzes);
// Quiz end

// Question
const { createQuestion, getQuizQuestions, getQuestion, getQuestions } = require('./functions/api/question');
const { get } = require('http');
app.use('/create-question', createQuestion);
app.get('/api/getQuizQuestions/:QuizID',authenticateToken, getQuizQuestions);
app.get('/api/getQuestion/:QuestionID', getQuestion);
app.get('/api/getQuestions/:QuizID', getQuestions);
// Question end

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});