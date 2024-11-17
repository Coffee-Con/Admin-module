const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cookieParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');

const dbConfig = require('./functions/dbConfig'); // 导入数据库配置
const { verifyCaptcha, verifyCaptcha2, resetPassword, sendMailHandler, generateLink, clickLinkHandler } = require('./functions/mailer'); // 导入邮件发送模块
const { requireAuth, webLogin, logout, authenticateToken, login, captcha, authenticate } = require('./functions/api/auth');
const { addUsers } = require('./functions/readCSVAndInsertUsers'); // 导入添加用户模块
const { checkAdmin } = require('./functions/api/checkAdmin');
const { getUserInfo } = require('./functions/api/user');

const app = express();
const port = process.env.PORT || 80;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // cookie
app.use(session({ secret: process.env.Secret, resave: false, saveUninitialized: true, cookie: { secure: false } })); // 使用 session 中间件，在开发环境下可以不使用 https
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/admin', authenticate, express.static(path.join(__dirname, 'public/admin'))); // 需要登录的静态资源目录（使用 authenticate 中间件）
app.use(express.static(path.join(__dirname, 'public'))); // 无需登录的静态资源目录
// app.use((req, res, next) => { res.status(404).send('404 Not Found'); }); // 404

// 连接到MySQL数据库，如果连接失败则会报错
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

// Auth
app.post('/login', webLogin); // 处理登录请求
app.post('/api/login', login);
app.post('/logout', logout); // logout
// Auth end

// 创建验证码路由
app.get('/captcha', captcha);
app.post('/verify-captcha', verifyCaptcha);
app.post('/api/verify-captcha', verifyCaptcha2); // 无需图形验证码的验证
app.post('/reset-password', resetPassword);

// 以下功能需要登录后才能访问
app.use(authenticate);

// Email
app.post('/send', sendMailHandler); // 处理发送邮件请求
app.post('/generate-link', generateLink);
app.get("/click/:key", clickLinkHandler); // 记录点击事件
// Email end

// History
const { getClicks, getClicksRisk } = require('./functions/api/click');
app.get('/click-events-history', getClicks);
app.get('/click-risk', getClicksRisk);
// History end

// Group
const { createGroup, groups, addGroupMember, removeGroupMember, getGroupMembers, getAvailableUsers, fillRecipient } = require('./functions/group');
app.get('/groups', groups);
app.get('/create-group', createGroup);
app.post('/add-group-member', addGroupMember);
app.delete('/remove-group-member', removeGroupMember);
app.get('/group-members/:groupId', getGroupMembers);
app.get('/available-users/:groupId', getAvailableUsers);
app.get('/fillRecipient/:groupId', fillRecipient);
// Group end

// Course
const { createCourse, deleteCourse, updateCourse, getAllCourses, getUserCourses, getCourse } = require('./functions/api/course');
app.post('/create-course', createCourse);
app.delete('/delete-course/:CourseID', deleteCourse);
app.put('/update-course/:CourseID', updateCourse);
app.get('/getCourses', getAllCourses);
app.get('/getCourse/:CourseID', getCourse);
app.get('/api/getUserCourses', getUserCourses);
// Course end

// Quiz
const { createQuiz, deleteQuiz, updateQuiz, getAllQuizzes, getQuiz, getCourseQuizzes, getQuizzesNotInCourse, addQuizToCourse, removeQuizFromCourse, getUserCourseQuizzes, addUserQuizAnswer, addUserQuizScore, getUserQuizScores, getUserQuizScore, saveUserQuizQuestionAnswer, getUserQuizAnswers, getUserUnCompletedQuizzes, getUserCompletedQuizzes } = require('./functions/api/quiz');
app.post('/create-quiz', createQuiz);
app.delete('/delete-quiz/:QuizID', deleteQuiz);
app.put('/update-quiz/:QuizID', updateQuiz);
app.get('/getQuizzes', getAllQuizzes);
app.get('/getQuiz/:QuizID', getQuiz);
app.get('/getCourseQuizzes/:CourseID', getCourseQuizzes);
app.get('/getQuizzesNotInCourse/:CourseID', getQuizzesNotInCourse);
app.post('/addQuizToCourse', addQuizToCourse);
app.delete('/removeQuizFromCourse', removeQuizFromCourse);
app.get('/api/getUserCourseQuizzes/:CourseID', authenticate, getUserCourseQuizzes);
app.post('/api/submitQuiz', addUserQuizAnswer);
app.get('/api/getUserQuizScores', getUserQuizScores);
app.get('/api/getUserQuizScore', getUserQuizScore);
app.post('/api/saveUserQuizQuestionAnswer', saveUserQuizQuestionAnswer);
app.get('/api/getUserQuizAnswers/:UserID/:QuizID', getUserQuizAnswers);
app.get('/api/getUserUnCompletedQuizzes/:UserID/:CourseID', getUserUnCompletedQuizzes);
app.get('/api/getUserCompletedQuizzes/:UserID/:CourseID', getUserCompletedQuizzes);
// app.post('/api/addUserQuizScore', addUserQuizScore); use submitQuiz instead
// Quiz end

// Question
const { createQuestion, getQuizQuestions, getQuestion, getQuestions, deleteQuestion, getAllQuestions, updateQuestion } = require('./functions/api/question');
app.post('/api/createQuestion', createQuestion);
app.get('/api/getQuizQuestions/:QuizID', getQuizQuestions);
app.get('/api/getQuestion/:QuestionID', getQuestion);
app.get('/api/getQuestions/:QuizID', getQuestions);
app.delete('/api/delete-question/:QuestionID', deleteQuestion);
app.get('/api/getAllQuestions', getAllQuestions);
app.put('/api/updateQuestion/:QuestionID', updateQuestion);
// Question end

// User
const { addUser } = require('./functions/readCSVAndInsertUsers');
app.post('/addUser', addUser);
app.post('/addUsers', upload.single('csvfile'), addUsers);
// User end

// Template
const { generateTemplate, addTemplate, getTemplates, deleteTemplate, getTemplate } = require('./functions/api/template');
app.post('/chat', generateTemplate);
app.post('/confirmTemp', addTemplate);
app.get('/templates', getTemplates);
app.delete('/delete-template/:id', deleteTemplate);
app.get('/template/:id', getTemplate);
// Template end

// Reward
const { createReward, getRewards, deleteReward, getReward } = require('./functions/api/reward');
app.post('/api/create-reward', createReward);
app.get('/api/getRewards', getRewards);
app.delete('/api/delete-reward/:RewardID', deleteReward);
app.get('/api/getReward/:RewardID', getReward);
// Reward end

// Extra
app.get('/api/check-admin', authenticate, checkAdmin); // 管理员判断
app.get('/api/getUserInfo', getUserInfo); // 获取用户信息
// Extra end

app.listen(port, () => {
  console.log(`Server is running on ${process.env.BASE_URL}:${port}`);
});