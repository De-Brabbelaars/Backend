// validationHelpers.js

// Controleert of een waarde een string is
export const isStringValidation = (field) => ({
    isString: { errorMessage: `${field} must be a string` },
    trim: true,
    escape: true,
});

// Controleert op minimale en maximale lengte
export const isLengthValidation = (min, max, field) => ({
    isLength: {
        options: { min, max },
        errorMessage: `${field} must be between ${min} and ${max} characters`,
    },
});

// Vereist dat een veld niet leeg is
export const notEmptyValidation = (field) => ({
    notEmpty: { errorMessage: `${field} cannot be empty` },
});

// Controleert regex matching
export const matchesValidation = (regex, errorMessage) => ({
    matches: {
        options: regex,
        errorMessage,
    },
});

// Combineert string validatie met andere regels
export const baseStringValidation = (field, min, max, regex, regexMessage) => ({
    ...isStringValidation(field),
    ...isLengthValidation(min, max, field),
    ...notEmptyValidation(field),
    ...matchesValidation(regex, regexMessage),
});


