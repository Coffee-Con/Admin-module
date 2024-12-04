require('dotenv').config();

const fs = require('fs'); // For reading the SQL file
const mysql = require('mysql2/promise');
const dbConfig = {
  host: process.env.DBHost || 'localhost',
  port: process.env.DBPort || 3306,
  user: process.env.DBUser || 'root',
  password: process.env.DBPassword || 'Yourpassword',
};

async function setupDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    // Check if the database exists
    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'COMP';`
    );
    if (rows.length === 0) {
      console.log('Database "COMP" does not exist. Creating from mysql.sql...');

      // Read the SQL file
      const sqlScript = fs.readFileSync('./Database/mysql.sql', 'utf-8');

      // Execute the SQL script
      const statements = sqlScript.split(';').filter(stmt => stmt.trim()); // Split into individual statements
      for (const stmt of statements) {
        await connection.query(stmt);
      }

      console.log('Database and tables created successfully from mysql.sql.');
    } else {
      console.log('Database "COMP" already exists. No action taken.');
    }
  } catch (error) {
    console.error('Error setting up the database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();