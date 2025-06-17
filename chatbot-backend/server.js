// const router = require("./Routes/index");
// const express = require("express");
// const cors = require("cors");
// const app = express();
// const cookieParser = require('cookie-parser')
// const mongoose = require("mongoose");
// require('dotenv').config();



// // Connecter à MongoDB
// const uri = process.env.MONGODB_URI;

// // Connection to the database
// mongoose
//     .connect(uri)
//     .then(() => {
//         console.log('Connected to database');
//     })
//     .catch((error) => {
//         console.log('Error connecting to database: ', error);
//     });

// // middleware to parse incoming requests

// // middleware to parse cookies
// app.use(express.json({ limit: '50mb' })); // Parse JSON bodies
// app.use(express.urlencoded({ limit: '50mb', extended: true }));

// // Pour les données en formulaire
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// // middleware to connect with frontend
// app.use(cors({
//     origin: ["https://crm-sales-self.vercel.app", "https://solar-simulator-eta.vercel.app", "http://localhost:5174"],
//     credentials: true,
// }));

// // middleware to load routes
// app.use('/', router);

// const PORT = process.env.API_PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Serveur démarré sur le port ${PORT}`);
// });

// module.exports = app;


const router = require("./Routes/index");
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
require('dotenv').config();
const migrateExistingClients = require('./utils/migrationRunner');

const uri = process.env.MONGODB_URI;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration
app.use(cors({
  origin: [
    "https://crm-sales-self.vercel.app",
    "globalgreen.vercel.app", 
    "https://solar-simulator-eta.vercel.app", 
    "http://localhost:5174"
  ],
  credentials: true,
}));

// Routes
app.use('/', router);

// Connect to MongoDB and start server
mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Run migration on startup
    migrateExistingClients().catch(err => {
      console.error('Migration error:', err);
    });
    
    // Start server - ONLY ONCE
    const PORT = process.env.API_PORT || 4000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

module.exports = app;