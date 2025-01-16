// swaggerConfig.mjs

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Express API',
            version: '1.0.0',
            description: 'Een voorbeeld API met Express en Swagger',
        },
        servers: [
            {
                url: 'http://localhost:8080', // Pas dit aan naar je serveradres
                description: 'Development server',
            },
        ],
    },
    apis: ['./src/routes/*.mjs'], // Zorg ervoor dat dit pad correct is
};

// Maak de Swagger-specificatie
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Exporteer de middleware zodat deze kan worden gebruikt in je server
export const swaggerDocs = (app) => {
    // Stel de swagger-ui in op '/api-docs'
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        swaggerOptions: {
            requestInterceptor: (req) => {
                req.headers['Content-Type'] = 'application/json';
                return req;
            }
        }
    }));
};
