import mysql from 'mysql2/promise';

// Maak een MySQL connectiepool
const pool = mysql.createPool({
  user: 'root',
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
    console.log('Succesvol verbonden met de database!');
    connection.release(); // Zorg ervoor dat de connectie wordt teruggegeven aan de pool
  } catch (error) {
    console.error('Fout bij verbinden met de database:', error.message);
  }
})();

export default pool;
