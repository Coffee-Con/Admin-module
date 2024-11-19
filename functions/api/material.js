// 导入数据库配置
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

const path = require('path');
const multer = require("multer");
const fs = require('fs');

// 创建 material 文件夹（如果不存在）
const materialFolderPath = path.join(__dirname, '../../public/user/material');
if (!fs.existsSync(materialFolderPath)) {
    fs.mkdirSync(materialFolderPath, { recursive: true });
}

const createMaterial = async (req, res) => {
    const { materialData } = req.body;

    // 解析 JSON 格式的数据
    const material = JSON.parse(materialData);
    const { MaterialName, MaterialDescription, MaterialType, MaterialLink } = material;

    // 检查上传文件（如果有）
    let materialLinkFinal = MaterialLink;
    if (MaterialType == 2 && req.file) {
        // PDF 文件的保存路径
        materialLinkFinal = `/user/material/${req.file.filename}`;
    }

    const query = `
        INSERT INTO Material (MaterialName, MaterialDescription, MaterialType, MaterialLink)
        VALUES (?, ?, ?, ?)
    `;
    const values = [MaterialName, MaterialDescription, MaterialType, materialLinkFinal];

    connection.query(query, values, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true, id: result.insertId });
    });
};

const getMaterials = (req, res) => {
    const query = 'SELECT * FROM `Material`;';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};

const getMaterialsNotInCourse = (req, res) => {
    const { CourseID } = req.params;
    const query = `
        SELECT Material.*
        FROM Material
        WHERE Material.MaterialID NOT IN (
            SELECT MaterialID
            FROM CourseMaterial
            WHERE CourseID = ?
        );
    `;
    connection.query(query, [CourseID], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
}

const deleteMaterial = (req, res) => {
    const { MaterialID } = req.params;
    const query = 'DELETE FROM `Material` WHERE `MaterialID` = ?;';
    connection.query(query, [MaterialID], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
}

const updateMaterial = (req, res) => {
    const { MaterialID, MaterialName, MaterialDescription, MaterialType, MaterialLink } = req.body;
    const query = `
        UPDATE Material
        SET MaterialName = ?, MaterialDescription = ?, MaterialType = ?, MaterialLink = ?
        WHERE MaterialID = ?;
    `;
    connection.query(query, [MaterialName, MaterialDescription, MaterialType, MaterialLink, MaterialID], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
}

const addMaterialToCourse = (req, res) => {
    const { CourseID, MaterialID } = req.body;
    const query = 'INSERT INTO `CourseMaterial` (CourseID, MaterialID) VALUES (?, ?);';
    connection.query(query, [CourseID, MaterialID], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
}

const deleteCourseMaterial = (req, res) => {
    const { CourseID, MaterialID } = req.body;
    const query = 'DELETE FROM `CourseMaterial` WHERE `CourseID` = ? AND `MaterialID` = ?;';
    connection.query(query, [CourseID, MaterialID], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
}

const getCourseMaterials = (req, res) => {
    const { CourseID } = req.params;
    const query = `
        SELECT Material.*
        FROM Material
        JOIN CourseMaterial ON Material.MaterialID = CourseMaterial.MaterialID
        WHERE CourseMaterial.CourseID = ?;
    `;
    connection.query(query, [CourseID], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
}

const uploadMaterial = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/user/material/"); // 设置保存目录
    },
    filename: (req, file, cb) => {
        // 提取原始文件名并保留后缀
        const ext = path.extname(file.originalname); // 获取文件后缀
        const baseName = path.basename(file.originalname, ext); // 去除后缀的文件名
        const timestamp = Date.now(); // 加时间戳防止文件名冲突
        cb(null, `${baseName}-${timestamp}${ext}`);
    },
});

module.exports = { createMaterial, getMaterials, deleteMaterial, addMaterialToCourse, deleteCourseMaterial, getCourseMaterials, getMaterialsNotInCourse, uploadMaterial, updateMaterial };
