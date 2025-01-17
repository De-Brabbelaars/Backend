import { Router } from "express";
import { query, checkSchema, validationResult, body, matchedData } from "express-validator";
import {  IDvalidatie, ProductIDValidation, createorderdProductValidation, orderIDValidation, updateorderdProductValidation } from "../utils/validationschemas.mjs"
import { userCreationLimiter, resultValidator} from "../utils/middelwares.mjs";
import pool from "../postgress/db.mjs";
import cors from 'cors';
import { corsOptions } from "../utils/middelwares.mjs";




// maakt een routes aan
const router = Router();




/**
 * @swagger
 * /api/orderd_products:
 *   post:
 *     tags:
 *       - Ordered Products
 *     summary: Maak een nieuwe ordered_product aan
 *     description: Voeg een nieuw record toe aan de `orderd_products`-tabel door een product, order en hoeveelheid te specificeren.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ProductID
 *               - OrderID
 *               - Amount
 *             properties:
 *               ProductID:
 *                 type: integer
 *                 description: Het unieke ID van het product dat wordt besteld.
 *                 example: 5
 *               OrderID:
 *                 type: integer
 *                 description: Het unieke ID van de order waaraan het product wordt gekoppeld.
 *                 example: 10
 *               Amount:
 *                 type: integer
 *                 description: Het aantal producten dat wordt besteld.
 *                 example: 3
 *     responses:
 *       201:
 *         description: Ordered product succesvol aangemaakt.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ProductID:
 *                   type: integer
 *                   example: 5
 *                 OrderID:
 *                   type: integer
 *                   example: 10
 *                 Amount:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Ongeldig verzoek, of geen order gevonden met de gegeven OrderID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No order found with given Order ID
 *       404:
 *         description: Geen product gevonden met de opgegeven ProductID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No product found with given productID
 *       500:
 *         description: Serverfout.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Server error
 */

// POST request voor het aanmaken van een nieuwe gebruiker
router.post('/api/orderd_products',  checkSchema(createorderdProductValidation), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    try {

        const [existingorder] = await pool.query(`SELECT * FROM Orders WHERE OrderID = ?`, [data.OrderID]);         
        if (existingorder.length === 0) {
            return response.status(400).send({ msg: "No order found with given Order ID " });
        }

        const [NoExsistingProducts] = await pool.query(`SELECT * FROM Products WHERE ProductID = ?`, [data.ProductID]); 
        if (NoExsistingProducts.length === 0) {
            return response.status(404).send({ msg: "No product found with given productID" });
        }


        const [exsitingCombination] = await pool.query(`SELECT * FROM Ordered_products WHERE ProductID = ? and OrderID = ?`, [data.ProductID, data.OrderID]); 
        if (exsitingCombination.length > 0) {
            return response.status(404).send({ msg: "Product is already ordered" });
        }

        await pool.query(
            `INSERT INTO Ordered_products (ProductID, OrderID, Amount) VALUES (?, ?, ?)`, 
            [data.ProductID, data.OrderID, data.Amount,] 
        );

        const newOrderdProduct = {
            ProductID: data.ProductID,  // Verkrijg het ID van de net ingevoegde gebruiker
            OrderID: data.OrderID,
            Amount: data.Amount,
        };

        return response.status(201).send(newOrderdProduct); // HTTP status 201 betekent 'Created'

    } catch (err) {
        return response.status(500).send({ msg: "Server error" });
    }
});




/**
 * @swagger
 * /api/orderd_products:
 *   get:
 *     tags:
 *       - Ordered Products
 *     summary: Haal alle ordered products op
 *     description: Haalt een lijst op met alle records in de `orderd_products`-tabel.
 *     responses:
 *       200:
 *         description: Lijst met ordered products succesvol opgehaald.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ProductID:
 *                     type: integer
 *                     description: Het unieke ID van het product.
 *                     example: 5
 *                   OrderID:
 *                     type: integer
 *                     description: Het unieke ID van de order.
 *                     example: 10
 *                   Amount:
 *                     type: integer
 *                     description: Het aantal producten dat is besteld.
 *                     example: 3
 *       404:
 *         description: Geen ordered products gevonden.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No orderd products found
 *       500:
 *         description: Serverfout.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Internal server error
 */

router.get('/api/orderd_products', cors(corsOptions), async (request, response) => {
    try {
        const [getorderd_products] = await pool.query(`SELECT * FROM Ordered_products`)
        if (getorderd_products.length === 0){
            return response.status(404).send({msg: "No ordered products found"})
        }
        return response.status(200).json(getorderd_products);
    } catch (error) {
        console.log(error.message);
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});




/**
 * @swagger
 * /api/orderd_products/{id}:
 *   get:
 *     tags:
 *       - Ordered Products
 *     summary: Haal een ordered product op aan de hand van een Order ID
 *     description: Haalt een specifiek ordered product op uit de database op basis van de unieke `OrderID`.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Het unieke OrderID van het ordered product
 *         required: true
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Ordered product succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ProductID:
 *                   type: integer
 *                   description: Het unieke ID van het product.
 *                   example: 5
 *                 OrderID:
 *                   type: integer
 *                   description: Het unieke ID van de order.
 *                   example: 10
 *                 Amount:
 *                   type: integer
 *                   description: Het aantal producten dat is besteld.
 *                   example: 3
 *       404:
 *         description: Geen ordered product gevonden met het opgegeven OrderID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No locker found with given Locker ID
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

// Ophalen van users aan de hand van id
router.get('/api/orderd_products/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // Gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const orderid = data.id;

    try {
        // SQL-query uitvoeren om gebruiker te zoeken
        const [existingorder] = await pool.query('SELECT * FROM Ordered_products WHERE OrderID = ?', [orderid]);

        if (existingorder.length > 0) {
            return response.status(200).json(existingorder);
        } else {
            return response.status(404).send({ msg: 'No ordered products found with given ID' });
        }
    } catch (error) {
        console.log(error.message);
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});




/**
 * @swagger
 * /api/orderd_products/{id}:
 *   put:
 *     tags:
 *       - Ordered Products
 *     summary: Wijzig specifieke gegevens van een bestaand besteld product
 *     description: |
 *       Dit endpoint wordt gebruikt om een of meerdere velden van een bestaand besteld product bij te werken.
 *       Alleen de velden die moeten worden gewijzigd hoeven in de request body te worden opgenomen.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Het unieke ID van de order waaraan het product is gekoppeld.
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
 *               ProductID:
 *                 type: integer
 *                 description: Het unieke ID van het product.
 *                 example: 2
 *               OrderID:
 *                 type: integer
 *                 description: Het unieke ID van de order.
 *                 example: 1
 *               Amount:
 *                 type: integer
 *                 description: Het aantal van het product dat is besteld.
 *                 example: 3
 *     responses:
 *       200:
 *         description: Besteld product succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Ordered_products updated successfully
 *       400:
 *         description: Ongeldige of ontbrekende invoer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   examples:
 *                     MissingFields: There are missing required fields in the request body
 *                     InvalidInput: Provided data is not valid
 *       404:
 *         description: Geen besteld product gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   examples:
 *                     NoMatch: No ordered products found with given orderID and product ID
 *                     NotUpdated: Ordered_products not updated
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

router.put ('/api/orderd_products/:id', checkSchema(createorderdProductValidation),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const id= request.params.id;
    const ProductID = data.ProductID

    const [NoMatch] = await pool.query(`SELECT * FROM Ordered_products WHERE OrderID = ? and ProductID = ?`, [id, data.ProductID]);
    if(NoMatch.length === 0) {
        return response.status(404).send({msg: "No orderd products found with given orderID"})
    } 

    const [exsitingCombination] = await pool.query(`SELECT * FROM Ordered_products WHERE ProductID = ? and OrderID = ?`, [data.ProductID, data.OrderID]); 
    if (exsitingCombination.length > 0) {
        return response.status(404).send({ msg: "Product is already ordered" });
    }

    try {
        const [updatedOrderedProducts] = await pool.query(
            `UPDATE Ordered_products 
            SET ProductID = ?, OrderID = ?, Amount = ? WHERE OrderID = ? and ProductID = ? `, // SQL query om een gebruiker toe te voegen
            [data.ProductID, data.OrderID, data.Amount, id, ProductID] // De waarden die in de query moeten worden ingevuld
        );
        
        if (updatedOrderedProducts.affectedRows === 0) {
            return response.status(404).send({ msg: 'Ordered_products not updated' });  // Als er geen rijen zijn bijgewerkt stuur 404 status
        }
        return response.status(200).send({ msg: 'Ordered_products updated successfully' }); //false run 200 status
        
    } catch (error) {
        console.log(error.message);
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
    
});



/**
 * @swagger
 * /api/ordered_products/{orderId}/{productId}:
 *   patch:
 *     tags:
 *       - Ordered Products
 *     summary: Wijzig specifieke gegevens van een besteld product
 *     description: |
 *       Dit endpoint wordt gebruikt om een of meerdere velden van een bestaand besteld product bij te werken.
 *       Alleen de velden die moeten worden gewijzigd hoeven in de request body te worden opgenomen.
 *     parameters:
 *       - name: orderId
 *         in: path
 *         description: Het unieke ID van de order.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: productId
 *         in: path
 *         description: Het unieke ID van het product.
 *         required: true
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
 *               OrderID:
 *                 type: integer
 *                 description: Het unieke ID van de order.
 *                 example: 1
 *               ProductID:
 *                 type: integer
 *                 description: Het unieke ID van het product.
 *                 example: 2
 *               Amount:
 *                 type: integer
 *                 description: Het aantal van het product dat is besteld.
 *                 example: 3
 *     responses:
 *       200:
 *         description: Besteld product succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Ordered product updated successfully
 *       400:
 *         description: Ongeldige of ontbrekende invoer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   examples:
 *                     NoFields: There are no fields to update
 *                     NoValues: No changes were made
 *       404:
 *         description: Geen besteld product gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No ordered products found with the given OrderID and ProductID
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

router.patch('/api/ordered_products/:orderId/:productId', checkSchema(updateorderdProductValidation), checkSchema(orderIDValidation), checkSchema(ProductIDValidation), resultValidator, cors(corsOptions), async (request, response) => {
    const { orderId, productId } = request.params; // Unieke IDs van de route
    const data = matchedData(request); // Gevalideerde data uit de request body

    try {
        // Controleer of het unieke paar van OrderID en ProductID bestaat
        const [existingProduct] = await pool.query(
            `SELECT * FROM Ordered_products WHERE OrderID = ? AND ProductID = ?`,
            [orderId, productId]
        );

        if (existingProduct.length === 0) {
            return response.status(404).send({ msg: "No ordered products found with the given OrderID and ProductID" });
        }

        const [exsitingCombination] = await pool.query(`SELECT * FROM Ordered_products WHERE ProductID = ? and OrderID = ?`, [data.ProductID, data.OrderID]); 
        if (exsitingCombination.length > 0) {
            return response.status(404).send({ msg: "Product is already ordered" });
        }
        // Velden en waarden die moeten worden bijgewerkt
        const fieldsToUpdate = [];
        const valuesToUpdate = [];

        if (data.OrderID) {
            fieldsToUpdate.push(`OrderID = ?`);
            valuesToUpdate.push(data.OrderID);
        }
        if (data.ProductID) {
            fieldsToUpdate.push(`ProductID = ?`);
            valuesToUpdate.push(data.ProductID);
        }
        if (data.Amount) {
            fieldsToUpdate.push(`Amount = ?`);
            valuesToUpdate.push(data.Amount);
        }

        // Geen velden om bij te werken
        if (fieldsToUpdate.length === 0) {
            return response.status(400).send({ msg: "There are no fields to update" });
        }

        // Voeg orderId en productId toe aan de waarden (voor de WHERE-clause)
        valuesToUpdate.push(orderId, productId);

        // Stel de SQL-query samen
        const sqlQuery = `
            UPDATE Ordered_products
            SET ${fieldsToUpdate.join(', ')}
            WHERE OrderID = ? AND ProductID = ?
        `;

        // Voer de query uit
        const [result] = await pool.query(sqlQuery, valuesToUpdate);

        if (result.affectedRows === 0) {
            return response.status(400).send({ msg: "No changes were made" });
        }

        // Succes
        return response.status(200).send({ msg: "Ordered product updated successfully" });

    } catch (error) {
        console.log(error.message);
        // Foutafhandeling
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});




/**
 * @swagger
 * /api/ordered_products/{orderId}/{productId}:
 *   delete:
 *     tags:
 *       - Ordered Products
 *     summary: Verwijder een besteld product
 *     description: |
 *       Dit endpoint verwijdert een besteld product op basis van de unieke IDs van de order en het product.
 *     parameters:
 *       - name: orderId
 *         in: path
 *         description: Het unieke ID van de order waaraan het product is gekoppeld.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: productId
 *         in: path
 *         description: Het unieke ID van het product dat verwijderd moet worden.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 2
 *     responses:
 *       204:
 *         description: Besteld product succesvol verwijderd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Ordered products are deleted.
 *       404:
 *         description: Geen besteld product gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No ordered products found with given order and product id
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

// Delete request voor het verwijderen van een besteld product
router.delete('/api/ordered_products/:orderId/:productId', checkSchema(orderIDValidation), checkSchema(ProductIDValidation), resultValidator, cors(corsOptions), async (request, response) => {
    const { orderId, productId } = request.params; // Unieke IDs van de route

    try {
        const [ordercheck] = await pool.query('SELECT * FROM Ordered_products WHERE OrderID = ? AND ProductID = ?', [orderId, productId]);
        if (ordercheck.length === 0) {
            return response.status(404).send({ msg: "No ordered products found with given order and product id" });
        }

        await pool.query('DELETE FROM Ordered_products WHERE OrderID = ? AND ProductID = ?', [orderId, productId]);

        const [checkAfterDelete] = await pool.query('SELECT * FROM Ordered_products WHERE OrderID = ? AND ProductID = ?', [orderId, productId]);
        if (checkAfterDelete.length === 0) {
            return response.status(204).send({ msg: "Ordered product is deleted." });
        }
        return response.status(404).send({ msg: "No ordered products found with given order and product id" });

    } catch (error) {
        console.log(error.message);
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});



export default router;
