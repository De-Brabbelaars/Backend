

import { isStringValidation, isLengthValidation, notEmptyValidation, matchesValidation, baseStringValidation } from "./validatie_helpers.mjs"

export const createuserValidationSchema = {
    Firstname: {
        ...isStringValidation('Firstname'),
        ...isLengthValidation(3, 32, 'Firstname'),
        ...notEmptyValidation('Firstname'),
    },
    Lastname: {
        ...isStringValidation('Lastname'),
        ...isLengthValidation(3, 32, 'Lastname'),
        ...notEmptyValidation('Lastname'),
    },
    Housenumber: {
        ...isStringValidation('Housenumber'),
        ...isLengthValidation(1, 6, 'Housenumber'),
        ...notEmptyValidation('Housenumber'),
    },
    Streetname: {
        ...baseStringValidation('streetname', 3, 30, /^[A-Za-z0-9 .'-]+$/, 'Streetname contains invalid characters'),
    },
    Postalcode: {
        ...baseStringValidation('Postalcode', 4, 10, /^[A-Za-z0-9 -]+$/, 'Postalcode contains invalid characters'),
    },
    Country: {
        ...baseStringValidation('Country', 4, 30, /^[A-Za-z .'-]+$/, 'Country contains invalid characters'),
    },
    Email: {
        ...notEmptyValidation('Email'),
        isEmail: { errorMessage: "Invalid email format" },
        normalizeEmail: true,
        trim: true,
        escape: true,
    },
    Phone: {
        ...isLengthValidation(10, 15, 'Phone number'),
        optional: true,
        customSanitizer: {
            options: (value) => {
                // Verwijder spaties en andere niet-numerieke tekens zoals +, -, etc.
                return value.replace(/\D/g, ''); // Verwijdert alles behalve cijfers
            },
        },
        isMobilePhone: {
            options: ['nl-NL', 'de-DE'], // controleerd of telefoon nummer voldoet aan nl of de format
            errorMessage: "Invalid phone number format. Please enter a valid Dutch or German phone number.",
        },
    },
};

export const emailvalidator = {
    Email: {
        ...notEmptyValidation('Email'),
        // Controleer of het e-mailadres een geldig formaat heeft
        isEmail: { errorMessage: "Invalid email format" },
        normalizeEmail: true, // Normaliseer het e-mailadres (bijv. zet alles om naar kleine letters)
        trim: true, // Verwijder voor- en achterwaartse spaties
        escape: true, // Escape gevaarlijke tekens
    },
};


export const updateUserValidationSchema = {
    Firstname: {
        optional: true,
        ...isStringValidation('Firstname'),
        ...isLengthValidation(3, 32, 'Firstname'),
        trim: true, // Verwijder voor- en achterwaartse spaties
        escape: true, // Escape gevaarlijke tekens om XSS-aanvallen te voorkomen
},
    Lastname: {
        optional: true,
        ...isStringValidation('Lastname'),
        ...isLengthValidation(3, 32, 'Lastname'),
        trim: true, // Verwijder voor- en achterwaartse spaties
        escape: true, // Escape gevaarlijke tekens om XSS-aanvallen te voorkomen
    },
    Housenumber: {
        optional: true,
        ...isStringValidation('Housenumber'),
        ...isLengthValidation(1, 5, 'Housenumber'),
        trim: true, // Verwijder voor- en achterwaartse spaties
        escape: true, // Escape gevaarlijke tekens om XSS-aanvallen te voorkomen
    },
    Streetname: {
        optional: true,
        ...isStringValidation('Streetname'),
        ...isLengthValidation(3, 30, 'Streetname'),
        ...matchesValidation(/^[A-Za-z0-9 .'-]+$/, 'Streetname contains invalid characters'),
        trim: true, // Verwijder voor- en achterwaartse spaties
        escape: true, // Escape gevaarlijke tekens om XSS-aanvallen te voorkomen
    },
    Postalcode: {
        optional: true,
        ...isStringValidation('Postalcode'),
        ...isLengthValidation(4, 10, 'Postalcode'),
        ...matchesValidation(/^[A-Za-z0-9 -]+$/, "Postal code contains invalid characters"),
        trim: true, // Verwijder voor- en achterwaartse spaties
        escape: true, // Escape gevaarlijke tekens om XSS-aanvallen te voorkomen
    },
    Country: {
        optional: true,
        ...isStringValidation('Country'),
        ...isLengthValidation(3, 20, 'Country'),
        ...matchesValidation(/^[A-Za-z .'-]+$/, "Country contains invalid characters"),
        trim: true, // Verwijder voor- en achterwaartse spaties
        escape: true, // Escape gevaarlijke tekens om XSS-aanvallen te voorkomen
    },
    Phone: {
        ...isLengthValidation(10, 15, 'Phone number'),
        optional: true,
        customSanitizer: {
            options: (value) => {
                // Verwijder spaties en andere niet-numerieke tekens zoals +, -, etc.
                return value.replace(/\D/g, ''); // Verwijdert alles behalve cijfers
            },
        },
        isMobilePhone: {
            options: ['nl-NL', 'de-DE'], // controleerd of telefoon nummer voldoet aan nl of de format
            errorMessage: "Invalid phone number format. Please enter a valid Dutch or German phone number.",
        },
    },
    Email: {
        optional: true,
        ...notEmptyValidation('Email'),
        isEmail: { errorMessage: "Invalid email format" },
        normalizeEmail: true,
        trim: true,
        escape: true,
    },
};




export const filterValidationSchema = {
    filter: {
        optional: true,
        ...notEmptyValidation('filter')
    },
    value: {
        optional: true,
        ...notEmptyValidation('value')
    },
};




export const IDvalidatie = {
    id: {
        optional: false,
        isInt: { errorMessage: "ID moet een nummer zijn"},
        trim: true,
        escape: true,
        toInt: true,
    },
};




export const BookingValidation = {
    Email: {
        optional: false,
        isEmail: {errorMessage: "Invalid email format",},
        ...notEmptyValidation('email'),
        normalizeEmail: true,
        trim: true,
        escape: true,
    },
    NumberOfGuests: {
        optional: false,
        isInt: {errorMessage: "Number of Guests must be an integer",},
        ...notEmptyValidation('Number of guests'),
        custom: {
            options: (value) => value >= 1 && value <= 8, // Controleer of het aantal gasten tussen 1 en 8 ligt
            errorMessage: "Number of Guests must be between 1 and 8",
        },
    },
    NumberOfKeycards: {
        optional: false,
        ...isLengthValidation(1, 8, 'Number of keycards'),
        isInt: {
            errorMessage: "Number of Keycards must be an integer",
        },
        ...notEmptyValidation('Number of keycards'),
        custom: {
            options: (value) => value >= 1 && value <= 8, // Controleer of het aantal gasten tussen 1 en 8 ligt
            errorMessage: "Number of keycards must be between 1 and 8",
        },
    },
    MomentStart: {
        optional: false,
        isString: {
            errorMessage: "Moment Start must be a valid MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment Start must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
        ...notEmptyValidation('Moment start'),
        custom: {
            options: (value) => {
                const momentStart = new Date(value);
                return momentStart > new Date(); // Controleren of Moment Start in de toekomst is
            },
            errorMessage: "Moment Start must be in the future",
        },
    },
    MomentEnd: {
        optional: false,
        isString: {
            errorMessage: "Moment End must be a valid MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment End must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
        ...notEmptyValidation('Moment end'),
        custom: {
            options: (value, { req }) => {
                const momentStart = req.body.MomentStart ? new Date(req.body.MomentStart) : null;  // Controleren of MomentStart bestaat
                const momentEnd = new Date(value);
                return momentStart && momentEnd > momentStart; // Controleer of Moment End na Moment Start ligt
            },
            errorMessage: "Moment End must be after Moment Start",
        },
    },
    PlaceNumber: {
        optional: false,
        isInt: {
            errorMessage: "Placenumber must be an integer",
        },
        isLength: {
            options: { max: 2 },
            errorMessage: "Place Number cannot exceed 2 characters",
        },
        custom: {
            options: (value) => value >= 1 && value <= 50, // Controleer of het aantal gasten tussen 1 en 8 ligt
            errorMessage: "Placenumber must be between 1 and 50",
        },
        trim: true,
        escape: true,
    },
    CheckedIn: {
        optional: true,
        custom: {
            options: (value) => {
                // Controleer of de waarde van CheckedIn 'true' of 'false' is (als string of boolean)
                return value === 'true' || value === true || value === 'false' || value === false;
            },
            errorMessage: "Checked In must be a boolean (true/false)",
        },
    },
    Note: {
        optional: true,
        isLength: {
            options: { max: 1000 },
            errorMessage: "Note cannot exceed 1000 characters",
        },
        trim: true,
        escape: true,
    },
};



export const categoryValidationSchema = {
    CategoryID: {
        optional: true, // Dit veld is alleen nodig bij updates
        isInt: {
            errorMessage: "CategoryID moet een geldig nummer zijn",
        },
        trim: true,
        escape: true,
        toInt: true,
    },
    Name: {
        optional: false, // Verplicht veld
        ...isStringValidation('Name'),
        ...isLengthValidation(1, 100, 'Name'),
        trim: true,
        escape: true,
    },
};


export const productValidationSchema = {
    ProductID: {
        optional: true, // Dit veld is alleen nodig bij updates
        isInt: {
            errorMessage: "ProductID moet een geldig nummer zijn",
        },
        trim: true,
        escape: true,
        toInt: true,
    },
    CategoryID: {
        optional: false, // Verplicht veld
        isInt: {
            errorMessage: "CategoryID moet een geldig nummer zijn",
        },
        trim: true,
        escape: true,
        toInt: true,
    },
    Name: {
        optional: false, // Verplicht veld
        ...isStringValidation('Name'),
        ...isLengthValidation(1, 100, 'Name'),
        trim: true,
        escape: true,
    },
    AssetsURL: {
        optional: false, // Verplicht veld
        isURL: {
            errorMessage: "AssetsURL moet een geldige URL zijn",
        },
        isLength: {
            options: { max: 100 },
            errorMessage: "AssetsURL mag maximaal 100 tekens bevatten",
        },
        trim: true,
    },
    Price: {
        optional: false, // Verplicht veld
        isInt: {
            options: { min: 0 },
            errorMessage: "Prijs moet een positief geheel getal zijn",
        },
        trim: true,
        toInt: true,
    },
    Size: {
        optional: false, // Verplicht veld
        ...isStringValidation('Size'),
        isLength: {
            options: { max: 10 },
            errorMessage: "Grootte mag maximaal 10 tekens bevatten",
        },
        trim: true,
        escape: true,
    },
    AmountInStock: {
        optional: false, // Verplicht veld
        isInt: {
            options: { min: 0 },
            errorMessage: "Voorraad moet een positief geheel getal zijn",
        },
        trim: true,
        toInt: true,
    },
};




export const productupdateValidationSchema = {
    CategoryID: {
        optional: true, // Verplicht veld
        isInt: {
            errorMessage: "CategoryID moet een geldig nummer zijn",
        },
        trim: true,
        escape: true,
        toInt: true,
    },
    Name: {
        optional: true, // Verplicht veld
        isString: {
            errorMessage: "Naam moet een string zijn",
        },
        isLength: {
            options: { min: 1, max: 100 },
            errorMessage: "Naam moet tussen 1 en 100 tekens lang zijn",
        },
        trim: true,
        escape: true,
    },
    AssetsURL: {
        optional: true, // Verplicht veld
        isURL: {
            errorMessage: "AssetsURL moet een geldige URL zijn",
        },
        isLength: {
            options: { max: 100 },
            errorMessage: "AssetsURL mag maximaal 100 tekens bevatten",
        },
        trim: true,
    },
    Price: {
        optional: true, // Verplicht veld
        isInt: {
            options: { min: 0 },
            errorMessage: "Prijs moet een positief geheel getal zijn",
        },
        trim: true,
        toInt: true,
    },
    Size: {
        optional: true, // Verplicht veld
        isString: {
            errorMessage: "Grootte moet een string zijn",
        },
        isLength: {
            options: { max: 10 },
            errorMessage: "Grootte mag maximaal 10 tekens bevatten",
        },
        trim: true,
        escape: true,
    },
    AmountInStock: {
        optional: true, // Verplicht veld
        isInt: {
            options: { min: 0 },
            errorMessage: "Voorraad moet een positief geheel getal zijn",
        },
        trim: true,
        toInt: true,
    },
};



export const LockerValidation = {
    LockerID: {
        optional: false,
        isInt:{
            errorMessage: "Locker ID moet een nummer zijn",
        },
        trim: true,
        toInt: true,
    },
    BookingID:{
        optional: false,
        isInt: {
            errorMessage: "Booking id moet een integer zijn",
        },
    },
    MomentDelivered: {
        ...notEmptyValidation('Moment delivered'),
        optional: true,
        isString: {
            errorMessage: "Moment delivered must be a valid string",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment delivered must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
    },
};



export const UpdateLockerValidation = {
    BookingID:{
        ...notEmptyValidation('Booking id'),
        optional: false,
        isInt: {
            errorMessage: "Booking id moet een integer zijn",
        },
        toInt: true,
    },
    MomentDelivered: {
        ...notEmptyValidation('Moment delivered'),
        optional: false,
        isString: {
            errorMessage: "Moment delivered must be a valid string",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment delivered must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
    },
};


export const UpdateLockerpatchValidation = {
    LockerID: {
        optional: true,
        isInt:{
            errorMessage: "Locker ID moet een nummer zijn",
        },
        ...notEmptyValidation('Locker id '),
        trim: true,
        toInt: true,
    },
    MomentDelivered: {
        ...notEmptyValidation('Moment delivered'),
        optional: true,
        isString: {
            errorMessage: "Moment delivered must be a valid string",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment delivered must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
    },
};


export const createorderdProductValidation = {
    ProductID:{
        optional: false,
        isInt:{
            errorMessage: "Product ID moet een nummer zijn",
        },
        ...notEmptyValidation('Product id '),
        trim: true,
        toInt: true,
    },
    OrderID: {
        optional: false,
        isInt:{
            errorMessage: "Order ID moet een nummer zijn",
        },
        ...notEmptyValidation('Order id '),
        trim: true,
        toInt: true,
    },
    Amount:{
        optional: false,
        isInt:{
            errorMessage: "Amount moet een nummer zijn",
        },
        ...notEmptyValidation('Amount id '),
        trim: true,
        toInt: true,
    },
};


export const updateorderdProductValidation = {
    ProductID:{
        optional: true,
        isInt:{
            errorMessage: "Product ID moet een nummer zijn",
        },
        ...notEmptyValidation('Product id '),
        trim: true,
        toInt: true,
    },
    OrderID: {
        optional: true,
        isInt:{
            errorMessage: "Order ID moet een nummer zijn",
        },
        ...notEmptyValidation('Order id '),
        trim: true,
        toInt: true,
    },
    Amount:{
        optional: true,
        isInt:{
            errorMessage: "Amount moet een nummer zijn",
        },
        ...notEmptyValidation('Amount id '),
        trim: true,
        toInt: true,
    },
};


export const createOrderValidation = {
    BookingID:{
        ...notEmptyValidation('Booking id'),
        optional: false,
        isInt: {
            errorMessage: "Booking id moet een integer zijn",
        },
        toInt: true,
    },
    LockerID: {
        optional: false,
        isInt:{
            errorMessage: "Locker ID moet een nummer zijn",
        },
        ...notEmptyValidation('Locker id '),
        trim: true,
        toInt: true,
    },
    Price: {
        optional: false, // Verplicht veld
        isInt: {
            options: { min: 0 },
            errorMessage: "Prijs moet een positief geheel getal zijn",
        },
        trim: true,
        toInt: true,
    },
    MomentCreated: {
        ...notEmptyValidation('Moment created'),
        optional: false,
        isString: {
            errorMessage: "Moment created must be a valid string",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment created must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
    },
    MomentDelivered: {
        ...notEmptyValidation('Moment delivered'),
        optional: true,
        isString: {
            errorMessage: "Moment delivered must be a valid string",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment delivered must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
    },
    MomentGathered: {
        ...notEmptyValidation('Moment gathered'),
        optional: true,
        isString: {
            errorMessage: "Moment gathered must be a valid string",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment gathered must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
    },
};

export const patchOrdersValidation = {
    BookingID:{
        ...notEmptyValidation('Booking id'),
        optional: true,
        isInt: {
            errorMessage: "Booking id moet een integer zijn",
        },
        toInt: true,
    },
    LockerID: {
        optional: true,
        isInt:{
            errorMessage: "Locker ID moet een nummer zijn",
        },
        ...notEmptyValidation('Locker id '),
        trim: true,
        toInt: true,
    },
    Price: {
        optional: true, // Verplicht veld
        isInt: {
            options: { min: 0 },
            errorMessage: "Prijs moet een positief geheel getal zijn",
        },
        trim: true,
        toInt: true,
    },
    MomentCreated: {
        ...notEmptyValidation('Moment created'),
        optional: true,
        isString: {
            errorMessage: "Moment created must be a valid string",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment created must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
    },
    MomentDelivered: {
        ...notEmptyValidation('Moment delivered'),
        optional: true,
        isString: {
            errorMessage: "Moment delivered must be a valid string",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment delivered must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
    },
    MomentGathered: {
        ...notEmptyValidation('Moment gathered'),
        optional: true,
        isString: {
            errorMessage: "Moment gathered must be a valid string",
        },
        matches: {
            options: [/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/],
            errorMessage: "Moment gathered must be in MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)",
        },
    },
    
};