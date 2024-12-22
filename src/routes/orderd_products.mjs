import { Router } from "express";
import { query, checkSchema, validationResult, body, matchedData } from "express-validator";
import {  IDvalidatie, UpdateLockerValidation, UpdateLockerpatchValidation, createorderdProductValidation, updateorderdProductValidation } from "../utils/validationschemas.mjs"
import { userCreationLimiter, resultValidator} from "../utils/middelwares.mjs";
import pool from "../postgress/db.mjs";
import cors from 'cors';
import { corsOptions } from "../utils/middelwares.mjs";




// maakt een routes aan
const router = Router();




// POST request voor het aanmaken van een nieuwe gebruiker
router.post('/api/orderd_products',  checkSchema(createorderdProductValidation), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    try {

        const [existingorder] = await pool.query(`SELECT * FROM orders WHERE orderID = ?`, [data.OrderID]);         
        if (existingorder.length === 0) {
            return response.status(400).send({ msg: "No order found with given Order ID " });
        }

        const [NoExsistingProducts] = await pool.query(`SELECT * FROM products WHERE ProductID = ?`, [data.ProductID]); 
        if (NoExsistingProducts.length === 0) {
            return response.status(404).send({ msg: "No product found with given productID" });
        }

        await pool.query(
            `INSERT INTO orderd_products (ProductID, OrderID, Amount) VALUES (?, ?, ?)`, 
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




router.get('/api/orderd_products', cors(corsOptions), async (request, response) => {
    try {
        const [getorderd_products] = await pool.query(`SELECT * FROM orderd_products`)
        if (getorderd_products.length === 0){
            return response.status(404).send({msg: "No orderd products found"})
        }
        return response.status(200).json(getorderd_products);
    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});




// Ophalen van users aan de hand van id
router.get('/api/orderd_products/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // Gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const orderid = data.id;

    try {
        // SQL-query uitvoeren om gebruiker te zoeken
        const [existingorder] = await pool.query('SELECT * FROM orderd_products WHERE OrderID = ?', [orderid]);

        if (existingorder.length > 0) {
            return response.status(200).json(existingorder);
        } else {
            return response.status(404).send({ msg: 'No locker found with given Locker ID' });
        }
    } catch (error) {
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});




// // put request 
// router.put ('/api/lockers/:id', checkSchema(updateorderdProductValidation),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
//     // gevalideerde data wordt opgeslagen in data variabelen
//     const data = matchedData(request); 
//     const id= request.params.id;

//     const [invalidid] = await pool.query(`SELECT * FROM lockers WHERE LockerID = ?`, [lockerid]);
//     if(invalidid.length === 0) {
//         return response.status(404).send({msg: "No locker found with given ID"})
//     } 

    
//     const [NonExsistingBookingID] = await pool.query(`SELECT * FROM Bookings WHERE BookingID = ?`, [data.BookingID]); 
//     if (NonExsistingBookingID.length === 0) {
//         return response.status(404).send({ msg: "No Booking found with given BookingID" });
//     }
    
//     try {
//         const [updatedlocker] = await pool.query(
//             `UPDATE lockers
//             SET BookingID = ?, MomentDelivered = ? WHERE LockerID = ? `, // SQL query om een gebruiker toe te voegen
//             [data.BookingID, data.MomentDelivered, lockerid] // De waarden die in de query moeten worden ingevuld
//         );
        
//         if (updatedlocker.affectedRows === 0) {
//             return response.status(404).send({ msg: 'Locker not updated' });  // Als er geen rijen zijn bijgewerkt stuur 404 status
//         }
//         return response.status(200).send({ msg: 'Locker updated successfully' }); //false run 200 status
        
//     } catch (error) {
//         // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
//         console.error('Database error:', error);
//         return response.status(500).send({ msg: 'Internal server error' });
//     }
    
// });




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
