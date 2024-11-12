require('dotenv').config();

const dbConfig = {
    host: process.env.DBHost || 'localhost',
    port: process.env.DBPort || 3306,
    user: process.env.DBUser || 'root',
    password: process.env.DBPassword || 'Yourpassword',
    database: process.env.DBName || 'COMP'
  };
  
module.exports = dbConfig;
  