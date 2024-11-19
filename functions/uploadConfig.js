const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/user/material/");
    },
    filename: (req, file, cb) => {
        // 确保文件名保留原始后缀
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext);
        const timestamp = Date.now(); // 添加时间戳以防止重名
        const newFileName = `${baseName}-${timestamp}${ext}`;
        cb(null, newFileName);
    },
});

const upload = multer({ storage });

module.exports = upload;
