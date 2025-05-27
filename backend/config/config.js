// Configuration pour la production
module.exports = {
  // Serveur
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'production',
  
  // Base de données
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/esport-vr-app',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'esport-vr-secret-key',
  jwtExpire: process.env.JWT_EXPIRE || '24h',
  
  // Email
  emailHost: process.env.EMAIL_HOST || 'smtp.example.com',
  emailPort: process.env.EMAIL_PORT || 587,
  emailSecure: process.env.EMAIL_SECURE === 'true',
  emailUser: process.env.EMAIL_USER || 'noreply@astt-esport-vr.com',
  emailPassword: process.env.EMAIL_PASSWORD || 'password',
  
  // Frontend
  frontendURL: process.env.FRONTEND_URL || 'https://astt-esport-vr.com',
  
  // Limites
  maxCodesPerUser: process.env.MAX_CODES_PER_USER || 5,
  
  // Délais
  expirationNotificationDays: process.env.EXPIRATION_NOTIFICATION_DAYS || 30,
  passwordResetExpire: process.env.PASSWORD_RESET_EXPIRE || '1h'
};
