import { Router } from "express";
import { query, checkSchema, validationResult, body, matchedData } from "express-validator";
import {  IDvalidatie, UpdateLockerValidation, UpdateLockerpatchValidation, createorderdProductValidation, updateorderdProductValidation } from "../utils/validationschemas.mjs"
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

        const [existingorder] = await pool.query(`SELECT * FROM orders WHERE OrderID = ?`, [data.OrderID]);         
        if (existingorder.length === 0) {
            return response.status(400).send({ msg: "No order found with given Order ID " });
        }

        const [NoExsistingProducts] = await pool.query(`SELECT * FROM products WHERE ProductID = ?`, [data.ProductID]); 
        if (NoExsistingProducts.length === 0) {
            return response.status(404).send({ msg: "No product found with given productID" });
        }

        await pool.query(
            `INSERT INTO ordered_products (ProductID, OrderID, Amount) VALUES (?, ?, ?)`, 
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
        const [getorderd_products] = await pool.query(`SELECT * FROM ordered_products`)
        if (getorderd_products.length === 0){
            return response.status(404).send({msg: "No ordered products found"})
        }
        return response.status(200).json(getorderd_products);
    } catch (error) {
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
        const [existingorder] = await pool.query('SELECT * FROM ordered_products WHERE OrderID = ?', [orderid]);

        if (existingorder.length > 0) {
            return response.status(200).json(existingorder);
        } else {
            return response.status(404).send({ msg: 'No ordered products found with given ID' });
        }
    } catch (error) {
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});



// order id en product id ophalen 
// put request 
router.put ('/api/orderd_products/:id', checkSchema(updateorderdProductValidation),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const id= request.params.id;

    const [invalidid] = await pool.query(`SELECT * FROM ordered_products WHERE OrderID = ?`, [id]);
    if(invalidid.length === 0) {
        return response.status(404).send({msg: "No order found with given ID"})
    } 

    
    const [checkingProductID] = await pool.query(`SELECT * FROM ordered_products WHERE ProductID = ? and OrderID = ?`, [data.ProductID, data.OrderID]); 
    if (checkingProductID.length === 0) {
        return response.status(404).send({ msg: "No products found with given product and order ID" });
    }
    
    try {
        const [updatedOrderedProducts] = await pool.query(
            `UPDATE ordered_products
            SET ProductID = ?, OrderID = ?, Amount = ? WHERE OrderID = ? `, // SQL query om een gebruiker toe te voegen
            [data.Orderid, data.ProductID, data.Amount] // De waarden die in de query moeten worden ingevuld
        );
        
        if (updatedOrderedProducts.affectedRows === 0) {
            return response.status(404).send({ msg: 'Ordered_products not updated' });  // Als er geen rijen zijn bijgewerkt stuur 404 status
        }
        return response.status(200).send({ msg: 'Ordered_products updated successfully' }); //false run 200 status
        
    } catch (error) {
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
    
});




// // patch request voor het aanpassen van een of meerdere gegevens in een bestand.
// router.patch ('/api/lockers/:id', checkSchema(UpdateLockerpatchValidation),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
//     // gevalideerde data wordt opgeslagen in data variabelen
//     const data = matchedData(request); 
//     const lockerid = request.params.id;

//     try {
//         const [existingLocker] = await pool.query('SELECT * FROM lockers WHERE LockerID = ?', [lockerid]);

//         if (existingLocker.length === 0) {
//             return response.status(404).send({msg: "Locker not found"}); 
//         }

//         const FieldsToUpdate =[];
//         const ValuesToUpdate = [];

//         if(data.LockerID){
//             FieldsToUpdate.push(`LockerID = ?`);
//             ValuesToUpdate.push(data.LockerID);
//         }
//         if(data.MomentDelivered){
//             FieldsToUpdate.push(`MomentDelivered = ?`);
//             ValuesToUpdate.push(data.MomentDelivered);
//         }


//         ValuesToUpdate.push(lockerid);

//         if (FieldsToUpdate === 0){
//             return response.status(400).send({msg: "there are no fields to update"});
//         } 

//         const [existingLockerID] = await pool.query(`SELECT * FROM lockers WHERE LockerID = ?`, [data.LockerID]); 

//         if (existingLockerID.length > 0) {
//             return response.status(400).send({ msg: "Locker ID already exists" });
//         }
        
//         //opstellen van de query
//         const sqlQuery = `
//             UPDATE lockers
//             SET ${FieldsToUpdate.join(', ')} WHERE LockerID = ?
//         `;

//         //uitvoeren van de query
//         const [updatedlocker] = await pool.query(sqlQuery, ValuesToUpdate);

//         if (updatedlocker.affectedRows === 0 ){
//             return response.status(400).send({msg: "no given values to update"})
//         }

//         return response.status(200).send({msg: "Locker is updated"})

//     } catch (error) {
//          // Foutafhandeling: Log de fout en stuur een interne serverfout terug
//         console.error('Database error:', error);
//         return response.status(500).send({ msg: 'Internal server error' });
//     }
// });




// // delete request voor het verwijderen van een user in dit geval.
// router.delete ('/api/lockers/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
//     const data = matchedData(request); 
//     const lockerid = data.id;

//     try {
//         const [lockerCheck] = await pool.query('SELECT * FROM lockers Where LockerID = ?', [lockerid]);
//         if (lockerCheck.length === 0){
//             return response.status(404).send({msg: "Locker not found"})
//         }
//         else
//         await pool.query('DELETE FROM lockers WHERE LockerID = ?', [lockerid]);
//         return response.status(204).send({msg: "Locker is deleted"});

//     } catch (error) {
//         console.error('Database error:', error);
//         return response.status(500).send({ msg: 'Internal server error' });
//     }
// });


export default router;
