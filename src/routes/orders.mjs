import { Router } from "express";
import { query, checkSchema, validationResult, body, matchedData } from "express-validator";
import { IDvalidatie, createOrderValidation, patchOrdersValidation,  } from "../utils/validationschemas.mjs"
import { userCreationLimiter} from "../utils/middelwares.mjs";
import pool from "../postgress/db.mjs";
import cors from 'cors';
import { corsOptions, resultValidator } from "../utils/middelwares.mjs";



// maakt een routes aan
const router = Router();



/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Maak een nieuwe order aan
 *     description: |
 *       Dit endpoint wordt gebruikt om een nieuwe order aan te maken in het systeem. Het valideert de ingevoerde gegevens en slaat deze op in de database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               LockerID:
 *                 type: string
 *                 description: Het unieke ID van de locker.
 *                 example: 1
 *               BookingID:
 *                 type: integer
 *                 description: Het unieke ID van de boeking.
 *                 example: 1
 *               Price:
 *                 type: number
 *                 format: integer
 *                 description: De prijs van de order.
 *                 example: 29
 *               MomentCreated:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment waarop de order is aangemaakt.
 *                 example: "2025-01-03 16:30:00"
 *               MomentDelivered:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment waarop de bestelling is afgeleverd.
 *                 example: "2025-01-03 16:36:00"
 *               MomentGathered:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment waarop de bestelling is opgehaald.
 *                 example: "2025-01-03 16:50:00"
 *     responses:
 *       201:
 *         description: Order succesvol aangemaakt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderid:
 *                   type: integer
 *                   description: Het unieke ID van de nieuwe order.
 *                   example: 123
 *                 lockerid:
 *                   type: string
 *                   description: Het unieke ID van de toegewezen locker.
 *                   example: 1
 *                 bookingid:
 *                   type: integer
 *                   description: Het unieke ID van de gekoppelde boeking.
 *                   example: 1
 *                 price:
 *                   type: number
 *                   format: integer
 *                   description: De prijs van de order.
 *                   example: 29
 *                 momentcreated:
 *                   type: string
 *                   format: date-time
 *                   description: Het moment waarop de order is aangemaakt.
 *                   example: "2025-01-03 16:30:00"
 *                 momentdelivered:
 *                   type: string
 *                   format: date-time
 *                   description: Het moment waarop de bestelling is afgeleverd.
 *                   example: "2025-01-03 16:36:00"
 *                 momentgathered:
 *                   type: string
 *                   format: date-time
 *                   description: Het moment waarop de bestelling is opgehaald.
 *                   example: "2025-01-03 16:50:00"
 *       400:
 *         description: Ongeldige invoer of locker al in gebruik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Locker already in use
 *       404:
 *         description: Geen boeking gevonden met het opgegeven BookingID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No Booking found with given BookingID
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

// POST request voor het aanmaken van een nieuwe gebruiker
router.post('/api/orders',  checkSchema(createOrderValidation), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    try {

        const [existingLocker] = await pool.query(`SELECT * FROM lockers WHERE LockerID = ?`, [data.LockerID]);         
        if (existingLocker.length === 0) {
            return response.status(400).send({ msg: "No locker found with given ID" });
        }

        const [NonExsistingBookingID] = await pool.query(`SELECT * FROM Bookings WHERE BookingID = ?`, [data.BookingID]); 
        if (NonExsistingBookingID.length === 0) {
            return response.status(404).send({ msg: "No Booking found with given BookingID" });
        }
        
        const [locker] = await pool.query(`SELECT * FROM lockers WHERE BookingID = ?`, [data.BookingID]); 
        if (locker.length === 0) {
            return response.status(404).send({ msg: "No Locker found with given BookingID" });
        }

        const[result] = await pool.query(
            `INSERT INTO orders (LockerID, BookingID, Price, MomentCreated, MomentDelivered, MomentGathered) VALUES (?, ?, ?, ?, ?, ?)`, 
            [data.LockerID, data.BookingID, data.Price, data.MomentCreated, data.MomentDelivered, data.MomentGathered,] 
        );

        const newOrder = {
            orderid: result.insertID,
            lockerid: data.LockerID,  // Verkrijg het ID van de net ingevoegde gebruiker
            bookingid: data.BookingID,
            price: data.Price,
            momentcreated: data.MomentCreated,
            momentdelivered: data.MomentDelivered,
            momentgathered: data.MomentGathered,
        };

        return response.status(201).send(newOrder); // HTTP status 201 betekent 'Created'

    } catch (err) {
        console.log(error.message);
        return response.status(500).send({ msg: "Server error" });
    }
});



/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Haal alle orders op
 *     description: |
 *       Dit endpoint haalt alle orders op uit de database. Als er geen orders zijn, retourneert het een 404-statuscode met een foutmelding.
 *     responses:
 *       200:
 *         description: Lijst met alle orders succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   OrderID:
 *                     type: integer
 *                     description: Het unieke ID van de order.
 *                     example: 1
 *                   LockerID:
 *                     type: integer
 *                     description: Het unieke ID van de toegewezen locker.
 *                     example: 101
 *                   BookingID:
 *                     type: integer
 *                     description: Het unieke ID van de gekoppelde boeking.
 *                     example: 45
 *                   Price:
 *                     type: number
 *                     format: float
 *                     description: De prijs van de order.
 *                     example: 29.99
 *                   MomentCreated:
 *                     type: string
 *                     format: date-time
 *                     description: Het moment waarop de order is aangemaakt.
 *                     example: "2025-01-01T10:00:00Z"
 *                   MomentDelivered:
 *                     type: string
 *                     format: date-time
 *                     description: Het moment waarop de bestelling is afgeleverd.
 *                     example: "2025-01-02T14:00:00Z"
 *                   MomentGathered:
 *                     type: string
 *                     format: date-time
 *                     description: Het moment waarop de bestelling is opgehaald.
 *                     example: "2025-01-03T16:30:00Z"
 *       404:
 *         description: Geen orders gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No orders found
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

router.get('/api/orders', cors(corsOptions), async (request, response) => {
    try {
        const [getorders] = await pool.query(`SELECT * FROM orders`)
        if (getorders.length === 0){
            return response.status(404).send({msg: "No orders found"})
        }
        return response.status(200).json(getorders);
    } catch (error) {
        console.log(error.message);
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});



/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Haal een specifieke order op aan de hand van een ID
 *     description: |
 *       Dit endpoint haalt een specifieke order op uit de database op basis van het opgegeven unieke order-ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Het unieke ID van de order die opgehaald moet worden.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Order gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 OrderID:
 *                   type: integer
 *                   description: Het unieke ID van de order.
 *                   example: 1
 *                 LockerID:
 *                   type: integer
 *                   description: Het unieke ID van de toegewezen locker.
 *                   example: 101
 *                 BookingID:
 *                   type: integer
 *                   description: Het unieke ID van de gekoppelde boeking.
 *                   example: 45
 *                 Price:
 *                   type: number
 *                   format: integer
 *                   description: De prijs van de order.
 *                   example: 29
 *                 MomentCreated:
 *                   type: string
 *                   format: date-time
 *                   description: Het moment waarop de order is aangemaakt.
 *                   example: "2025-01-01T10:00:00Z"
 *                 MomentDelivered:
 *                   type: string
 *                   format: date-time
 *                   description: Het moment waarop de bestelling is afgeleverd.
 *                   example: "2025-01-02T14:00:00Z"
 *                 MomentGathered:
 *                   type: string
 *                   format: date-time
 *                   description: Het moment waarop de bestelling is opgehaald.
 *                   example: "2025-01-03T16:30:00Z"
 *       404:
 *         description: Geen order gevonden met het opgegeven ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No order found with given order ID
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
router.get('/api/orders/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // Gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const orderid = data.id;

    try {
        // SQL-query uitvoeren om gebruiker te zoeken
        const [existingorder] = await pool.query('SELECT * FROM orders WHERE OrderID = ?', [orderid]);

        if (existingorder.length > 0) {
            return response.status(200).json(existingorder);
        } else {
            return response.status(404).send({ msg: 'No order found with given order ID' });
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
 * /api/orders/{id}:
 *   put:
 *     tags:
 *       - Orders
 *     summary: Update een bestaande order op basis van het ID
 *     description: |
 *       Dit endpoint wordt gebruikt om een bestaande order bij te werken in de database. 
 *       Alle velden moeten worden meegegeven in de request body, zelfs als er geen wijzigingen zijn.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Het unieke ID van de order die geüpdatet moet worden.
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
 *               LockerID:
 *                 type: string
 *                 description: Het unieke ID van de locker.
 *                 example: 1
 *               BookingID:
 *                 type: integer
 *                 description: Het unieke ID van de boeking.
 *                 example: 2
 *               Price:
 *                 type: number
 *                 format: integer
 *                 description: De prijs van de order.
 *                 example: 29
 *               MomentCreated:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment waarop de order is aangemaakt.
 *                 example: "2025-01-03 16:30:00"
 *               MomentDelivered:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment waarop de bestelling is afgeleverd.
 *                 example: "2025-01-03 16:50:00"
 *               MomentGathered:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment waarop de bestelling is opgehaald.
 *                 example: "2025-01-03 16:55:00"
 *     responses:
 *       200:
 *         description: Order succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Order updated successfully
 *       400:
 *         description: Ongeldige locker ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: no Locker found with given locker ID
 *       404:
 *         description: Geen order of boeking gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   examples:
 *                     NoOrder: No order found with given ID
 *                     NoBooking: No Booking found with given BookingID
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
router.put ('/api/orders/:id', checkSchema(patchOrdersValidation),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const oderid= request.params.id;

    const [invalidid] = await pool.query(`SELECT * FROM orders WHERE OrderID = ?`, [oderid]);
    if(invalidid.length === 0) {
        return response.status(404).send({msg: "No order found with given ID"})
    } 

    const [existingLocker] = await pool.query(`SELECT * FROM lockers WHERE LockerID = ?`, [data.LockerID]);         
    if (existingLocker.length === 0) {
        return response.status(400).send({ msg: "No locker found with given ID" });
    }
    
    const [NonExsistingBookingID] = await pool.query(`SELECT * FROM Bookings WHERE BookingID = ?`, [data.BookingID]); 
    if (NonExsistingBookingID.length === 0) {
        return response.status(404).send({ msg: "No Booking found with given BookingID" });
    }
    
    const [locker] = await pool.query(`SELECT * FROM lockers WHERE BookingID = ?`, [data.BookingID]); 
    if (locker.length === 0) {
        return response.status(404).send({ msg: "No Locker found with given BookingID" });
    }

    try {
        const [updatedorder] = await pool.query(
            `UPDATE orders
            SET BookingID = ?, LockerID = ?, Price = ?, MomentCreated = ?, MomentDelivered = ?, MomentGathered = ? WHERE OrderID = ? `, // SQL query om een gebruiker toe te voegen
            [data.BookingID, data.LockerID, data.Price, data.MomentCreated, data.MomentDelivered, data.MomentGathered, oderid] // De waarden die in de query moeten worden ingevuld
        );
        
        if (updatedorder.affectedRows === 0) {
            return response.status(404).send({ msg: 'Order not updated' });  // Als er geen rijen zijn bijgewerkt stuur 404 status
        }
        return response.status(200).send({ msg: 'Order updated successfully' }); //false run 200 status
        
    } catch (error) {
        console.log(error.message);
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
    
});




/**
 * @swagger
 * /api/orders/{id}:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Wijzig specifieke gegevens van een bestaande order
 *     description: |
 *       Dit endpoint wordt gebruikt om een of meerdere velden van een bestaande order bij te werken.
 *       Alleen de velden die moeten worden gewijzigd hoeven in de request body te worden opgenomen.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Het unieke ID van de order die moet worden bijgewerkt.
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
 *               LockerID:
 *                 type: string
 *                 description: Het unieke ID van de locker.
 *                 example: 1
 *               BookingID:
 *                 type: integer
 *                 description: Het unieke ID van de boeking.
 *                 example: 1
 *               Price:
 *                 type: number
 *                 format: integer
 *                 description: De prijs van de order.
 *                 example: 29
 *               MomentCreated:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment waarop de order is aangemaakt.
 *                 example: "2025-01-03 16:30:00"
 *               MomentDelivered:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment waarop de bestelling is afgeleverd.
 *                 example: "2025-01-03 16:35:00"
 *               MomentGathered:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment waarop de bestelling is opgehaald.
 *                 example: "2025-01-03 16:30:00"
 *     responses:
 *       200:
 *         description: Order succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: order is updated
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
 *                     NoFields: there are no fields to update
 *                     LockerExists: Locker ID already exists
 *                     NoValues: no given values to update
 *       404:
 *         description: Geen order gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Order not found
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
router.patch ('/api/orders/:id', checkSchema(patchOrdersValidation),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const orderid = request.params.id;

    try {
        const [existingorder] = await pool.query('SELECT * FROM orders WHERE OrderID = ?', [orderid]);

        if (existingorder.length === 0) {
            return response.status(404).send({msg: "Order not found"}); 
        }

        const veldenOmTeUpdaten =[];
        const WaardenOmTeUpdaten = [];

        if(data.BookingID){
            veldenOmTeUpdaten.push(`BookingID = ?`);
            WaardenOmTeUpdaten.push(data.BookingID);
        }
        if(data.LockerID){
            veldenOmTeUpdaten.push(`LockerID = ?`);
            WaardenOmTeUpdaten.push(data.LockerID);
        }
        if(data.Price){
            veldenOmTeUpdaten.push(`Price = ?`);
            WaardenOmTeUpdaten.push(data.Price);
        }
        if(data.MomentCreated){
            veldenOmTeUpdaten.push(`MomentCreated = ?`);
            WaardenOmTeUpdaten.push(data.MomentCreated);
        }
        if(data.MomentDelivered){
            veldenOmTeUpdaten.push(`MomentDelivered = ?`);
            WaardenOmTeUpdaten.push(data.MomentDelivered);
        }
        if(data.MomentGathered){
            veldenOmTeUpdaten.push(`MomentGathered = ?`);
            WaardenOmTeUpdaten.push(data.MomentGathered);
        }
 


        WaardenOmTeUpdaten.push(orderid);

        if (veldenOmTeUpdaten === 0){
            return response.status(400).send({msg: "there are no fields to update"});
        } 

        const [locker] = await pool.query(`SELECT * FROM lockers WHERE BookingID = ?`, [data.BookingID]); 
        if (locker.length === 0) {
            return response.status(404).send({ msg: "No Locker found with given BookingID" });
        }

        const [existingLockerID] = await pool.query(`SELECT * FROM lockers WHERE LockerID = ?`, [data.LockerID]); 

        if (existingLockerID.length === 0) {
            return response.status(400).send({ msg: "No locker found with given ID" });
        }
        
        //opstellen van de query
        const sqlQuery = `
            UPDATE orders
            SET ${veldenOmTeUpdaten.join(', ')} WHERE OrderID = ?
        `;

        //uitvoeren van de query
        const [updatedorder] = await pool.query(sqlQuery, WaardenOmTeUpdaten);

        if (updatedorder.affectedRows === 0 ){
            return response.status(400).send({msg: "no given values to update"})
        }

        return response.status(200).send({msg: "order is updated"})

    } catch (error) {
        console.log(error.message);
         // Foutafhandeling: Log de fout en stuur een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});





/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     tags:
 *       - Orders
 *     summary: Verwijder een bestaande order en de gekoppelde producten
 *     description: |
 *       Dit endpoint verwijdert een bestaande order en de bijbehorende producten uit de database op basis van het opgegeven unieke order ID.
 *       Als de order of de gekoppelde producten niet worden gevonden, retourneert het een foutmelding.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Het unieke ID van de order die moet worden verwijderd.
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       204:
 *         description: Order en gekoppelde producten succesvol verwijderd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Order and products are deleted.
 *       404:
 *         description: Geen order of gekoppelde producten gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Order or products found with given ID
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

// delete request voor het verwijderen van een user in dit geval.
router.delete ('/api/orders/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request); 
    const orderid = data.id;

    try {
        const [ordercheck] = await pool.query('SELECT * FROM orders Where OrderID = ?', [orderid]);
        if (ordercheck.length === 0){
            return response.status(404).send({msg: "Order not found"})
        }
        const [orderCheck2] = await pool.query('SELECT * FROM ordered_products Where OrderID = ?', [orderid]);
        if (orderCheck2.length === 0){
            return response.status(404).send({msg: "No ordered products found with given order ID"})
        }

        else
        await pool.query('DELETE FROM Orders WHERE OrderID = ?', [orderid]);
        await pool.query('DELETE FROM ordered_products WHERE OrderID = ?', [orderid]);
        return response.status(204).send({msg: "order and products are deleted."});

    } catch (error) {
        console.log(error.message);
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});


// exporteren van de routes
export default router;