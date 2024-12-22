import { Router } from "express";
import { query, checkSchema, validationResult, body, matchedData } from "express-validator";
import { filterValidationSchema, createuserValidationSchema, IDvalidatie, updateUserValidationSchema, LockerValidation, UpdateLockerValidation, UpdateLockerpatchValidation } from "../utils/validationschemas.mjs"
import { userCreationLimiter, resultValidator} from "../utils/middelwares.mjs";
import pool from "../postgress/db.mjs";
import cors from 'cors';
import { corsOptions } from "../utils/middelwares.mjs";




// maakt een routes aan
const router = Router();



/**
 * @swagger
 * /api/lockers:
 *   post:
 *     tags:
 *       - Lockers
 *     summary: Maak een nieuwe locker aan
 *     description: |
 *       Dit endpoint maakt een nieuwe locker aan in de database. De `LockerID` moet uniek zijn en de opgegeven `BookingID` moet bestaan in de Bookings-tabel.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               LockerID:
 *                 type: integer
 *                 description: Het unieke ID van de nieuwe locker
 *                 example: 1
 *               BookingID:
 *                 type: integer
 *                 description: Het ID van de reservering gekoppeld aan de locker
 *                 example: 101
 *     responses:
 *       201:
 *         description: Locker succesvol aangemaakt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lockerid:
 *                   type: integer
 *                   description: Het unieke ID van de aangemaakte locker
 *                   example: 1
 *                 bookingid:
 *                   type: integer
 *                   description: Het ID van de reservering gekoppeld aan de locker
 *                   example: 101
 *       400:
 *         description: Locker ID is al in gebruik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Locker already in use
 *       404:
 *         description: Geen reservering gevonden met de opgegeven BookingID
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
router.post('/api/lockers',  checkSchema(LockerValidation), resultValidator, cors(corsOptions), async (request, response) => {
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

        await pool.query(
            `INSERT INTO lockers (LockerID, BookingID) VALUES (?, ?)`, 
            [data.LockerID, data.BookingID,] 
        );

        const usingLocker = {
            lockerid: data.LockerID,  // Verkrijg het ID van de net ingevoegde gebruiker
            bookingid: data.BookingID,
        };

        return response.status(201).send(usingLocker); // HTTP status 201 betekent 'Created'

    } catch (err) {

        return response.status(500).send({ msg: "Server error" });
    }
});



/**
 * @swagger
 * /api/lockers:
 *   get:
 *     tags:
 *       - Lockers
 *     summary: Haal alle lockers op
 *     description: |
 *       Dit endpoint haalt alle lockers op die in de database zijn opgeslagen. Als er geen lockers gevonden worden, geeft het een 404-status terug.
 *     responses:
 *       200:
 *         description: Alle lockers succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   LockerID:
 *                     type: integer
 *                     example: 1
 *                   BookingID:
 *                     type: integer
 *                     example: 101
 *                   MomentDelivered:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-18T12:00:00Z"
 *       404:
 *         description: Geen lockers gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No lockers found
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

router.get('/api/lockers', cors(corsOptions), async (request, response) => {
    try {
        const [getlockers] = await pool.query(`SELECT * FROM lockers`)
        if (getlockers.length === 0){
            return response.status(404).send({msg: "No lockers found"})
        }
        return response.status(200).json(getlockers);
    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});



/**
 * @swagger
 * /api/lockers/{id}:
 *   get:
 *     tags:
 *       - Lockers
 *     summary: Haal een locker op aan de hand van de unieke ID
 *     description: |
 *       Dit endpoint haalt een locker op uit de database op basis van de opgegeven unieke ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: De unieke ID van de locker die moet worden opgehaald
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Locker succesvol opgehaald
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 LockerID:
 *                   type: integer
 *                   example: 1
 *                 BookingID:
 *                   type: integer
 *                   example: 101
 *                 MomentDelivered:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-12-18T12:00:00Z"
 *       404:
 *         description: Geen locker gevonden met het opgegeven ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No lockers found with given ID
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
router.get('/api/lockers/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // Gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const lockerid = data.id;

    try {
        // SQL-query uitvoeren om gebruiker te zoeken
        const [existingLocker] = await pool.query('SELECT * FROM lockers WHERE LockerID = ?', [lockerid]);

        if (existingLocker.length > 0) {
            return response.status(200).json(existingLocker);
        } else {
            return response.status(404).send({ msg: 'No locker found with given Locker ID' });
        }
    } catch (error) {
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});



/**
 * @swagger
 * /api/lockers/{id}:
 *   put:
 *     tags:
 *       - Lockers
 *     summary: Werk een bestaande locker volledig bij
 *     description: |
 *       Dit endpoint werkt een bestaande locker bij op basis van de opgegeven unieke ID. 
 *       Alle vereiste velden moeten worden meegestuurd in de request body.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: De unieke ID van de locker die moet worden bijgewerkt
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
 *                 type: integer
 *                 description: De unieke ID van het nieuwe locker
 *                 example: 1
 *               MomentDelivered:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment van levering van de locker
 *                 example: "2024-12-18T12:00:00Z"
 *     responses:
 *       200:
 *         description: Locker succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Locker updated successfully
 *       404:
 *         description: Locker of BookingID niet gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No locker found with given ID
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
router.put ('/api/lockers/:id', checkSchema(UpdateLockerValidation),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const lockerid= request.params.id;

    const [invalidid] = await pool.query(`SELECT * FROM lockers WHERE LockerID = ?`, [lockerid]);
    if(invalidid.length === 0) {
        return response.status(404).send({msg: "No locker found with given ID"})
    } 

    
    const [NonExsistingBookingID] = await pool.query(`SELECT * FROM Bookings WHERE BookingID = ?`, [data.BookingID]); 
    if (NonExsistingBookingID.length === 0) {
        return response.status(404).send({ msg: "No Booking found with given BookingID" });
    }
    
    try {
        const [updatedlocker] = await pool.query(
            `UPDATE lockers
            SET BookingID = ?, MomentDelivered = ? WHERE LockerID = ? `, // SQL query om een gebruiker toe te voegen
            [data.BookingID, data.MomentDelivered, lockerid] // De waarden die in de query moeten worden ingevuld
        );
        
        if (updatedlocker.affectedRows === 0) {
            return response.status(404).send({ msg: 'Locker not updated' });  // Als er geen rijen zijn bijgewerkt stuur 404 status
        }
        return response.status(200).send({ msg: 'Locker updated successfully' }); //false run 200 status
        
    } catch (error) {
        // Verbeterde foutafhandeling: Log de fout en geef een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
    
});




/**
 * @swagger
 * /api/lockers/{id}:
 *   patch:
 *     tags:
 *       - Lockers
 *     summary: Update een of meerdere velden van een bestaande locker
 *     description: |
 *       Dit endpoint stelt je in staat om een of meerdere eigenschappen van een bestaande locker bij te werken. 
 *       Alleen de opgegeven velden worden gewijzigd.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: De unieke ID van de locker die moet worden bijgewerkt
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
 *                 type: integer
 *                 description: Het nieuwe ID voor de locker
 *                 example: 2
 *               MomentDelivered:
 *                 type: string
 *                 format: date-time
 *                 description: Het moment van levering van de locker
 *                 example: "2024-12-18T12:00:00Z"
 *     responses:
 *       200:
 *         description: Locker succesvol bijgewerkt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Locker is updated
 *       400:
 *         description: Ongeldige invoer of geen velden om bij te werken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No given values to update
 *       404:
 *         description: Locker niet gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Locker not found
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
router.patch ('/api/lockers/:id', checkSchema(UpdateLockerpatchValidation),  checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 
    const lockerid = request.params.id;

    try {
        const [existingLocker] = await pool.query('SELECT * FROM lockers WHERE LockerID = ?', [lockerid]);

        if (existingLocker.length === 0) {
            return response.status(404).send({msg: "Locker not found"}); 
        }

        const FieldsToUpdate =[];
        const ValuesToUpdate = [];

        if(data.LockerID){
            FieldsToUpdate.push(`LockerID = ?`);
            ValuesToUpdate.push(data.LockerID);
        }
        if(data.MomentDelivered){
            FieldsToUpdate.push(`MomentDelivered = ?`);
            ValuesToUpdate.push(data.MomentDelivered);
        }


        ValuesToUpdate.push(lockerid);

        if (FieldsToUpdate === 0){
            return response.status(400).send({msg: "there are no fields to update"});
        } 

        const [existingLockerID] = await pool.query(`SELECT * FROM lockers WHERE LockerID = ?`, [data.LockerID]); 

        if (existingLockerID.length > 0) {
            return response.status(400).send({ msg: "Locker ID already exists" });
        }
        
        //opstellen van de query
        const sqlQuery = `
            UPDATE lockers
            SET ${FieldsToUpdate.join(', ')} WHERE LockerID = ?
        `;

        //uitvoeren van de query
        const [updatedlocker] = await pool.query(sqlQuery, ValuesToUpdate);

        if (updatedlocker.affectedRows === 0 ){
            return response.status(400).send({msg: "no given values to update"})
        }

        return response.status(200).send({msg: "Locker is updated"})

    } catch (error) {
         // Foutafhandeling: Log de fout en stuur een interne serverfout terug
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});




/**
 * @swagger
 * /api/lockers/{id}:
 *   delete:
 *     tags:
 *       - Lockers
 *     summary: Verwijder een bestaande locker
 *     description: |
 *       Dit endpoint verwijdert een bestaande locker uit de database op basis van hun unieke ID.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: De unieke ID van de locker die moet worden verwijderd
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       204:
 *         description: Locker succesvol verwijderd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Locker is deleted
 *       404:
 *         description: Locker niet gevonden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Locker not found
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
router.delete ('/api/lockers/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    const data = matchedData(request); 
    const lockerid = data.id;

    try {
        const [lockerCheck] = await pool.query('SELECT * FROM lockers Where LockerID = ?', [lockerid]);
        if (lockerCheck.length === 0){
            return response.status(404).send({msg: "Locker not found"})
        }
        else
        await pool.query('DELETE FROM lockers WHERE LockerID = ?', [lockerid]);
        return response.status(204).send({msg: "Locker is deleted"});

    } catch (error) {
        console.error('Database error:', error);
        return response.status(500).send({ msg: 'Internal server error' });
    }
});


export default router;
