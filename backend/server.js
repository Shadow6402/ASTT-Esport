const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Configuration des variables d'environnement
dotenv.config();

// Initialisation de l'application Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion à la base de données MongoDB
// En mode développement ou test, on peut désactiver la connexion MongoDB
if (process.env.NODE_ENV === 'production' && process.env.SKIP_MONGODB !== 'true') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connexion à MongoDB établie avec succès'))
    .catch(err => console.error('Erreur de connexion à MongoDB:', err));
} else {
  console.log('Mode sans base de données activé');
}

// Routes API
// app.use('/api/users', require('./routes/users'));
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/codes', require('./routes/codes'));
// app.use('/api/memberships', require('./routes/memberships'));

// Servir les fichiers statiques du build React en production
if (process.env.NODE_ENV === 'production') {
  // Définir le dossier des fichiers statiques
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // Pour toutes les routes non-API, servir index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  // Route par défaut en développement
  app.get('/', (req, res) => {
    res.send('API de l\'application E-sport VR est en ligne');
  });
}

// Définition du port
const PORT = process.env.PORT || 3000;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
