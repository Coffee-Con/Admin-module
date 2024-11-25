const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/user/material/");
    },
    filename: (req, file, cb) => {
        // Make sure the file name retains the original suffix
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        const timestamp = Date.now(); // Add timestamp to prevent duplication
        const newFileName = `${baseName}-${timestamp}${ext}`;
        cb(null, newFileName);
    },
});

const upload = multer({ storage });

module.exports = upload;
