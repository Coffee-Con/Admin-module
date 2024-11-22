require('dotenv').config();

const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.Secret;  
const crypto = require('crypto');
const svgCaptcha = require('svg-captcha');


const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // console.log("Authorization Header:", authHeader); 

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log("Token verification error:", err);
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user; 

        next();
    });
}

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


        if (user.Role === 0) {
            res.redirect('/user'); 
        } else if (user.Role === 1) {
            res.redirect('/admin/index.html');
        } else {
            res.status(401).send('Unknown role'); 
        }
    });
};

// logout
const logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login.html');
};


const requireAuth = (req, res, next) => {
    const token = req.cookies.token; 

    if (!token) {

        return res.redirect('/login.html');
    }

    try {

        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; 
        next();
    } catch (err) {
        return res.redirect('/login.html'); 
    }
}

const captcha = (req, res) => {
    const captcha = svgCaptcha.create({
        noise: 2, 
        color: true, 
        background: '#ccffcc', 
        ignoreChars: '0o1i', 
    });


    req.session.captcha = captcha.text;


    res.type('svg');
    res.status(200).send(captcha.data);
}

const authenticate = (req, res, next) => {

    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];


    const cookieToken = req.cookies.token;


    const token = headerToken || cookieToken;

    if (!token) {

        if (!cookieToken) {
            return res.redirect('/login.html');
        } else {
            return res.status(401).json({ message: 'No token provided' });
        }
    }


    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log("Token verification error:", err);
 
            if (cookieToken) {
                return res.redirect('/login.html');
            }
            return res.status(403).json({ message: 'Invalid token' });
        }


        req.user = user;


        next();
    });
};

module.exports = { authenticateToken, login, requireAuth, webLogin, logout, captcha, authenticate };