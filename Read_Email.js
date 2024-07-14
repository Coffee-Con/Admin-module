const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'yourpassword',
  database: 'COMP'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

const query = 'SELECT Email FROM user';

connection.query(query, (error, results, fields) => {
  if (error) {
    console.error('Error executing query:', error.stack);
    return;
  }
  console.log('Emails:');
  results.forEach((row) => {
    console.log(row.Email);
  });
});

connection.end((err) => {
  if (err) {
    console.error('Error ending the connection:', err.stack);
    return;
  }
  console.log('Connection closed.');
});
