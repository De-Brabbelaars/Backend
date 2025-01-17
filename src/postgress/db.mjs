import mysql from 'mysql2/promise';

// Maak een MySQL connectiepool
const pool = mysql.createPool({
  user: 'server',
  password: 'password',
  host: 'localhost',
  port: 3306, // default MySQL port
  database: 'groeneweide',
});

// Controleer of de verbinding succesvol is
(async () => {
  try {
    // Probeer verbinding te maken en een eenvoudige query uit te voeren
    const connection = await pool.getConnection();
    await connection.ping(); // Test de verbinding
    console.log('Succesfully connected to database');
    connection.release(); // Zorg ervoor dat de connectie wordt teruggegeven aan de pool
  } catch (error) {
    console.error('Error when attempting to connect to database:', error.message);
  }
})();

export default pool;
