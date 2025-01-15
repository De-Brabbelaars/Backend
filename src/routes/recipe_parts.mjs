import { response, Router } from "express";
import { checkSchema, matchedData, validationResult } from "express-validator";
import pool from "../postgress/db.mjs";
import { receptenPartsValidatie, IDvalidatie, receptenPatchValidatie} from "../utils/validationschemas.mjs";
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
  
        const [existingName] = await pool.query(`SELECT * FROM recipes WHERE Name = ?`, [data.Name]); 
  
        // Als de e-mail al bestaat, stuur dan een foutmelding terug
        if (existingName.length > 0) {
            return response.status(400).send({ msg: "Name already exists" });
        }
  
        // Stap 2: Voeg de nieuwe gebruiker toe aan de database
        const [result] = await pool.query(
            `INSERT INTO recipes (RecipeID, ProductID, Amount) VALUES (?, ?, ?)`, // SQL query om een gebruiker toe te voegen
            [data.RecipeID, data.ProductID, data.Amount] // De waarden die in de query moeten worden ingevuld
        );
  
        // Stap 3: Maak een object aan met de nieuwe gebruiker inclusief hun gegenereerde id
        const newRecipe = {
            recipeID: data.RecipeID,
            productID: data.ProductID,
            amount: data.Amount,
        };
  
        // Stap 4: Stuur de nieuwe gebruiker als antwoord terug naar de client
        return response.status(201).send(newRecipe); // HTTP status 201 betekent 'Created'
  
    } catch (err) {
  
        // Als er een andere fout is, stuur dan een generieke serverfout
        return response.status(500).send({ msg: "Server error" });
    }
  });





  
router.get('/api/recipe_parts', cors(corsOptions), async (request, response) => {
    try {
    const [ophalenReceptenParts] = await pool.query(`SELECT * FROM recipes`)
        if (ophalenReceptenParts.length === 0){
            return response.status(404).send({msg: "No recipe found"})
    }
    return response.status(200).json(ophalenReceptenParts);
    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});






router.put ('/api/recipe_parts/:id', checkSchema(receptenPartsValidatie),  resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const recipeID = request.params.id;

    try {
        
        const [exsisting_recipes_parts] = await pool.query(
            `SELECT * from recipes WHERE RecipesID = ?`,
            [recipeID]
        );
        
        if(exsisting_recipes_parts.length === 0){
            return response.status(400).send({msg: 'No recipes found with given ID'})
        }

        const [exsisting_recipes_parts_name] = await pool.query(
            `SELECT * from recipes WHERE Name = ?`,
            [data.Name]
        )

        if (exsisting_recipes_parts_name.length > 0) {
            return response.status(400).send({ msg: "Name already exists" });
        }
  

        const [updatedRecipes_parts] = await pool.query(
            `UPDATE recipes
             SET RecipeID = ?, ProductID = ?, Amount = ?`, // SQL query om een gebruiker toe te voegen
             [data.RecipeID, data.ProductID, data.Amount] // De waarden die in de query moeten worden ingevuld
        );
        
        if (updatedRecipes_parts.affectedRows === 0) {
            return response.status(404).send({ msg: 'No data updated' });  // Als er geen rijen zijn bijgewerkt stuur 404 status
        }
        return response.status(200).send({ msg: 'Data updated successfully' }); //false run 200 status

    } catch (error) {
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }

});





router.patch ('/api/recipe_parts/:id', checkSchema(receptenPartsPatchValidatie),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const recipeID = request.params.id;

    try {
        const [existingRecipeParts] = await pool.query('SELECT * FROM recipes WHERE recipeID = ?', [recipeID]);

        if (existingRecipeParts.length === 0) {
            return response.status(404).send({msg: "Recipe not found"}); 
        }

        // toevoegen van dynamische velden.
        const teUpdatenVelden =[];
        const teUpdatenWaarden = [];

        // controleren van alle velden en waarden.
        if(data.rRcipeID){
            teUpdatenVelden.push(`RecipeID = ?`);
            teUpdatenWaarden.push(data.RecipeID);
        }
        if(data.ProductID){
            teUpdatenVelden.push(`ProductID = ?`);
            teUpdatenWaarden.push(data.ProductID);
        }
        if(data.Amount){
            teUpdatenVelden.push(`Amount = ?`);
            teUpdatenWaarden.push(data.Amount);
          }
        

        //ProductID toevoegen aan de lijst
        teUpdatenWaarden.push(RecipeID);

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
        const [updatedRecipesParts] = await pool.query(sqlQuery, teUpdatenWaarden);

        if (updatedRecipesParts.affectedRows === 0 ){
            return response.status(400).send({msg: "no given values to update"})
        }

        return response.status(200).send({msg: "recipes is updated"})

    } catch (error) {
         // Foutafhandeling: Log de fout en stuur een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});



router.delete('/api/recipe_parts/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request);
    const recipeID = data.id;
    try {
        const [checkenRecipeID] = await pool.query(`SELECT * FROM recipe WHERE recipeID = ?`, [recipeID]);
        if (checkenRecipeID.length === 0){
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