import { Router } from "express";
import { query, checkSchema, validationResult, body, matchedData } from "express-validator";
import { IDvalidatie, createOrderValidation, patchOrdersValidation,  } from "../utils/validationschemas.mjs"
import { userCreationLimiter} from "../utils/middelwares.mjs";
import pool from "../postgress/db.mjs";
import cors from 'cors';
import { corsOptions, resultValidator } from "../utils/middelwares.mjs";



// maakt een routes aan
const router = Router();




// POST request voor het aanmaken van een nieuwe gebruiker
router.post('/api/orders',  checkSchema(createOrderValidation), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    try {

        const [existingLocker] = await pool.query(`SELECT * FROM lockers WHERE LockerID = ?`, [data.LockerID]);         
        if (existingLocker.length > 0) {
            return response.status(400).send({ msg: "Locker already in use" });
        }

        const [NonExsistingBookingID] = await pool.query(`SELECT * FROM Bookings WHERE BookingID = ?`, [data.BookingID]); 
        if (NonExsistingBookingID.length === 0) {
            return response.status(404).send({ msg: "No Booking found with given BookingID" });
        }

        const[result] = await pool.query(
            `INSERT INTO orders (LockerID, BookingID, Price, MomentCreated, MomentDelivered, MomentGathered,) VALUES (?, ?, ?, ?, ?, ?)`, 
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

        return response.status(500).send({ msg: "Server error" });
    }
});




router.get('/api/orders', cors(corsOptions), async (request, response) => {
    try {
        const [getorders] = await pool.query(`SELECT * FROM orders`)
        if (getorders.length === 0){
            return response.status(404).send({msg: "No orders found"})
        }
        return response.status(200).json(getorders);
    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});




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
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});


// put request 
router.put ('/api/orders/:id', checkSchema(patchOrdersValidation),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const oderid= request.params.id;

    const [invalidid] = await pool.query(`SELECT * FROM orders WHERE OrderID = ?`, [oderid]);
    if(invalidid.length === 0) {
        return response.status(404).send({msg: "No order found with given ID"})
    } 

    const [nonexistingLocker] = await pool.query(`SELECT * FROM lockers WHERE LockerID = ?`, [data.LockerID]);         
    if (nonexistingLocker.length !== 0) {
        return response.status(400).send({ msg: "no Locker found with given locker ID" });
    }
    
    const [NonExsistingBookingID] = await pool.query(`SELECT * FROM Bookings WHERE BookingID = ?`, [data.BookingID]); 
    if (NonExsistingBookingID.length === 0) {
        return response.status(404).send({ msg: "No Booking found with given BookingID" });
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
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
    
});


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

        const [existingLockerID] = await pool.query(`SELECT * FROM lockers WHERE LockerID = ?`, [data.LockerID]); 

        if (existingLockerID.length > 0) {
            return response.status(400).send({ msg: "Locker ID already exists" });
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
         // Foutafhandeling: Log de fout en stuur een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});


// delete request voor het verwijderen van een user in dit geval.
router.delete ('/api/orders/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request); 
    const orderid = data.id;

    try {
        const [ordercheck] = await pool.query('SELECT * FROM orders Where OrderID = ?', [orderid]);
        if (ordercheck.length === 0){
            return response.status(404).send({msg: "Order not found"})
        }
        else
        await pool.query('DELETE FROM Orders WHERE OrderID = ?', [lockerid]);
        return response.status(204).send({msg: "Order is deleted"});

    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});


// exporteren van de routes
export default router;