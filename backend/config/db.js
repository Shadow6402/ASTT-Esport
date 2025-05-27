const mongoose = require('mongoose');
const config = require('../config/config');

const connectDB = async () => {
  try {
    // Utiliser l'URI de MongoDB depuis la configuration
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/esport-vr-app';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connecté...');
    return mongoose.connection;
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    // Quitter le processus en cas d'échec
    process.exit(1);
  }
};

module.exports = connectDB;
