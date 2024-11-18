require('dotenv').config();

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.Secret;  // JWT 秘钥
const crypto = require('crypto');
const svgCaptcha = require('svg-captcha');

// 导入数据库配置
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

// 验证 JWT Token 的中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // console.log("Authorization Header:", authHeader); // 打印请求头

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log("Token verification error:", err);
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user; // 将解码后的用户信息存储到 req.user 中
        // console.log("Decoded user from token:", req.user); // 添加调试日志
        next();
    });
}

// 登录并生成 JWT Token
const login = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    const query = 'SELECT * FROM User WHERE Email = ?';
    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error querying the database:', err.stack);
            return res.status(500).send('Internal server error');
        }

        if (results.length === 0) {
            return res.status(401).send('Email error'); // change to email and password error
        }

        const user = results[0];
        const hashedPW = crypto.createHash('md5').update(password + user.Salt).digest('hex');

        if (hashedPW !== user.HashedPW) {
            return res.status(401).send('Password error'); // change to email and password error
        } else {
            // 生成 JWT Token
            // console.log("User from database:", user); // 打印从数据库中获取的用户信息
            // console.log("Login successful for user:", email);
            // 确保生成的 JWT 包含 Role 属性
            const token = jwt.sign({ id: user.UserID, email: user.Email, Role: user.Role }, SECRET_KEY, { expiresIn: '8h' });
            res.json({ token });
        }
    }
    )
};

const webLogin = (req, res) => {
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
            return res.status(401).send('Password error'); // change to email and password error
        } else {
            const token = jwt.sign({ id: user.UserID, email: user.Email, Role: user.Role }, SECRET_KEY, { expiresIn: '8h' });
            res.cookie('token', token, { httpOnly: true });
        }

        // 根据用户角色跳转到不同页面
        if (user.Role === 0) {
            res.redirect('/user'); // 404 后续修改
        } else if (user.Role === 1) {
            res.redirect('/admin/index.html');
        } else {
            res.status(401).send('Unknown role'); // 如果出现需要修改
        }
    });
};

// logout
const logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login.html');
};

// 要求登录的中间件
const requireAuth = (req, res, next) => {
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

const captcha = (req, res) => {
    const captcha = svgCaptcha.create({
        noise: 2, // 噪点数量
        color: true, // 生成彩色验证码
        background: '#ccffcc', // 背景颜色
        ignoreChars: '0o1i', // 忽略容易混淆的字符
    });

    // 将验证码文本保存到 session 中
    req.session.captcha = captcha.text;

    // 返回 SVG 图片
    res.type('svg');
    res.status(200).send(captcha.data);
}

const authenticate = (req, res, next) => {
    // 先尝试从 Authorization Header 获取 token
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];

    // 再尝试从 cookie 中获取 token
    const cookieToken = req.cookies.token;

    // 优先使用 Authorization Header 中的 token，否则使用 cookie 中的 token
    const token = headerToken || cookieToken;

    if (!token) {
        // 如果没有提供 token，返回 401 未授权错误（Authorization Header）
        // 或者重定向到登录页面（cookie）
        if (!cookieToken) {
            return res.redirect('/login.html');
        } else {
            return res.status(401).json({ message: 'No token provided' });
        }
    }

    // 验证 JWT token
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log("Token verification error:", err);
            // 如果验证失败，且是从 cookie 中获取 token，则重定向到登录页面
            if (cookieToken) {
                return res.redirect('/login.html');
            }
            return res.status(403).json({ message: 'Invalid token' });
        }

        // 将解码后的用户信息存储到 req.user 中
        req.user = user;

        // 如果是通过 Authorization Header 访问，不进行重定向，继续执行后续操作
        next();
    });
};

module.exports = { authenticateToken, login, requireAuth, webLogin, logout, captcha, authenticate };