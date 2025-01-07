import { response, Router } from "express";
import { checkSchema, matchedData, validationResult } from "express-validator";
import pool from "../postgress/db.mjs";
import { receptenCreateValidatie } from "../utils/validationschemas.mjs";
import { resultValidator } from "../utils/middelwares.mjs";
import cors from 'cors';
import { corsOptions } from "../utils/middelwares.mjs";




const router = Router();


router.post('/api/recepten',  checkSchema(receptenCreateValidatie), resultValidator, cors(corsOptions), async (request, response) => {
  // gevalideerde data wordt opgeslagen in data variabelen
  const data = matchedData(request); 
  try {

      const [existingName] = await pool.query(`SELECT * FROM recipes WHERE Name = ?`, [data.Name]); 

      // Als de e-mail al bestaat, stuur dan een foutmelding terug
      if (existingName.length > 0) {
          return response.status(400).send({ msg: "Name already exists" });
      }

      // Stap 2: Voeg de nieuwe gebruiker toe aan de database
      const [result] = await pool.query(
          `INSERT INTO recipes (Name, AssetsURL, PeopleServed, PrepTime) VALUES (?, ?, ?, ?)`, // SQL query om een gebruiker toe te voegen
          [data.Name, data.AssetsURL, data.PeopleServed, data.PrepTime] // De waarden die in de query moeten worden ingevuld
      );

      // Stap 3: Maak een object aan met de nieuwe gebruiker inclusief hun gegenereerde id
      const newRecipie = {
          id: result.insertId,  // Verkrijg het ID van de net ingevoegde gebruiker
          name: data.Name,
          assetsurl: data.AssetsURL,
          peopleserved: data.PeopleServed,
          preptime: data.PrepTime,
      };

      // Stap 4: Stuur de nieuwe gebruiker als antwoord terug naar de client
      return response.status(201).send(newRecipie); // HTTP status 201 betekent 'Created'

  } catch (err) {

      // Als er een andere fout is, stuur dan een generieke serverfout
      return response.status(500).send({ msg: "Server error" });
  }
});





router.get('/api/recepten', cors(corsOptions), async (request, response) => {
    try {
        const [ophalenRecepten] = await pool.query(`SELECT * FROM recipes`)
        if (ophalenRecepten.length === 0){
            return response.status(404).send({msg: "No recipe found"})
        }
        return response.status(200).json(ophalenRecepten);
    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});




export default router;