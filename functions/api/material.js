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
    const { MaterialName, MaterialDescription, MaterialType, MaterialLink } = material;

    // 检查上传文件（如果有）
    let materialLinkFinal = MaterialLink;
    if (MaterialType === "2" && req.file) {
        // PDF 文件的保存路径
        materialLinkFinal = `/user/material/${req.file.filename}`;
    }

    const query = `
        INSERT INTO Material (MaterialName, MaterialDescription, MaterialLink)
        VALUES (?, ?, ?)
    `;
    const values = [MaterialName, MaterialDescription, materialLinkFinal];

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

module.exports = { createMaterial, getMaterials, deleteMaterial, addMaterialToCourse, deleteCourseMaterial, getCourseMaterials, getMaterialsNotInCourse };
