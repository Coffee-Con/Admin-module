const http = require('http');
const https = require('https');
const fs = require('fs');
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cookieParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');

const dbConfig = require('./functions/dbConfig'); // Import database config
const options = { // SSL certificate
  key: fs.readFileSync(process.env.SSL_Key),
  cert: fs.readFileSync(process.env.SSL_Cert)
};
const { verifyCaptcha, verifyCaptcha2, resetPassword, sendMailHandler, generateLink, clickLinkHandler, markEmailEventAsCompleted } = require('./functions/api/mail'); // import mail functions
const { requireAuth, webLogin, logout, authenticateToken, login, captcha, authenticate, checkAdmin, authRequireAdmin } = require('./functions/api/auth');
const { addUsers } = require('./functions/api/user'); // import user functions
const { getUserInfo } = require('./functions/api/user');

const app = express();
const port = process.env.PORT || 80;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // cookie
app.use(session({ secret: process.env.Secret, resave: false, saveUninitialized: true, cookie: { secure: false } })); // use session to store user info, secret is used to sign the session ID cookie
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/admin', authenticate, express.static(path.join(__dirname, 'public/admin'))); // login to access admin page (authenticate)
app.use(express.static(path.join(__dirname, 'public'))); // no need to login to access other pages
// connect to the database
console.log("Try to connect the databse");
const connection = mysql.createConnection(dbConfig);
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

// login page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// Auth
app.post('/login', webLogin); // process login
app.post('/api/login', login);
app.post('/logout', logout); // logout
// Auth end

// Captcha
app.get('/captcha', captcha);
app.post('/verify-captcha', verifyCaptcha);
app.post('/api/verify-captcha', verifyCaptcha2); // no need to verify captcha for mobile app
app.post('/reset-password', resetPassword);

// Click link
app.get("/click/:key", clickLinkHandler); // record click event
// Click link end

// Below this line, all requests require authentication
app.use(authenticate);
app.use(authRequireAdmin);

// Email
app.post('/send', sendMailHandler); // handle email sending
app.post('/generate-link', generateLink);
app.post('/api/markEmailEventAsCompleted/:ID', markEmailEventAsCompleted); // Email
// Email end

// History
const { getClicks, getClicksRisk, getAllEmailEvents, getNameByEmail, getIfClicked } = require('./functions/api/click');
app.get('/click-events-history', getClicks);
app.get('/click-risk', getClicksRisk);
app.get('/api/getAllEmailEvents', getAllEmailEvents);
app.get('/api/getNameByEmail', getNameByEmail);
app.get('/api/getIfClicked/:Key', getIfClicked);
// History end

// Group
const { createGroup, groups, addGroupMember, removeGroupMember, getGroupMembers, getAvailableUsers, fillRecipient } = require('./functions/api/group');
app.get('/groups', groups);
app.post('/create-group', createGroup);
app.post('/add-group-member', addGroupMember);
app.delete('/remove-group-member', removeGroupMember);
app.get('/group-members/:groupId', getGroupMembers);
app.get('/available-users/:groupId', getAvailableUsers);
app.get('/fillRecipient/:groupId', fillRecipient);
// Group end

// Course
const { createCourse, deleteCourse, updateCourse, getAllCourses, getUserCourses, getCourse, addToCourseByEvent } = require('./functions/api/course');
app.post('/create-course', createCourse);
app.delete('/delete-course/:CourseID', deleteCourse);
app.put('/update-course/:CourseID', updateCourse);
app.get('/getCourses', getAllCourses);
app.get('/getCourse/:CourseID', getCourse);
app.get('/api/getUserCourses', getUserCourses);
app.post('/api/addToCourseByEvent/:Level', addToCourseByEvent);
// Course end

// Quiz
const { createQuiz, deleteQuiz, updateQuiz, getAllQuizzes, getQuiz, getCourseQuizzes, getQuizzesNotInCourse, addQuizToCourse, removeQuizFromCourse, getUserCourseQuizzes, addUserQuizAnswer, addUserQuizScore, getUserQuizScores, getUserQuizScore, saveUserQuizQuestionAnswer, getUserQuizAnswers, getUserUnCompletedQuizzes, getUserCompletedQuizzes, getLeaderboard, addQuestionToQuiz, removeQuiestionFromQuiz, getAllCourseQuizzes } = require('./functions/api/quiz');
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
app.get('/api/getCourseQuizRank', getLeaderboard);
app.post('/api/addQuestionToQuiz/:QuizID/:QuestionID', addQuestionToQuiz);
app.delete('/api/removeQuestionFromQuiz/:QuizID/:QuestionID', removeQuiestionFromQuiz);
app.get('/api/getAllCourseQuizzes', getAllCourseQuizzes);
// Quiz end

// Question
const { createQuestion, getQuizQuestions, getQuestion, getQuestions, deleteQuestion, getAllQuestions, updateQuestion, getQuestionsNotInQuiz } = require('./functions/api/question');
app.post('/api/createQuestion', createQuestion);
app.get('/api/getQuizQuestions/:QuizID', getQuizQuestions);
app.get('/api/getQuestion/:QuestionID', getQuestion);
app.get('/api/getQuestions/:QuizID', getQuestions);
app.get('/api/getQuestionsNotInQuiz/:QuizID', getQuestionsNotInQuiz);
app.delete('/api/delete-question/:QuestionID', deleteQuestion);
app.get('/api/getAllQuestions', getAllQuestions);
app.put('/api/updateQuestion/:QuestionID', updateQuestion);
// Question end

// User
const { addUser, getUsers, deleteUser, updateUser } = require('./functions/api/user');
app.post('/addUser', addUser);
app.post('/addUsers', upload.single('csvfile'), addUsers);
app.get('/api/getUsers', getUsers);
app.delete('/api/deleteUser', deleteUser);
app.put('/api/updateUser/:UserID', updateUser);
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
const { createReward, deleteReward, updateReward, getRewards, updateOrCreateRewardPoint, getReward, getUsersRewards, markUserRewardCompleated, getUserPoint, getUsersPoint, redeemReward } = require('./functions/api/reward');
app.post('/api/createReward', createReward);
app.get('/api/getRewards', getRewards);
app.delete('/api/deleteReward/:RewardID', deleteReward);
app.get('/api/getReward/:RewardID', getReward);
app.put('/api/updateReward/:RewardID', updateReward);
app.get('/api/getUserPoint/:UserID', getUserPoint);
app.get('/api/getUsersPoint', getUsersPoint);
app.post('/api/updateUserRewardPoint', updateOrCreateRewardPoint);
app.get('/api/getUsersRewards', getUsersRewards);
app.post('/api/markUserRewardCompleated/:ID', markUserRewardCompleated);
// Reward end

// Material
const { createMaterial, getMaterials, deleteMaterial, addMaterialToCourse, deleteCourseMaterial, getCourseMaterials, getMaterialsNotInCourse, updateMaterial } = require('./functions/api/material');
const uploadFile = require('./functions/uploadConfig');
app.post('/api/createMaterial', uploadFile.single("file"), createMaterial);
app.get('/api/getMaterials', getMaterials);
app.get('/api/getMaterialsNotInCourse/:CourseID', getMaterialsNotInCourse);
app.delete('/api/deleteMaterial/:MaterialID', deleteMaterial);
app.post('/api/addMaterialToCourse', addMaterialToCourse);
app.delete('/api/deleteCourseMaterial', deleteCourseMaterial);
app.get('/api/getCourseMaterials/:CourseID', getCourseMaterials);
app.put('/api/updateMaterial/:MaterialID', updateMaterial);
// Material end

// Extra
app.get('/api/check-admin', checkAdmin); // check if admin
app.get('/api/getUserInfo', getUserInfo); // get user info
// Extra end

app.use((req, res) => { res.status(404).sendFile(path.join(__dirname, 'public/404.html')); }); // 404 page

http.createServer((req, res) => {
  const host = req.headers.host.split(':')[0];  // get host without port
  const redirectUrl = `https://${host}${req.url}`;
  
  res.writeHead(301, { "Location": redirectUrl });
  res.end();
}).listen(port);  // listen to port

// Create HTTPS server
https.createServer(options, app).listen(443, () => {
  const host = new URL(process.env.BASE_URL).host;
  console.log(`Server is running on http://${host}:${port}`);
  console.log(`If you are using HTTPS, please visit https://${host}`);
});

// Mobile App API
const mobile = express();
mobile.use(express.json());

mobile.post('/api/login', login);
mobile.get('/captcha', captcha);
mobile.post('/api/verify-captcha', verifyCaptcha2);
mobile.use(authenticateToken);
mobile.get('/api/getUserCourses', getUserCourses);
mobile.get('/api/getUserInfo', getUserInfo);
mobile.get('/api/getUserUnCompletedQuizzes/:UserID/:CourseID', getUserUnCompletedQuizzes);
mobile.get('/api/getUserCompletedQuizzes/:UserID/:CourseID', getUserCompletedQuizzes);
mobile.get('/api/getQuizQuestions/:QuizID', getQuizQuestions);
mobile.get('/api/getQuestion/:QuestionID', getQuestion);
mobile.get('/api/getQuestions/:QuizID' , getQuestions);
mobile.post('/api/submitQuiz', addUserQuizAnswer);
mobile.post('/api/saveUserQuizQuestionAnswer', saveUserQuizQuestionAnswer);
mobile.get('/api/getUserQuizAnswers/:UserID/:QuizID', getUserQuizAnswers);
mobile.get('/api/getRewards', getRewards);
mobile.get('/api/getReward/:RewardID', getReward);
mobile.get('/api/getCourseMaterials/:CourseID', getCourseMaterials);
mobile.get('/api/getCourseQuizRank', getLeaderboard);
mobile.get('/api/getUserPoint/:UserID', getUserPoint);
mobile.post('/api/redeemReward/:RewardID', redeemReward);

https.createServer(options, mobile).listen(4001, () => {
  const host = new URL(process.env.BASE_URL).host;
  console.log(`Mobile API: https://${host}:4001`);
});