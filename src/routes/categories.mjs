import { Router } from "express";
import { checkSchema, matchedData, validationResult } from "express-validator";
import pool from "../postgress/db.mjs";
import { categoryValidationSchema, IDvalidatie } from "../utils/validationschemas.mjs";
import { resultValidator } from "../utils/middelwares.mjs";
import cors from 'cors';
import { corsOptions } from "../utils/middelwares.mjs";

const router = Router();


/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Maak een nieuwe categorie aan
 *     description: |
 *       Dit endpoint maakt een nieuwe categorie aan in de database. Het valideert de ingevoerde gegevens, zoals de naam van de categorie, en controleert of de categorie nog niet bestaat.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Name
 *             properties:
 *               Name:
 *                 type: string
 *                 description: De naam van de categorie (max. 100 tekens)
 *                 example: 'Zuivel'
 *     responses:
 *       201:
 *         description: Categorie succesvol aangemaakt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CategoryID:
 *                   type: integer
 *                   description: De unieke ID van de aangemaakte categorie
 *                   example: 20
 *                 Name:
 *                   type: string
 *                   description: De naam van de categorie
 *                   example: 'Zuivel'
 *       400:
 *         description: Fout in de validatie of categorie bestaat al
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'category already exsists'
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

router.post('/api/categories', checkSchema(categoryValidationSchema), cors(corsOptions), resultValidator, async (request, response) => {
    const data = matchedData(request); 

    try {
        const [existingCategory] = await pool.query(`SELECT * FROM product_categories WHERE Name = ?`, [data.Name]); 
        if (existingCategory.length > 0) {
            return response.status(400).send({ msg: "Category already exists" });
        }

        const [NewCategory] = await pool.query(
            `INSERT INTO product_categories (Name) VALUES (?)`, 
            [data.Name,]
        );

        const newcategory = {
            id: NewCategory.insertId,
            Name: data.Name,
        };

        return response.status(201).send(newcategory);
    } catch (error) {
          return response.status(500).send({ msg: "Server error" });
    }
});

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Ophalen van alle categorieën
 *     description: |
 *       Dit endpoint haalt een lijst op van alle bestaande productcategorieën uit de database.
 *       Als er geen categorieën worden gevonden, wordt een 404 foutmelding geretourneerd.
 *     responses:
 *       200:
 *         description: Een lijst van alle productcategorieën
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   CategoryID:
 *                     type: integer
 *                     description: De unieke ID van de categorie
 *                     example: 1
 *                   Name:
 *                     type: string
 *                     description: De naam van de categorie
 *                     example: 'Fruits'
 *       404:
 *         description: Geen categorieën gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'No categories found'
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


router.get('/api/categories', cors(corsOptions), async (request, response) => {
    try {
        const [ophalencategoryProducten] = await pool.query(`SELECT * FROM product_categories`);
        if (ophalencategoryProducten.length === 0) {
            return response.status(404).send({ msg: "No categories found" });
        }
        return response.status(200).json(ophalencategoryProducten);
    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Ophalen van producten op basis van categorie ID
 *     description: |
 *       Dit endpoint haalt een lijst op van alle producten die zijn gekoppeld aan het opgegeven categorie ID.
 *       Als er geen producten worden gevonden voor de opgegeven categorie ID, wordt een 404 foutmelding geretourneerd.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Het unieke ID van de categorie waarvan de producten moeten worden opgehaald
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Een lijst van producten in de opgegeven categorie
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ProductID:
 *                     type: integer
 *                     description: De unieke ID van het product
 *                     example: 101
 *                   CategoryID:
 *                     type: integer
 *                     description: De unieke ID van het product
 *                     example: 1
 *                   AssetsURL:
 *                     type: string
 *                     format: uri
 *                     example: 'https://example.com/images/product-a.jpg'
 *                   Name:
 *                     type: string
 *                     description: De naam van het product
 *                     example: 'Product A'
 *                   Price:
 *                     type: integer
 *                     description: De prijs van het product in centen (bijv. 1000 = €10,00)
 *                     example: 1299
 *                   Size:
 *                     type: string
 *                     description: De grootte of afmetingen van het product
 *                     example: 'M'
 *                   AmountInStock:
 *                     type: integer
 *                     description: Het aantal producten op voorraad
 *                     example: 50
 *       404:
 *         description: Geen producten gevonden voor de opgegeven categorie ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'No products found for given category ID'
 *       400:
 *         description: Ongeldig categorie ID
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

router.get('/api/categories/:id', checkSchema(IDvalidatie), cors(corsOptions), resultValidator, async (request, response) => {
    const data = matchedData(request); 
    const categoryID = data.id;
    
    try {
        const [existingCategory] = await pool.query('SELECT * FROM products WHERE CategoryID = ?', [categoryID]);
        
        if (existingCategory.length > 0) {
            return response.status(200).json(existingCategory);
        } else {
            return response.status(404).send({ msg: 'No products found for given category ID' });
        }
    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Verwijderen van een categorie op basis van ID
 *     description: |
 *       Dit endpoint verwijdert een categorie uit de database aan de hand van het opgegeven categorie ID. 
 *       Als de categorie niet wordt gevonden, wordt een 404 foutmelding geretourneerd.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Het unieke ID van de categorie
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Categorie succesvol verwijderd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Category successfully deleted'
 *       404:
 *         description: geen categorie gevonden voor opgegeven ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'No category found with given ID'
 *       400:
 *         description: Ongeldig categorie ID
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
 *                   example: 'Server error'
 */

router.delete('/api/categories/:id', checkSchema(IDvalidatie), cors(corsOptions), resultValidator, async (request, response) => {
    const data = matchedData(request);
    const categoryID = data.id;

    try {
        const [checkenCategory] = await pool.query(`SELECT * FROM product_categories WHERE CategoryID = ?`, [categoryID]);
        if (checkenCategory.length === 0) {
            return response.status(404).send({ msg: "No category found with given ID" });
        } else {
            await pool.query(`DELETE FROM product_categories WHERE CategoryID = ?`, [categoryID]);
            return response.status(200).send({ msg: "Category successfully deleted" });
        }
    } catch (error) {
        return response.status(500).send({ msg: "Server error" });
    }
});




/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Update een bestaande categorie
 *     description: |
 *       Dit endpoint wijzigt de gegevens van een bestaande categorie aan de hand van het opgegeven Cateegory ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: De unieke ID van de categorie die moet worden bijgewerkt
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
 *             properties:
 *               Name:
 *                 type: string
 *                 example: 'Fruits'
 *     responses:
 *       200:
 *         description: Categorie succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Category updated successfully'
 *       400:
 *         description: Categorie naam bestaat al
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Category name already exists'
 *       404:
 *         description: Categorie niet gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: 'Category not found'
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

// put request 
router.put ('/api/categories/:id', checkSchema(categoryValidationSchema), cors(corsOptions), checkSchema(IDvalidatie), resultValidator, async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const CategoryID = request.params.id;

    try {
        
        const [exsisting_category] = await pool.query(
            `SELECT * from product_categories WHERE Name = ?`,
            [data.Name]
        );
        
        if(exsisting_category.length !== 0){
            return response.status(400).send({msg: 'category name already exsists'})
        }

        const [updatedCategory] = await pool.query(
            `UPDATE product_categories
             SET Name = ? WHERE CategoryID = ?`, // SQL query om een gebruiker toe te voegen
            [data.Name, CategoryID] // De waarden die in de query moeten worden ingevuld
        );
        
        if (updatedCategory.affectedRows === 0) {
            return response.status(404).send({ msg: 'Category not found' });  // Als er geen rijen zijn bijgewerkt stuur 404 status
        }
        return response.status(200).send({ msg: 'Category updated successfully' }); //false run 200 status

    } catch (error) {
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }

});




export default router;
