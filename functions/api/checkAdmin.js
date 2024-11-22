// function/checkAdmin.js


const  checkAdmin = (req, res) => {
    console.log('Request User:', req.user); 
    if (req.user && req.user.Role === 1) {
        res.status(200).send('User is an admin');
    } else {
        res.status(403).send('User is not an admin');
    }
}

module.exports = { checkAdmin };
