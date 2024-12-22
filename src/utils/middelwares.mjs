import { request, response } from "express";
import { MockUsers } from "./constants.mjs";
import rateLimit from 'express-rate-limit'; // Importeren van express-rate-limit
import {validationResult,} from "express-validator"


//midelware code functie voor het opzoeken van een id
export const resolveIndexByUserId = (request, response, next) => {
    const{params: {id}} = request;

    const parseId = parseInt(id);
    if (isNaN(parseId)) return response.status(400).send("Bad request");
    const findUserIndex = MockUsers.findIndex(
        (user) => user.id === parseId
    );

    if(findUserIndex === -1) return response.sendStatus(404);
    request.findUserIndex = findUserIndex;
    next();
};



// Rate-limiting configureren
export const userCreationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuten
    max: 100, // Maximaal 100 verzoeken per IP
    message: 'Too many accounts created from this IP, please try again later',
});

export const corsOptions = {
    origin: ['http://127.0.0.1:3000', 'http://localhost:8080'], // Specifieke frontend-domain
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Alleen GET en POST-methodes toestaan
    allowedHeaders: ['Content-Type', 'Authorization'], // Toegestane headers
    credentials: true, // Cookies toestaan
};


export const resultValidator = (request, response, next) => {
    const result = validationResult(request);
    if (!result.isEmpty()) {
    const formattedErrors = result.array().map((error) => ({
            field: error.path,
            message: error.msg,
    }));
        return response.status(400).send({ errors: formattedErrors });
    };
    next();
};




// export const PatchChecker = (request, response, next) => {
//     const data = request.body; // Pak de gegevens uit de body van het verzoek

//     const teUpdatenVelden = [];
//     const teUpdatenWaarden = [];

//     // Controleren welke velden aanwezig zijn in de body en deze toevoegen aan de query
//     if (data.email) {
//         teUpdatenVelden.push(`email = ?`);
//         teUpdatenWaarden.push(data.email);
//     }
//     if (data.phone) {
//         teUpdatenVelden.push(`phone = ?`);
//         teUpdatenWaarden.push(data.phone);
//     }
//     if (data.firstname) {
//         teUpdatenVelden.push(`firstname = ?`);
//         teUpdatenWaarden.push(data.firstname);
//     }
//     if (data.lastname) {
//         teUpdatenVelden.push(`lastname = ?`);
//         teUpdatenWaarden.push(data.lastname);
//     }
//     if (data.housenumber) {
//         teUpdatenVelden.push(`housenumber = ?`);
//         teUpdatenWaarden.push(data.housenumber);
//     }
//     if (data.postalcode) {
//         teUpdatenVelden.push(`postalcode = ?`);
//         teUpdatenWaarden.push(data.postalcode);
//     }
//     if (data.streetname) {
//         teUpdatenVelden.push(`streetname = ?`);
//         teUpdatenWaarden.push(data.streetname);
//     }
//     if (data.country) {
//         teUpdatenVelden.push(`country = ?`);
//         teUpdatenWaarden.push(data.country);
//     }

//     // Controleer of er velden zijn om te updaten
//     if (teUpdatenVelden.length === 0) {
//         return response.status(400).send({ msg: "There are no fields to update" });
//     }

//     // Voeg de dynamische waarden toe aan het request object zodat andere middleware deze kan gebruiken
//     request.teUpdatenVelden = teUpdatenVelden;
//     request.teUpdatenWaarden = teUpdatenWaarden;

//     next(); // Ga door naar de volgende middleware
// };
