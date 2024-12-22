import { response, Router } from "express";
import { checkSchema, matchedData, validationResult } from "express-validator";
import pool from "../postgress/db.mjs";
import { productValidationSchema, IDvalidatie, filterValidationSchema, productupdateValidationSchema } from "../utils/validationschemas.mjs";
import { resultValidator } from "../utils/middelwares.mjs";
import cors from 'cors';
import { corsOptions } from "../utils/middelwares.mjs";




const router = Router();

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Voeg een nieuw product toe
 *     description: |
 *       Dit endpoint voegt een nieuw product toe aan de database. Controleert of alle vereiste velden correct zijn ingevuld en of het product nog niet bestaat.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Name
 *               - CategoryID
 *               - AssetsURL
 *               - Price
 *               - Size
 *               - AmountInStock
 *             properties:
 *               Name:
 *                 type: string
 *                 description: De naam van het product
 *                 example: 'Product A'
 *               CategoryID:
 *                 type: integer
 *                 description: De ID van de categorie waartoe het product behoort
 *                 example: 3
 *               AssetsURL:
 *                 type: string
 *                 format: uri
 *                 description: URL naar de productafbeeldingen of andere assets
 *                 example: 'https://example.com/images/product-a.jpg'
 *               Price:
 *                 type: integer
 *                 description: De prijs van het product in centen (bijv. 1000 = €10,00)
 *                 example: 1299
 *               Size:
 *                 type: string
 *                 description: De grootte of afmetingen van het product
 *                 example: 'M'
 *               AmountInStock:
 *                 type: integer
 *                 description: Het aantal producten op voorraad
 *                 example: 50
 *     responses:
 *       201:
 *         description: Product succesvol toegevoegd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ProductID:
 *                   type: integer
 *                   description: De unieke ID van het toegevoegde product
 *                   example: 101
 *                 Name:
 *                   type: string
 *                   example: 'Product A'
 *                 CategoryID:
 *                   type: integer
 *                   example: 3
 *                 AssetsURL:
 *                   type: string
 *                   format: uri
 *                   example: 'https://example.com/images/product-a.jpg'
 *                 Price:
 *                   type: integer
 *                   example: 1299
 *                 Size:
 *                   type: string
 *                   example: 'M'
 *                 AmountInStock:
 *                   type: integer
 *                   example: 50
 *       400:
 *         description: Fout in de validatie of product bestaat al
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Validation error: Name is required'
 *       404:
 *         description: Ongeldige CategoryID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Invalid category ID'
 *       500:
 *         description: Serverfout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Internal server error'
 */


router.post('/api/products', checkSchema(productValidationSchema), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request); 

    try {
        const [existingproduct] = await pool.query(`SELECT * FROM products WHERE Name = ?`, [data.Name]); 

        if (existingproduct.length > 0) {
            return response.status(400).send({ msg: "product already exists" });
        }

        const [existingcategoryid] = await pool.query(`SELECT * FROM product_categories WHERE CategoryID = ?`, [data.CategoryID]); 

        if (existingcategoryid.length === 0) {
            return response.status(404).send({ msg: "invalid category ID" });
        }

        const [NewProduct] = await pool.query(
            `INSERT INTO products (CategoryID, AssetsURL, Price, Size, AmountInStock, Name) VALUES (?, ?, ?, ?, ?, ?)`,
            [data.CategoryID, data.AssetsURL, data.Price, data.Size, data.AmountInStock, data.Name]
        );

        const Newproduct = {
            ProductID: NewProduct.insertId,
            CategoryID: data.CategoryID,
            AssetsURL: data.AssetsURL,
            Price: data.Price,
            Size: data.Size,
            AmountInStock: data.AmountInStock,
            Name: data.Name
        };

        return response.status(201).send(Newproduct);
        
    } catch (error) {
        console.error(error);
        return response.status(500).send({ msg: "Server error" });
    }
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Haal alle producten op
 *     description: |
 *       Dit endpoint haalt een lijst op van alle producten in de database.
 *     responses:
 *       200:
 *         description: Een lijst van alle producten.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                     description: Naam van het product
 *                     example: 'Product A'
 *                   CategoryID:
 *                     type: integer
 *                     description: ID van de productcategorie
 *                     example: 1
 *                   AssetsURL:
 *                     type: string
 *                     description: URL van de productafbeelding of andere middelen
 *                     example: 'http://example.com/product.jpg'
 *                   Price:
 *                     type: integer
 *                     description: Prijs van het product in centen (bijv. 1000 = €10,00)
 *                     example: 1999
 *                   Size:
 *                     type: string
 *                     description: Grootte van het product
 *                     example: 'M'
 *                   AmountInStock:
 *                     type: integer
 *                     description: Aantal beschikbare producten op voorraad
 *                     example: 100
 *       404:
 *         description: Geen producten gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'No products found'
 *       500:
 *         description: Serverfout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Internal server error'
 */


router.get('/api/products', cors(corsOptions), async (request, response) => {
    try {
        const [ophalenProducten] = await pool.query(`SELECT * FROM products`)
        if (ophalenProducten.length === 0){
            return response.status(404).send({msg: "No products found"})
        }
        return response.status(200).json(ophalenProducten);
    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Haalt product op aan de hand van productID
 *     description: Haal een product op op basis van ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Het ID van het product.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Het opgevraagde product.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ProductID:
 *                   type: integer
 *                   description: ID van het product
 *                   example: 5
 *                 Name:
 *                   type: string
 *                   description: Naam van het product
 *                   example: 'Product A'
 *                 CategoryID:
 *                   type: integer
 *                   description: ID van de productcategorie
 *                   example: 1
 *                 AssetsURL:
 *                   type: string
 *                   description: URL van de productafbeelding of andere middelen
 *                   example: 'http://example.com/product.jpg'
 *                 Price:
 *                   type: number
 *                   format: float
 *                   description: Prijs van het product in de lokale valuta
 *                   example: 19.99
 *                 Size:
 *                   type: string
 *                   description: Grootte van het product
 *                   example: 'M'
 *                 AmountInStock:
 *                   type: integer
 *                   description: Aantal beschikbare producten op voorraad
 *                   example: 100
 *
 *       400:
 *         description: niet geldig ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Product ID must be an integer'
 *       404:
 *         description: Geen producten gevonden bij opgegeven ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'product not found'
 *       500:
 *         description: Serverfout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Internal server error'
 */

router.get('/api/products/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request); 
    const productID = data.id;
    
    try {
        const [existingProduct] = await pool.query('SELECT * FROM products WHERE ProductID = ?', [productID]);
        
        if (existingProduct.length > 0) {
            return response.status(200).json(existingProduct);
        } else {
            return response.status(404).send({ msg: 'product not found' });
        }
    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});




/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags:
 *       - Products
 *     summary: Update een bestaand product
 *     description: |
 *       Dit endpoint wijzigt de gegevens van een bestaand product in de database aan de hand van een opgegeven ProductID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: De unieke ID van het product dat moet worden bijgewerkt
 *         required: true
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
 *               - CategoryID
 *               - AssetsURL
 *               - Price
 *               - Size
 *               - AmountInStock
 *             properties:
 *               Name:
 *                 type: string
 *                 example: Product A
 *               CategoryID:
 *                 type: integer
 *                 example: 2
 *               AssetsURL:
 *                 type: string
 *                 example: "http://example.com/productA.jpg"
 *               Price:
 *                 type: number
 *                 format: integer
 *                 example: 12
 *               Size:
 *                 type: string
 *                 example: "Medium"
 *               AmountInStock:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       200:
 *         description: Product succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Product updated successfully
 *       400:
 *         description: Ongeldige gegevens, zoals een productnaam die al bestaat of een ongeldige categorie-ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               anyOf:
 *                 - properties:
 *                     msg:
 *                       type: string
 *                       example: Product name already exists
 *                 - properties:
 *                     msg:
 *                       type: string
 *                       example: Invalid CategoryID
 *       404:
 *         description: Product niet gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Product not found
 *       500:
 *         description: Serverfout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Internal server error
 */

// put request 
router.put ('/api/products/:id', checkSchema(productValidationSchema),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const ProductID = request.params.id;

    try {
        
        const [exsisting_product] = await pool.query(
            `SELECT * from products WHERE Name = ?`,
            [data.Name]
        );
        
        if(exsisting_product.length !== 0){
            return response.status(400).send({msg: 'product name already exsists'})
        }

        const [invalid_category_id] = await pool.query(
            `SELECT * from product_categories WHERE CategoryID = ?`,
            [data.CategoryID]
        );
        
        if(invalid_category_id.length === 0){
            return response.status(400).send({msg: 'invalid category ID'})
        }

        const [updatedProduct] = await pool.query(
            `UPDATE products
             SET CategoryID = ?, AssetsURL = ?, Price = ?, Size = ?, AmountInStock = ?, Name = ? WHERE ProductID = ?`, // SQL query om een gebruiker toe te voegen
             [data.CategoryID, data.AssetsURL, data.Price, data.Size, data.AmountInStock, data.Name, ProductID] // De waarden die in de query moeten worden ingevuld
        );
        
        if (updatedProduct.affectedRows === 0) {
            return response.status(404).send({ msg: 'Product not found' });  // Als er geen rijen zijn bijgewerkt stuur 404 status
        }
        return response.status(200).send({ msg: 'Product updated successfully' }); //false run 200 status

    } catch (error) {
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }

});



/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     tags:
 *       - Products
 *     summary: Pas één of meerdere waarden van een product aan
 *     description: |
 *       Dit endpoint wijzigt één of meerdere waarden van een bestaand product in de database aan de hand van een opgegeven ProductID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: De unieke ID van het product dat moet worden bijgewerkt
 *         required: true
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
 *               Name:
 *                 type: string
 *                 example: Product A
 *               CategoryID:
 *                 type: integer
 *                 example: 2
 *               AssetsURL:
 *                 type: string
 *                 example: "http://example.com/productA.jpg"
 *               Price:
 *                 type: number
 *                 format: integer
 *                 example: 12
 *               Size:
 *                 type: string
 *                 example: "Medium"
 *               AmountInStock:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       200:
 *         description: Product succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Product is updated
 *       400:
 *         description: Ongeldige gegevens, zoals een productnaam die al bestaat of geen velden om te updaten
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               anyOf:
 *                 - properties:
 *                     msg:
 *                       type: string
 *                       example: Product name already exists
 *                 - properties:
 *                     msg:
 *                       type: string
 *                       example: No fields to update
 *       404:
 *         description: Product niet gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Product not found
 *       500:
 *         description: Serverfout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Internal server error
 */

// patch request voor het aanpassen van een of meerdere gegevens in een bestand.
router.patch ('/api/products/:id', checkSchema(productupdateValidationSchema),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const ProductID = request.params.id;

    try {
        const [existingProduct] = await pool.query('SELECT * FROM products WHERE ProductID = ?', [ProductID]);

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




/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags:
 *       - Products
 *     summary: verwijderen van een product op basis van product ID
 *     description: Verwijder een product op basis van product ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         description: Het ID van het product dat verwijderd moet worden.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Product succesvol verwijderd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Product is deleted'
 *       404:
 *         description: Geen producten gevonden bij opgegeven ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'No product found with given product ID'
 *       500:
 *         description: Serverfout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Internal server error'
 */

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
