import { Router } from "express";
import { query, checkSchema, validationResult, body, matchedData } from "express-validator";
import { IDvalidatie, BookingValidation, emailvalidator } from "../utils/validationschemas.mjs"
import { resultValidator, userCreationLimiter} from "../utils/middelwares.mjs";
import pool from "../postgress/db.mjs";
import { mapBookingData } from "../utils/response.mjs";
import cors from 'cors';
import { corsOptions } from "../utils/middelwares.mjs";



// maakt een routes aan
const router = Router();




/**
 * @swagger
 * /api/bookings/:
 *   post:
 *     tags:
 *       - Bookings
 *     summary: Maak een nieuwe boeking aan
 *     description: |
 *       Dit endpoint maakt een nieuwe boeking aan in de database. Het controleert eerst of er een gebruiker bestaat met het opgegeven e-mailadres en of de gekozen plaats beschikbaar is binnen de opgegeven data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Email
 *               - NumberOfGuests
 *               - NumberOfKeycards
 *               - MomentStart
 *               - MomentEnd
 *               - PlaceNumber
 *               - CheckedIn
 *             properties:
 *               Email:
 *                 type: string
 *                 description: Het e-mailadres van de gebruiker die de boeking maakt.
 *                 example: user@example.com
 *               NumberOfGuests:
 *                 type: integer
 *                 description: Het aantal gasten voor de boeking.
 *                 example: 2
 *               NumberOfKeycards:
 *                 type: integer
 *                 description: Het aantal sleutelkaarten dat nodig is voor de boeking.
 *                 example: 1
 *               MomentStart:
 *                 type: string
 *                 format: date-time
 *                 description: De startdatum en -tijd van de boeking.
 *                 example: "2025-03-13 15:30:45"
 *               MomentEnd:
 *                 type: string
 *                 format: date-time
 *                 description: De einddatum en -tijd van de boeking.
 *                 example: "2025-12-13 15:30:45"
 *               PlaceNumber:
 *                 type: string
 *                 description: Het nummer van de plaats die geboekt wordt.
 *                 example: "5"
 *               CheckedIn:
 *                 type: boolean
 *                 description: Geeft aan of de gebruiker al is ingecheckt.
 *                 example: false
 *     responses:
 *       201:
 *         description: Boekingsinformatie succesvol aangemaakt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 BookingID:
 *                   type: integer
 *                   example: 1
 *                 UserID:
 *                   type: integer
 *                   example: 123
 *                 NumberOfGuests:
 *                   type: integer
 *                   example: 2
 *                 NumberOfKeycards:
 *                   type: integer
 *                   example: 1
 *                 MomentStart:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-03-13 15:30:45"
 *                 MomentEnd:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-12-15 15:30:45"
 *                 PlaceNumber:
 *                   type: string
 *                   example: "5"
 *                 CheckedIn:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Ongeldige aanvraag, bijvoorbeeld door overlapping in boekingen of ontbrekende gebruiker
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: The selected place is already booked for the chosen dates
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: The selected start date overlaps with an existing booking.
 *       404:
 *         description: Geen gebruiker gevonden met het opgegeven e-mailadres
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No user found with given email
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

router.post('/api/bookings/', checkSchema(BookingValidation), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request); 

    try {

        // haalt het userid op aan de hand van gegeven email adress.
        const [ophalenUserID] = await pool.query(`SELECT UserID FROM users WHERE email = ?`, [data.Email]);
        
        // kijkt of er een user is gevonden met het gegeven mail adress.
        if (ophalenUserID.length === 0){
            return response.status(404).send({msg: "No user found with given email"})
        };
        
        
        // 
        const [resultPlek] = await pool.query(`
            SELECT PlaceNumber, MomentStart, MomentEnd
            FROM Bookings
            WHERE PlaceNumber = ?
              AND (
                (MomentStart BETWEEN ? AND ?)  -- Controleer of de startdatum overlapt met een bestaande boeking
                OR
                (MomentEnd BETWEEN ? AND ?)    -- Controleer of de einddatum overlapt met een bestaande boeking
                OR
                (? BETWEEN MomentStart AND MomentEnd)  -- Controleer of de gekozen periode valt binnen een bestaande boeking
              )
        `, [data.PlaceNumber, data.MomentStart, data.MomentEnd, data.MomentStart, data.MomentEnd, data.MomentStart]);
        
        // Als er overlappen zijn in de boekingen, geef gedetailleerde foutmeldingen terug
        if (resultPlek.length > 0) {
            const errorMessages = [];
        
            // Controleer of de startdatum overlap heeft met bestaande boekingen
            if (resultPlek.some(booking => new Date(booking.MomentStart) <= new Date(data.MomentEnd) && new Date(booking.MomentEnd) >= new Date(data.MomentStart))) {
                errorMessages.push("The selected start date overlaps with an existing booking.");
            }
        
            // Controleer of de einddatum overlap heeft met bestaande boekingen
            if (resultPlek.some(booking => new Date(booking.MomentStart) < new Date(data.MomentEnd) && new Date(booking.MomentEnd) > new Date(data.MomentStart))) {
                errorMessages.push("The selected end date overlaps with an existing booking.");
            }
        
            // Als er fouten zijn, geef ze terug
            return response.status(400).send({ msg: "The selected place is already booked for the chosen dates", errors: errorMessages })};
       

        // userid varibalen waar het opgehaalde id in wordt opgeslagen.
        const userid = ophalenUserID[0].UserID;

        const [result] = await pool.query(
            `INSERT INTO bookings (UserID, NumberOfGuests, NumberOfKeycards, MomentStart, MomentEnd, PlaceNumber, CheckedIn) VALUES (?, ?, ?, ?, ?, ?, ?)`, // SQL query om een gebruiker toe te voegen
            [userid, data.NumberOfGuests, data.NumberOfKeycards, data.MomentStart, data.MomentEnd, data.PlaceNumber, data.CheckedIn,] // De waarden die in de query moeten worden ingevuld
        );
        
        // Stap 3: Maak een object aan met de nieuwe gebruiker inclusief hun gegenereerde id
        const newBooking = {
            BookingID: result.insertId,
            UserID: userid, //variabelen voeg ik toe als data in database. 
            NumberOfGuests: data.NumberOfGuests,
            NumberOfKeycards: data.NumberOfKeycards,
            MomentStart: data.MomentStart,
            MomentEnd: data.MomentEnd,
            PlaceNumber: data.PlaceNumber,
            CheckedIn: data.CheckedIn,
        };

        return response.status(201).send(newBooking);

        
    } catch (error) {

        // Als er een andere fout is, stuur dan een generieke serverfout
        return response.status(500).send({ msg: "Server error" });
    }
});




/**
 * @swagger
 * /api/bookings:
 *   get:
 *     tags:
 *       - Bookings
 *     summary: Haal boekingen op voor een gebruiker
 *     description: |
 *       Dit endpoint haalt de boekingen op voor een gebruiker aan de hand van hun e-mailadres. Het controleert of de gebruiker bestaat en retourneert alle boekingen die bij de opgegeven gebruiker horen.
 *     parameters:
 *       - name: Email
 *         in: query
 *         description: Het e-mailadres van de gebruiker waarvan de boekingen opgehaald moeten worden.
 *         required: true
 *         schema:
 *           type: string
 *           example: user@example.com
 *     responses:
 *       200:
 *         description: Lijst met boekingen van de gebruiker
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   BookingID:
 *                     type: integer
 *                     example: 1
 *                   UserID:
 *                     type: integer
 *                     example: 123
 *                   NumberOfGuests:
 *                     type: integer
 *                     example: 2
 *                   NumberOfKeycards:
 *                     type: integer
 *                     example: 1
 *                   MomentStart:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-20T14:00:00Z"
 *                   MomentEnd:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-12-25T10:00:00Z"
 *                   PlaceNumber:
 *                     type: string
 *                     example: "5"
 *                   CheckedIn:
 *                     type: boolean
 *                     example: false
 *       404:
 *         description: Geen gebruiker gevonden of geen boekingen voor het opgegeven e-mailadres
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No user found with given email
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

router.get('/api/bookings',checkSchema(emailvalidator), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request);

    try {
        // haalt het userid op aan de hand van gegeven email adress.
        const [ophalenUserID] = await pool.query(`SELECT UserID FROM users WHERE email = ?`, [data.Email]);
        
        // kijkt of er een user is gevonden met het gegeven mail adress.
        if (ophalenUserID.length === 0){
            return response.status(404).send({msg: "No user found with given email"})
        };

        // userid varibalen waar het opgehaalde id in wordt opgeslagen.
        const userid = ophalenUserID[0].UserID;


        const [ophalenBookings] = await pool.query(`SELECT * FROM bookings WHERE UserID = ?`, [userid]);
        if (ophalenBookings.length !== 0 ){
            // Transformeer de resultaten met mapBookingData
            const mappedBookings = ophalenBookings.map(mapBookingData);
            return response.status(200).send(mappedBookings)
        }
        else{
            return response.status(404).send({msg: "No bookings foud with given email"})
        }

    } catch (error) {
        // Als er een andere fout is, stuur dan een generieke serverfout
        return response.status(500).send({ msg: "Server error" });
    }

});




/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     tags:
 *       - Bookings
 *     summary: Verwijder een boeking
 *     description: |
 *       Dit endpoint verwijdert een boeking op basis van het opgegeven BookingID. Het controleert of de boeking bestaat, en als dat het geval is, wordt deze uit de database verwijderd.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: De unieke ID van de boeking die verwijderd moet worden
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Boeking succesvol geannuleerd
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Booking is cancelled
 *       404:
 *         description: Geen boeking gevonden met de opgegeven BookingID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: No booking found with given booking id
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

router.delete('/api/bookings/:id', checkSchema(IDvalidatie), resultValidator, cors(corsOptions), async (request, response) => {
    // gevalideerde data wordt opgeslagen in data variabelen
    const data = matchedData(request);
    const BookingID = data.id;
try {
    const [checkenBooking] = await pool.query(`SELECT * FROM bookings WHERE BookingID = ?`, [BookingID]);
    if (checkenBooking.length === 0){
        return response.status(404).send({msg: "No booking found with given booking id"});
    }
    else{
        await pool.query(`DELETE FROM bookings WHERE BookingID = ?`, [BookingID]);
        return response.status(200).send({msg: "Booking is canncelled"});
    }

} catch (error) {
        // Als er een andere fout is, stuur dan een generieke serverfout
        return response.status(500).send({ msg: "Server error" });
}
});




// exporteren van de routes
export default router;