// function/checkAdmin.js

// 检查用户是否为管理员
const  checkAdmin = (req, res) => {
    console.log('Request User:', req.user); // 添加调试日志
    if (req.user && req.user.Role === 1) {
        res.status(200).send('User is an admin');
    } else {
        res.status(403).send('User is not an admin');
    }
}

module.exports = { checkAdmin };
