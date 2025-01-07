import { response, Router } from "express";
import { checkSchema, matchedData, validationResult } from "express-validator";
import pool from "../postgress/db.mjs";
import { receptenCreateValidatie, IDvalidatie} from "../utils/validationschemas.mjs";
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







router.get('/api/recepten', cors(corsOptions), async (request, response) => {
    try {
        const [ophalenRecepten] = await pool.query(`SELECT * FROM recipes`)
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
    const ProductID = request.params.id;

    try {
        
        const [exsisting_product] = await pool.query(
            `SELECT * from recipes WHERE Name = ?`,
            [data.Name]
        );
        
        if(exsisting_product.length !== 0){
            return response.status(400).send({msg: 'recipes name already exsists'})
        }

        const [invalid_category_id] = await pool.query(
            `SELECT * from recipes_categories WHERE RecipesID = ?`,
            [data.recipesID]
        );
        
        if(invalid_category_id.length === 0){
            return response.status(400).send({msg: 'invalid recipes ID'})
        }

        const [updatedRecipes] = await pool.query(
            `UPDATE recipes
             SET RecipesID = ?, AssetsURL = ?, Name = ?, PeopleServed = ?, PrepTime = ?, WHERE ProductID = ?`, // SQL query om een gebruiker toe te voegen
             [data.RecipesID, data.AssetsURL, data.Name, data.PeopleServed, data.PrepTime, ProductID] // De waarden die in de query moeten worden ingevuld
        );
        
        if (updatedRecipes.affectedRows === 0) {
            return response.status(404).send({ msg: 'Recipe not found' });  // Als er geen rijen zijn bijgewerkt stuur 404 status
        }
        return response.status(200).send({ msg: 'Recipe updated successfully' }); //false run 200 status

    } catch (error) {
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }

});





router.patch ('/api/recepten', checkSchema(receptenCreateValidatie),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const ProductID = request.params.id;

    try {
        const [existingRecipe] = await pool.query('SELECT * FROM recipes WHERE ProductID = ?', [ProductID]);

        if (existingProduct.length === 0) {
            return response.status(404).send({msg: "Product not found"}); 
        }

        // toevoegen van dynamische velden.
        const teUpdatenVelden =[];
        const teUpdatenWaarden = [];

        // controleren van alle velden en waarden.
        if(data.CategoryID){
            teUpdatenVelden.push(`CategoryID = ?`);
            teUpdatenWaarden.push(data.CategoryID);
        }
        if(data.AssetsURL){
            teUpdatenVelden.push(`AssetsURL = ?`);
            teUpdatenWaarden.push(data.AssetsURL);
        }
        if(data.Price){
            teUpdatenVelden.push(`Price = ?`);
            teUpdatenWaarden.push(data.Price);
        }
        if(data.Size){
            teUpdatenVelden.push(`Size = ?`);
            teUpdatenWaarden.push(data.Size);
        }
        if(data.AmountInStock){
            teUpdatenVelden.push(`AmountInStock = ?`);
            teUpdatenWaarden.push(data.AmountInStock);
        }
        if(data.Name){
            teUpdatenVelden.push(`Name = ?`);
            teUpdatenWaarden.push(data.Name);
        }


        //ProductID toevoegen aan de lijst
        teUpdatenWaarden.push(ProductID);

        if (teUpdatenVelden === 0){
            return response.status(400).send({msg: "there are no fields to update"});
        } 

        // Stap 1: Controleer of de naam van het product al bestaat in de database
        const [existingName] = await pool.query(`SELECT * FROM products WHERE Name = ?`, [data.Name]); 

        // Als de e-mail al bestaat, stuur dan een foutmelding terug
        if (existingName.length > 0) {
            return response.status(400).send({ msg: "Product name already exists" });
        }

        //opstellen van de query
        const sqlQuery = `
            UPDATE products
            SET ${teUpdatenVelden.join(', ')} WHERE ProductID = ?
        `;

        //uitvoeren van de query
        const [updatedProduct] = await pool.query(sqlQuery, teUpdatenWaarden);

        if (updatedProduct.affectedRows === 0 ){
            return response.status(400).send({msg: "no given values to update"})
        }

        return response.status(200).send({msg: "product is updated"})

    } catch (error) {
         // Foutafhandeling: Log de fout en stuur een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});






router.delete('/api/products/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request);
    const productID = data.id;
    try {
        const [checkenProduct] = await pool.query(`SELECT * FROM products WHERE ProductID = ?`, [productID]);
        if (checkenProduct.length === 0){
            return response.status(404).send({msg: "No Product found with given Product id"});
        } else {
            await pool.query(`DELETE FROM products WHERE ProductID = ?`, [productID]);
            return response.status(200).send({msg: "Product is deleted"});
        }
    } catch (error) {
        return response.status(500).send({ msg: "Server error" });
    }
});


export default router;