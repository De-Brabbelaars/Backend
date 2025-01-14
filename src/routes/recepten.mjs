import { response, Router } from "express";
import { checkSchema, matchedData, validationResult } from "express-validator";
import pool from "../postgress/db.mjs";
import { receptenCreateValidatie, IDvalidatie, receptenPatchValidatie} from "../utils/validationschemas.mjs";
import { resultValidator } from "../utils/middelwares.mjs";
import cors from 'cors';
import { corsOptions } from "../utils/middelwares.mjs";




const router = Router();


/**
 * @swagger
 * /api/recepten:
 *   post:
 *     tags:
 *       - Recepten
 *     summary: Voeg een nieuw recept toe
 *     description: |
 *       Dit endpoint voegt een nieuw recept toe aan de database. Controleert of alle vereiste velden correct zijn ingevuld en of de naam van het recept uniek is.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Name
 *               - AssetsURL
 *               - PeopleServed
 *               - PrepTime
 *             properties:
 *               Name:
 *                 type: string
 *                 description: Naam van het recept
 *                 example: Spaghetti Bolognese
 *               AssetsURL:
 *                 type: string
 *                 format: uri
 *                 description: URL naar een afbeelding of asset van het recept
 *                 example: https://example.com/assets/spaghetti.jpg
 *               PeopleServed:
 *                 type: string
 *                 description: Aantal personen waarvoor het recept geschikt is
 *                 example: 4
 *               PrepTime:
 *                 type: string
 *                 description: Bereidingstijd in minuten
 *                 example: 01:30
 *     responses:
 *       201:
 *         description: Recept succesvol aangemaakt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: Unieke ID van het aangemaakte recept
 *                   example: 1
 *                 name:
 *                   type: string
 *                   description: Naam van het recept
 *                   example: Spaghetti Bolognese
 *                 assetsurl:
 *                   type: string
 *                   description: URL van de afbeelding of asset
 *                   example: https://example.com/assets/spaghetti.jpg
 *                 peopleserved:
 *                   type: string
 *                   description: Aantal personen
 *                   example: 4
 *                 preptime:
 *                   type: string
 *                   description: Bereidingstijd in minuten
 *                   example: 01:30
 *       400:
 *         description: Receptnaam bestaat al
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Name already exists
 *       500:
 *         description: Serverfout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Server error
 */


router.post('/api/recepten',  checkSchema(receptenCreateValidatie), resultValidator, cors(corsOptions), async (request, response) => {
  // gevalideerde data wordt opgeslagen in data variabelen
  const data = matchedData(request); 
  try {

      const [existingName] = await pool.query(`SELECT * FROM recipes WHERE Name = ?`, [data.Name]); 

      // Als de naam al bestaat, stuur dan een foutmelding terug
      if (existingName.length > 0) {
          return response.status(400).send({ msg: "Name already exists" });
      }

      // Stap 2: Voeg de het nieuwe recept toe aan de database
      const [result] = await pool.query(
          `INSERT INTO recipes (Name, AssetsURL, PeopleServed, PrepTime) VALUES (?, ?, ?, ?)`, // SQL query om een recept toe te voegen
          [data.Name, data.AssetsURL, data.PeopleServed, data.PrepTime] // De waarden die in de query moeten worden ingevuld
      );

      // Stap 3: Maak een object aan met het nieuwe recept inclusief het gegenereerde id
      const newRecipe = {
          id: result.insertId,  // Verkrijg het ID van de net ingevoegde recept
          name: data.Name,
          assetsurl: data.AssetsURL,
          peopleserved: data.PeopleServed,
          preptime: data.PrepTime,
      };

      // Stap 4: Stuur het nieuwe recept als antwoord terug naar de client
      return response.status(201).send(newRecipe); // HTTP status 201 betekent 'Created'

  } catch (err) {
      // Als er een andere fout is, stuur dan een generieke serverfout
      return response.status(500).send({ msg: "Server error" });
  }
});





/**
 * @swagger
 * /api/recepten:
 *   get:
 *     tags:
 *       - Recepten
 *     summary: Haal alle recepten op
 *     description: Dit endpoint haalt alle recepten op uit de database.
 *     responses:
 *       200:
 *         description: Succesvol alle recepten opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Unieke ID van het recept
 *                     example: 1
 *                   name:
 *                     type: string
 *                     description: Naam van het recept
 *                     example: Spaghetti Bolognese
 *                   assetsurl:
 *                     type: string
 *                     format: uri
 *                     description: URL van een afbeelding of asset van het recept
 *                     example: https://example.com/assets/spaghetti.jpg
 *                   peopleserved:
 *                     type: string
 *                     description: Aantal personen waarvoor het recept geschikt is
 *                     example: 4
 *                   preptime:
 *                     type: string
 *                     description: Bereidingstijd in minuten
 *                     example: 01:30
 *       404:
 *         description: Geen recepten gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No recipe found
 *       500:
 *         description: Interne serverfout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Internal server error
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





/**
 * @swagger
 * /api/recepten/{id}:
 *   put:
 *     tags:
 *       - Recepten
 *     summary: Werk een bestaand recept bij
 *     description: Dit endpoint werkt een bestaand recept bij in de database op basis van het opgegeven ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Het unieke ID van het recept dat moet worden bijgewerkt.
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Name
 *               - AssetsURL
 *               - PeopleServed
 *               - PrepTime
 *             properties:
 *               Name:
 *                 type: string
 *                 description: Nieuwe naam van het recept
 *                 example: Spaghetti Carbonara
 *               AssetsURL:
 *                 type: string
 *                 format: uri
 *                 description: URL naar een afbeelding of asset van het recept
 *                 example: https://example.com/assets/carbonara.jpg
 *               PeopleServed:
 *                 type: string
 *                 description: Aantal personen waarvoor het recept geschikt is
 *                 example: 2
 *               PrepTime:
 *                 type: string
 *                 description: Bereidingstijd in minuten
 *                 example: 00:45
 *     responses:
 *       200:
 *         description: Recept succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Data updated successfully
 *       400:
 *         description: Ongeldige invoer of naam van recept bestaat al
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Name already exists
 *       404:
 *         description: Geen recepten gevonden met het opgegeven ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No recipes found with given ID
 *       500:
 *         description: Interne serverfout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Internal server error
 */


router.put ('/api/recepten/:id', checkSchema(receptenCreateValidatie),  resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const recipeID = request.params.id;

    try {
        
        const [exsisting_recipes] = await pool.query(
            `SELECT * FROM recipes WHERE RecipeID = ?`,
            [recipeID]);
        
        if(exsisting_recipes.length === 0){
            return response.status(400).send({msg: 'No recipes found with given ID'})
        }

        const [exsisting_recipes_name] = await pool.query(
            `SELECT * FROM recipes WHERE Name = ?`,
            [data.Name]
        )

        if (exsisting_recipes_name.length > 0) {
            return response.status(400).send({ msg: "Name already exists" });
        }
  

        const [updatedRecipes] = await pool.query(
            `UPDATE recipes
             SET AssetsURL = ?, Name = ?, PeopleServed = ?, PrepTime = ? WHERE recipeID = ?`, // SQL query om een gebruiker toe te voegen
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



/**
 * @swagger
 * /api/recepten/{id}:
 *   patch:
 *     tags:
 *       - Recepten
 *     summary: Werk specifieke velden van een recept bij
 *     description: Dit endpoint werkt specifieke velden van een recept bij op basis van het opgegeven ID. Alleen de opgegeven velden worden bijgewerkt.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Het unieke ID van het recept dat moet worden bijgewerkt.
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeID:
 *                 type: integer
 *                 description: Unieke ID van het recept
 *                 example: 1
 *               Name:
 *                 type: string
 *                 description: Nieuwe naam van het recept
 *                 example: Spaghetti Carbonara
 *               AssetsURL:
 *                 type: string
 *                 format: uri
 *                 description: URL naar een afbeelding of asset van het recept
 *                 example: https://example.com/assets/carbonara.jpg
 *               PeopleServed:
 *                 type: string
 *                 description: Aantal personen waarvoor het recept geschikt is
 *                 example: 2
 *               PrepTime:
 *                 type: string
 *                 description: Bereidingstijd in minuten
 *                 example: 00:45
 *     responses:
 *       200:
 *         description: Recept succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Recipe is updated
 *       400:
 *         description: Ongeldige invoer of geen velden om bij te werken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: There are no fields to update
 *       404:
 *         description: Recept niet gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Recipe not found
 *       500:
 *         description: Interne serverfout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Internal server error
 */

router.patch('/api/recepten/:id', checkSchema(receptenPatchValidatie), checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request); 
    const recipeID = request.params.id;

    try {
        const [existingRecipe] = await pool.query('SELECT * FROM recipes WHERE recipeID = ?', [recipeID]);

        if (existingRecipe.length === 0) {
            return response.status(404).send({ msg: "Recipe not found" }); 
        }

        const teUpdatenVelden = [];
        const teUpdatenWaarden = [];

        // Controleer en voeg dynamische velden toe
        if (data.AssetsURL) {
            teUpdatenVelden.push('AssetsURL = ?');
            teUpdatenWaarden.push(data.AssetsURL);
        }
        if (data.Name) {
            teUpdatenVelden.push('Name = ?');
            teUpdatenWaarden.push(data.Name);
        }
        if (data.PeopleServed) {
            teUpdatenVelden.push('PeopleServed = ?');
            teUpdatenWaarden.push(data.PeopleServed);
        }
        if (data.PrepTime) {
            teUpdatenVelden.push('PrepTime = ?');
            teUpdatenWaarden.push(data.PrepTime);
        }

        if (teUpdatenVelden.length === 0) {
            return response.status(400).send({ msg: "There are no fields to update" });
        }

        // Valideer uniekheid van de naam alleen als Name wordt bijgewerkt
        if (data.Name) {
            const [existingName] = await pool.query('SELECT * FROM recipes WHERE Name = ? AND recipeID != ?', [data.Name, recipeID]);
            if (existingName.length > 0) {
                return response.status(400).send({ msg: "Recipe name already exists" });
            }
        }

        // Update query
        const sqlQuery = `
            UPDATE recipes
            SET ${teUpdatenVelden.join(', ')} WHERE recipeID = ?
        `;
        teUpdatenWaarden.push(recipeID);

        const [updatedRecipes] = await pool.query(sqlQuery, teUpdatenWaarden);

        if (updatedRecipes.affectedRows === 0) {
            return response.status(400).send({ msg: "No given values to update" });
        }

        return response.status(200).send({ msg: "Recipe is updated" });

    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});



/**
 * @swagger
 * /api/recipe/{id}:
 *   delete:
 *     tags:
 *       - Recepten
 *     summary: Verwijder een recept
 *     description: Dit endpoint verwijdert een recept op basis van een gegeven ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: De unieke ID van het recept dat verwijderd moet worden.
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Recept succesvol verwijderd.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Recipe is deleted
 *       404:
 *         description: Geen recept gevonden met het gegeven ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No recipe found with given recipe id
 *       500:
 *         description: Interne serverfout.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Server error
 */


router.delete('/api/recipe/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request);
    const recipeID = data.id;
    try {
        const [checkenRecipe] = await pool.query(`SELECT * FROM recipes WHERE recipeID = ?`, [recipeID]);
        if (checkenRecipe.length === 0){
            return response.status(404).send({msg: "No recipe found with given recipe ID"});
        } else {
            await pool.query(`DELETE FROM recipes WHERE recipeID = ?`, [recipeID]);
            return response.status(200).send({msg: "Recipe is deleted"});
        }
    } catch (error) {
        return response.status(500).send({ msg: "Server error" });
    }
});


export default router;