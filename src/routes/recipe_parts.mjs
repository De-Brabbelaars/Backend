import { response, Router } from "express";
import { checkSchema, matchedData, validationResult } from "express-validator";
import pool from "../postgress/db.mjs";
import { receptenPartsValidatie, IDvalidatie, receptenPartsPatchValidatie} from "../utils/validationschemas.mjs";
import { resultValidator } from "../utils/middelwares.mjs";
import cors from 'cors';
import { corsOptions } from "../utils/middelwares.mjs";


const router = Router();


/**
 * @swagger
 * /api/recipe_parts:
 *   post:
 *     tags:
 *       - Recipe Parts
 *     summary: Add a new recipe part
 *     description: |
 *       This endpoint adds a new recipe part to the database. It validates all required fields and ensures that the recipe name is unique.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - RecipeID
 *               - ProductID
 *               - Amount
 *             properties:
 *               RecipeID:
 *                 type: integer
 *                 description: ID of the recipe
 *                 example: 2
 *               ProductID:
 *                 type: integer
 *                 description: ID of the product
 *                 example: 1
 *               Amount:
 *                 type: integer
 *                 description: Amount of the product required
 *                 example: 1
 *     responses:
 *       201:
 *         description: Recipe part created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recipeID:
 *                   type: integer
 *                   description: ID of the recipe
 *                   example: 2
 *                 productID:
 *                   type: integer
 *                   description: ID of the product
 *                   example: 1
 *                 amount:
 *                   type: integer
 *                   description: Amount of the product required
 *                   example: 1
 *       400:
 *         description: Bad Request - Name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Name already exists
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Server error
 */


router.post('/api/recipe_parts',  checkSchema(receptenPartsValidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    try {
        // Stap 1: Controleer of de e-mail van de nieuwe gebruiker al bestaat in de database
        // existingUser bevat de eerste gevonden gebruiker die voldoet aan data.email of undefined als er geen match is.
        const [existingProductID] = await pool.query(`SELECT * FROM products WHERE ProductID = ?`, [data.ProductID]); 

        // Als de e-mail al bestaat, stuur dan een foutmelding terug
        if (existingProductID.length === 0) {
            return response.status(400).send({ msg: "No product found with given product ID" });
        }

        const [existingRecipeID] = await pool.query(`SELECT * FROM recipes WHERE RecipeID = ?`, [data.RecipeID]); 

        // Als de e-mail al bestaat, stuur dan een foutmelding terug
        if (existingRecipeID.length === 0) {
            return response.status(400).send({ msg: "No recipe found with given ID" });
        }

        // Stap 2: Voeg de nieuwe gebruiker toe aan de database
        await pool.query(
            `INSERT INTO recipe_parts (ProductID, RecipeID, Amount) VALUES (?, ?, ?)`, // SQL query om een gebruiker toe te voegen
            [data.ProductID, data.RecipeID, data.Amount,] // De waarden die in de query moeten worden ingevuld
        );

        // Stap 3: Maak een object aan met de nieuwe gebruiker inclusief hun gegenereerde id
        const newRecipe_parts = {
            productid: data.ProductID,
            recipeID: data.RecipeID,
            amount: data.Amount,
        };

        // Stap 4: Stuur de nieuwe gebruiker als antwoord terug naar de client
        return response.status(201).send(newRecipe_parts); // HTTP status 201 betekent 'Created'

    } catch (err) {
        console.log(error.message);
        // Als er een andere fout is, stuur dan een generieke serverfout
        return response.status(500).send({ msg: "Server error" });
    }
});




/**
 * @swagger
 * /api/recipe_parts:
 *   get:
 *     tags:
 *       - Recipe Parts
 *     summary: Retrieve all recipe parts
 *     description: |
 *       This endpoint retrieves all recipe parts from the database. 
 *       If no recipe parts are found, it returns a 404 response.
 *     responses:
 *       200:
 *         description: A list of all recipe parts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Unique identifier for the recipe part.
 *                     example: 1
 *                   name:
 *                     type: string
 *                     description: Name of the recipe part.
 *                     example: "Tomato Sauce"
 *                   description:
 *                     type: string
 *                     description: Description of the recipe part.
 *                     example: "A base sauce for pasta dishes."
 *       404:
 *         description: No recipe parts found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "No recipe found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: "Internal server error"
 */
  
router.get('/api/recipe_parts', cors(corsOptions), async (request, response) => {
    try {
    const [ophalenReceptenParts] = await pool.query(`SELECT * FROM recipe_parts`)
        if (ophalenReceptenParts.length === 0){
            return response.status(404).send({msg: "No recipe found"})
    }
    return response.status(200).json(ophalenReceptenParts);
    } catch (error) {
        console.log(error.message);
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});



/**
 * @swagger
 * /api/recipe_parts/{id}:
 *   put:
 *     tags:
 *       - Recipe Parts
 *     summary: Update a recipe part
 *     description: |
 *       This endpoint updates the `ProductID` and `Amount` of a recipe part, 
 *       identified by the `RecipeID` provided in the URL. 
 *       You can update the `ProductID` and `Amount` of the existing recipe part.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the recipe part to be updated
 *         schema:
 *           type: integer
 *           example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ProductID:
 *                 type: integer
 *                 description: ID of the product.
 *                 example: 3
 *               Amount:
 *                 type: integer
 *                 description: The amount of the product.
 *                 example: 5
 *     responses:
 *       200:
 *         description: Recipe part updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Data updated successfully'
 *       400:
 *         description: Invalid input or no data to update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'No data updated'
 *       404:
 *         description: Recipe part not found or no matching records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'No recipes found with given ID'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Internal server error'
 */





router.put('/api/recipe_parts/:id', checkSchema(receptenPartsPatchValidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request);
    const recipeID = request.params.id;

    try {
        const [existing_recipes_parts] = await pool.query(
            `SELECT * FROM recipe_parts WHERE RecipeID = ?`,
            [recipeID]
        );

        if (existing_recipes_parts.length === 0) {
            return response.status(404).send({ msg: 'No recipes found with given ID' });
        }


        const [updatedRecipes_parts] = await pool.query(
            `UPDATE recipe_parts
             SET ProductID = ?, Amount = ?
             WHERE RecipeID = ?`,
            [data.ProductID, data.Amount, recipeID]
        );

        if (updatedRecipes_parts.affectedRows === 0) {
            return response.status(404).send({ msg: 'No data updated' });
        }

        return response.status(200).send({ msg: 'Data updated successfully' });

    } catch (error) {
        console.log(error.message);
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});




/**
 * @swagger
 * /api/recipe_parts/{id}:
 *   patch:
 *     tags:
 *       - Recipe Parts
 *     summary: Update a recipe part
 *     description: |
 *       This endpoint allows you to update the `ProductID` and `Amount` of a recipe part identified by the `RecipeID` provided in the URL. 
 *       You can update the `ProductID` and `Amount` fields of the existing recipe part. The recipe part is updated only if the provided data contains valid fields.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the recipe part to be updated
 *         schema:
 *           type: integer
 *           example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ProductID:
 *                 type: integer
 *                 description: The ID of the product associated with the recipe part.
 *                 example: 3
 *               Amount:
 *                 type: integer
 *                 description: The amount of the product in the recipe part.
 *                 example: 5
 *     responses:
 *       200:
 *         description: Recipe part updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Data updated successfully'
 *       400:
 *         description: Invalid input or no fields to update
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'There are no fields to update'
 *       404:
 *         description: Recipe part not found or no matching records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Recipe part not found'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Internal server error'
 */

 


router.patch('/api/recipe_parts/:id', checkSchema(receptenPartsPatchValidatie), checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request);
    const recipeID = request.params.id;

    try {
        // Stap 1: Controleer of het recept bestaat
        const [existingRecipeParts] = await pool.query('SELECT * FROM recipe_parts WHERE RecipeID = ?', [recipeID]);

        if (existingRecipeParts.length === 0) {
            return response.status(404).send({ msg: 'Recipe part not found' });
        }

        // Stap 2: Dynamisch bepalen welke velden worden bijgewerkt
        const teUpdatenVelden = [];
        const teUpdatenWaarden = [];

        // Controleer voor elk veld of het aanwezig is en voeg toe aan de lijst voor update
        if (data.ProductID) {
            teUpdatenVelden.push('ProductID = ?');
            teUpdatenWaarden.push(data.ProductID);
        }
        if (data.Amount) {
            teUpdatenVelden.push('Amount = ?');
            teUpdatenWaarden.push(data.Amount);
        }

        // Voeg het recipeID toe als laatste parameter voor de WHERE-clausule
        teUpdatenWaarden.push(recipeID);

        // Stap 3: Controleer of er velden zijn om bij te werken
        if (teUpdatenVelden.length === 0) {
            return response.status(400).send({ msg: 'There are no fields to update' });
        }

        // Stap 5: Opstellen van de dynamische update query
        const sqlQuery = `
            UPDATE recipe_parts
            SET ${teUpdatenVelden.join(', ')}
            WHERE RecipeID = ?
        `;

        // Stap 6: Voer de update query uit
        const [updatedRecipesParts] = await pool.query(sqlQuery, teUpdatenWaarden);

        if (updatedRecipesParts.affectedRows === 0) {
            return response.status(404).send({ msg: 'No data updated' });
        }

        return response.status(200).send({ msg: 'Data updated successfully' });

    } catch (error) {
        console.log(error.message);
         // Foutafhandeling: Log de fout en stuur een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});





/**
 * @swagger
 * /api/recipe_parts/{id}:
 *   delete:
 *     tags:
 *       - Recipe Parts
 *     summary: Delete a recipe part by ID
 *     description: |
 *       This endpoint deletes a recipe part from the `recipe_parts` table, identified by the `RecipeID` provided in the URL. 
 *       If no recipe part is found with the given ID, it will return a 404 error. 
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the recipe part to be deleted
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       200:
 *         description: Recipe part deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Recipe is deleted'
 *       404:
 *         description: No recipe part found with the given RecipeID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'No recipe found with given recipe id'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Server error'
 */



router.delete('/api/recipe_parts/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request);
    const recipeID = data.id;
    try {
        const [checkenRecipeID] = await pool.query(`SELECT * FROM recipe_parts WHERE RecipeID = ?`, [recipeID]);
        if (checkenRecipeID.length === 0){
            return response.status(404).send({msg: "No recipe found with given recipe id"});
        } else {
            await pool.query(`DELETE FROM recipe_parts WHERE RecipeID = ?`, [recipeID]);
            return response.status(200).send({msg: "Recipe is deleted"});
        }
    } catch (error) {
        console.log(error.message);
        return response.status(500).send({ msg: "Server error" });
    }
});


export default router;