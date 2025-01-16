import mysql from 'mysql2/promise';

// Maak een MySQL connectiepool
const pool = mysql.createPool({
  user: 'root',
  password: '',
  host: 'localhost',
  port: 3306, // default Postgres port
  database: 'groeneweide'
});

export default pool;



