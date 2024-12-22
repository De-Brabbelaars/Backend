// Import statements
import express from 'express';
import routes from './routes/index.mjs';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { MockUsers } from './utils/constants.mjs';
import passport from 'passport';
import './strategies/local-strategies.mjs';
import { swaggerDocs } from './swaggerConfig.mjs'; // Zorg ervoor dat het pad klopt
import cors from 'cors'; // Vergeet niet om cors te importeren
import { corsOptions } from './utils/middelwares.mjs';

// Maak een nieuwe Express-applicatie genaamd app
const app = express();


// Gebruik express.json voor body parsing
app.use(cors(corsOptions)); // Pas CORS toe met de opties
app.use(express.json());
app.use(cookieParser());


// Configureer Swagger (enkele keer aanroepen)
swaggerDocs(app);

// Stel session in
app.use(session({
    secret: 'jurgen the dev',
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 60000 * 60 },
}));


  
  
  // Gebruik routes
  app.use(routes);
  
  // Gebruik Passport voor authenticatie
  app.use(passport.initialize());
  app.use(passport.session());
  
  
  // Auth route - login
  app.post('/api/auth', (request, response) => {
      const { username, password } = request.body;
      const finduser = MockUsers.find(user => user.username === username);
      
      if (!finduser || finduser.password !== password) {
          return response.status(401).send({ msg: 'Bad credentials' });
        }
        
        // Stel de gebruiker in de session in
        request.session.user = finduser;
        return response.status(200).send(finduser);
    });
    
    // Auth status route
    app.get('/api/auth/status', (request, response) => {
        if (request.session.user) {
            return response.send(request.session.user);
        } else {
            return response.sendStatus(401); // Niet geauthenticeerd
        }
    });
    
    // Logout route
    app.post('/api/auth/logout', (request, response) => {
        if (!request.session.user) {
            return response.sendStatus(401); // Niet ingelogd
        }
        
        request.session.destroy((err) => {
            if (err) return response.status(400).send({ msg: 'Logout failed' });
            return response.sendStatus(200); // Succesvol uitgelogd
        });
    });
    
    // Winkelwagen route - item toevoegen
    app.post('/api/cart', (request, response) => {
        if (!request.session.user) return response.sendStatus(401); // Niet geauthenticeerd
        
        const { item } = request.body;
        const cart = request.session.cart || [];
        cart.push(item);
        request.session.cart = cart;
        
        return response.status(201).send(item);
    });
    
    // Winkelwagen route - items ophalen
    app.get('/api/cart', (request, response) => {
        if (!request.session.user) return response.sendStatus(401); // Niet geauthenticeerd
        return response.send(request.session.cart || []);
    });
    
    // Voorbeeld route - cijfercontrole
    app.post('/api/cijfer', (request, response) => {
        const { hallo } = request.body;
        const cijfer = 2;
        
        if (parseInt(hallo, 10) !== cijfer) {
            return response.status(400).send({ msg: 'Getal komt niet overeen' });
        }
        
        return response.status(200).send({ msg: 'Getal komt overeen' });
    });

// Stel de poort in waarop de server draait
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
