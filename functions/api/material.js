// 导入数据库配置
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

const path = require('path');
const fs = require('fs');

// 创建 material 文件夹（如果不存在）
const materialFolderPath = path.join(__dirname, 'public/user/material');
if (!fs.existsSync(materialFolderPath)) {
    fs.mkdirSync(materialFolderPath, { recursive: true });
}

const createMaterial = async (req, res) => {
    const { materialData } = req.body;

    // 解析 JSON 格式的数据
    const material = JSON.parse(materialData);
    const { CourseID, MaterialName, MaterialDescription, MaterialType, MaterialLink } = material;

    // 检查上传文件（如果有）
    let materialLinkFinal = MaterialLink;
    if (MaterialType === "2" && req.file) {
        // PDF 文件的保存路径
        materialLinkFinal = `/user/material/${req.file.filename}`;
    }

    const query = `
        INSERT INTO CourseMaterial (CourseID, MaterialName, MaterialDescription, MaterialLink)
        VALUES (?, ?, ?, ?)
    `;
    const values = [CourseID, MaterialName, MaterialDescription, materialLinkFinal];

    connection.query(query, values, (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true, id: result.insertId });
    });
};

const getMaterials = (req, res) => {
    const query = 'SELECT * FROM `CourseMaterial`;';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};

const deleteMaterial = (req, res) => {
    const { MaterialID } = req.params;
    const query = 'DELETE FROM `CourseMaterial` WHERE `MaterialID` = ?;';
    connection.query(query, [MaterialID], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
}

module.exports = { createMaterial, getMaterials, deleteMaterial };
