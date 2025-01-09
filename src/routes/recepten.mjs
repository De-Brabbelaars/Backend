import { response, Router } from "express";
import { checkSchema, matchedData, validationResult } from "express-validator";
import pool from "../postgress/db.mjs";
import { receptenCreateValidatie, IDvalidatie, receptenPatchValidatie} from "../utils/validationschemas.mjs";
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
      const newRecipe = {
          id: result.insertId,  // Verkrijg het ID van de net ingevoegde gebruiker
          name: data.Name,
          assetsurl: data.AssetsURL,
          peopleserved: data.PeopleServed,
          preptime: data.PrepTime,
      };

      // Stap 4: Stuur de nieuwe gebruiker als antwoord terug naar de client
      return response.status(201).send(newRecipe); // HTTP status 201 betekent 'Created'

  } catch (err) {

      // Als er een andere fout is, stuur dan een generieke serverfout
      return response.status(500).send({ msg: "Server error" });
  }
});

/**
 * @swagger
 * /api/recepten
 *  post:
 *      Tags:
 * 
 * 
 * 
 */





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







router.put ('/api/recepten/:id', checkSchema(receptenCreateValidatie),  resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const recipeID = request.params.id;

    try {
        
        const [exsisting_recipes] = await pool.query(
            `SELECT * from recipes WHERE RecipesID = ?`,
            [recipeID]
        );
        
        if(exsisting_recipes.length === 0){
            return response.status(400).send({msg: 'No recipes found with given ID'})
        }

        const [exsisting_recipes_name] = await pool.query(
            `SELECT * from recipes WHERE Name = ?`,
            [data.Name]
        )

        if (exsisting_recipes_name.length > 0) {
            return response.status(400).send({ msg: "Name already exists" });
        }
  

        const [updatedRecipes] = await pool.query(
            `UPDATE recipes
             SET AssetsURL = ?, Name = ?, PeopleServed = ?, PrepTime = ?, WHERE recipesID = ?`, // SQL query om een gebruiker toe te voegen
             [data.AssetsURL, data.Name, data.PeopleServed, data.PrepTime, recipeID] // De waarden die in de query moeten worden ingevuld
        );
        
        if (updatedRecipes.affectedRows === 0) {
            return response.status(404).send({ msg: 'No data updated' });  // Als er geen rijen zijn bijgewerkt stuur 404 status
        }
        return response.status(200).send({ msg: 'Data updated successfully' }); //false run 200 status

    } catch (error) {
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }

});





router.patch ('/api/recepten/:id', checkSchema(receptenPatchValidatie),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const recipeID = request.params.id;

    try {
        const [existingRecipe] = await pool.query('SELECT * FROM recipes WHERE recipeID = ?', [recipeID]);

        if (existingRecipe.length === 0) {
            return response.status(404).send({msg: "Recipe not found"}); 
        }

        // toevoegen van dynamische velden.
        const teUpdatenVelden =[];
        const teUpdatenWaarden = [];

        // controleren van alle velden en waarden.
        if(data.recipeID){
            teUpdatenVelden.push(`recipeID = ?`);
            teUpdatenWaarden.push(data.recipeID);
        }
        if(data.AssetsURL){
            teUpdatenVelden.push(`AssetsURL = ?`);
            teUpdatenWaarden.push(data.AssetsURL);
        }
        if(data.Name){
            teUpdatenVelden.push(`Name = ?`);
            teUpdatenWaarden.push(data.Name);
          }
        if(data.PeopleServed){
            teUpdatenVelden.push(`PeopleServed = ?`);
            teUpdatenWaarden.push(data.PeopleServed);
        }
        if(data.PrepTime){
            teUpdatenVelden.push(`PrepTime = ?`);
            teUpdatenWaarden.push(data.PrepTime);
        }
    


        //ProductID toevoegen aan de lijst
        teUpdatenWaarden.push(recipeID);

        if (teUpdatenVelden === 0){
            return response.status(400).send({msg: "there are no fields to update"});
        } 

        // Stap 1: Controleer of de naam van het product al bestaat in de database
        const [existingName] = await pool.query(`SELECT * FROM recipe WHERE Name = ?`, [data.Name]); 

        // Als de e-mail al bestaat, stuur dan een foutmelding terug
        if (existingName.length > 0) {
            return response.status(400).send({ msg: "Product name already exists" });
        }

        //opstellen van de query
        const sqlQuery = `
            UPDATE recipe
            SET ${teUpdatenVelden.join(', ')} WHERE RecipesID = ?
        `;

        //uitvoeren van de query
        const [updatedRecipes] = await pool.query(sqlQuery, teUpdatenWaarden);

        if (updatedRecipes.affectedRows === 0 ){
            return response.status(400).send({msg: "no given values to update"})
        }

        return response.status(200).send({msg: "recipes is updated"})

    } catch (error) {
         // Foutafhandeling: Log de fout en stuur een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});






router.delete('/api/recipe/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request);
    const recipeID = data.id;
    try {
        const [checkenRecipe] = await pool.query(`SELECT * FROM recipe WHERE recipeID = ?`, [recipeID]);
        if (checkenRecipe.length === 0){
            return response.status(404).send({msg: "No recipe found with given recipe id"});
        } else {
            await pool.query(`DELETE FROM recipe WHERE recipeID = ?`, [recipeID]);
            return response.status(200).send({msg: "Recipe is deleted"});
        }
    } catch (error) {
        return response.status(500).send({ msg: "Server error" });
    }
});


export default router;