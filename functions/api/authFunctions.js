const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key';  // JWT 秘钥

const crypto = require('crypto');
// 导入数据库配置
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

// 验证 JWT Token 的中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log("Authorization Header:", authHeader); // 打印请求头

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log("Token verification error:", err);
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user; // 将解码后的用户信息存储到 req.user 中
        console.log("Decoded user from token:", req.user); // 添加调试日志
        next();
    });
}

// 登录并生成 JWT Token
function login(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    const query = 'SELECT * FROM User WHERE Email = ?';
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
        }else{ 
            // 生成 JWT Token
            console.log("User from database:", user); // 打印从数据库中获取的用户信息
            console.log("Login successful for user:", email);
            // 确保生成的 JWT 包含 Role 属性
            const token = jwt.sign({ id: user.UserID, email: user.Email, Role: user.Role }, SECRET_KEY, { expiresIn: '8h' });
            res.json({ token });
        }
    }
)};

// 要求登录的中间件
function requireAuth(req, res, next) {
    const token = req.cookies.token; // 从 cookie 中获取 token
  
    if (!token) {
      // 未登录时重定向到登录页面
      return res.redirect('/login.html');
    }
  
    try {
      // 验证 JWT
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded; // 将解码后的用户信息存入 req.user
      next();
    } catch (err) {
      return res.redirect('/login.html'); // token 无效时重定向到登录页面
    }
  }

module.exports = { authenticateToken, login, requireAuth };
