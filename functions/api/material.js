// Import database config
const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

const path = require('path');
const fs = require('fs');

const host = new URL(process.env.BASE_URL).host;

// Create a material folder if it does not exist
const materialFolderPath = path.join(__dirname, '../../public/user/material');
if (!fs.existsSync(materialFolderPath)) {
    fs.mkdirSync(materialFolderPath, { recursive: true });
}

const createMaterial = async (req, res) => {
    const { materialData } = req.body;

    // Parsing JSON formatted data
    const material = JSON.parse(materialData);
    const { MaterialName, MaterialDescription, MaterialType, MaterialLink } = material;

    console.log(req.file);

    // Check uploaded file (if any)
    let materialLinkFinal = MaterialLink;
    if (MaterialType == 2 && req.file) {
        // The path where the PDF file is saved
        materialLinkFinal = `https://${host}/user/material/${req.file.filename}`;
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

module.exports = { createMaterial, getMaterials, deleteMaterial, addMaterialToCourse, deleteCourseMaterial, getCourseMaterials, getMaterialsNotInCourse, updateMaterial };
