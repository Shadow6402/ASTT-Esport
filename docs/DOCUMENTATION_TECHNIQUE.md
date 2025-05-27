# Documentation Technique - Application E-sport VR ASTT (Version actualisée)

Cette documentation technique détaille l'architecture et les composants de l'application de gestion des membres E-sport VR.

## Architecture globale

L'application suit une architecture client-serveur avec séparation frontend/backend :

- **Frontend** : Application React avec interface utilisateur responsive
- **Backend** : API RESTful Node.js/Express avec base de données MongoDB
- **Communication** : API JSON via HTTP/HTTPS

## Stack technologique

### Frontend
- React.js
- React Router pour la navigation
- Axios pour les requêtes HTTP
- React Bootstrap pour les composants UI
- Chart.js pour les visualisations
- Formik et Yup pour la validation des formulaires

### Backend
- Node.js
- Express.js comme framework web
- MongoDB comme base de données
- Mongoose pour l'ODM (Object Document Mapping)
- JWT pour l'authentification
- Bcrypt pour le hachage des mots de passe
- Nodemailer pour l'envoi d'emails
- Multer pour la gestion des fichiers

## Structure de la base de données

### Collection User
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  password: String, // Haché avec bcrypt
  role: String, // 'admin', 'moderateur', 'membre'
  status: String, // 'Actif', 'En attente', 'Expiré'
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date,
  twoFactorEnabled: Boolean,
  twoFactorSecret: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  preferences: {
    theme: String,
    fontSize: String,
    notifications: Boolean
  }
}
```

### Collection Membership
```javascript
{
  _id: ObjectId,
  user: ObjectId, // Référence à User
  membershipType: String, // 'Standard', 'Premium', etc.
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  paymentMethod: String,
  paymentAmount: Number,
  paymentStatus: String, // 'Payé', 'En attente', 'Annulé'
  renewalReminder: Boolean, // Si une notification a été envoyée
  createdAt: Date,
  updatedAt: Date,
  notes: String
}
```

### Collection AccessCode
```javascript
{
  _id: ObjectId,
  code: String,
  batch: ObjectId, // Référence à CodeBatch
  assignedTo: ObjectId, // Référence à User
  assignedAt: Date,
  isUsed: Boolean,
  usedAt: Date,
  expiresAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Collection CodeBatch
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  importedBy: ObjectId, // Référence à User
  totalCodes: Number,
  assignedCodes: Number,
  expiryDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/user` - Récupérer l'utilisateur actuel
- `POST /api/auth/forgot-password` - Demande de réinitialisation de mot de passe
- `POST /api/auth/reset-password/:token` - Réinitialisation du mot de passe
- `POST /api/auth/2fa/setup` - Configuration de l'authentification à deux facteurs
- `POST /api/auth/2fa/verify` - Vérification du code 2FA

### Utilisateurs
- `GET /api/users` - Récupérer tous les utilisateurs (admin)
- `GET /api/users/:id` - Récupérer un utilisateur spécifique
- `PUT /api/users/:id` - Mettre à jour un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur
- `PUT /api/users/:id/status` - Mettre à jour le statut d'un utilisateur
- `PUT /api/users/:id/role` - Mettre à jour le rôle d'un utilisateur
- `PUT /api/users/:id/preferences` - Mettre à jour les préférences d'un utilisateur

### Adhésions
- `GET /api/memberships` - Récupérer toutes les adhésions (admin)
- `GET /api/memberships/user/:userId` - Récupérer les adhésions d'un utilisateur
- `GET /api/memberships/active` - Récupérer les adhésions actives
- `GET /api/memberships/expiring` - Récupérer les adhésions qui expirent bientôt
- `GET /api/memberships/:id` - Récupérer une adhésion spécifique
- `POST /api/memberships` - Créer une nouvelle adhésion
- `PUT /api/memberships/:id` - Mettre à jour une adhésion
- `PUT /api/memberships/:id/renew` - Renouveler une adhésion
- `DELETE /api/memberships/:id` - Supprimer une adhésion
- `POST /api/memberships/notify-expiring` - Notifier les adhésions expirantes

### Codes d'accès
- `GET /api/codes` - Récupérer tous les codes (admin)
- `GET /api/codes/batch/:batchId` - Récupérer les codes d'un lot
- `GET /api/codes/user/:userId` - Récupérer les codes d'un utilisateur
- `POST /api/codes/batch` - Créer un nouveau lot de codes
- `POST /api/codes/assign` - Attribuer des codes à un utilisateur
- `PUT /api/codes/:id/mark-used` - Marquer un code comme utilisé
- `DELETE /api/codes/batch/:batchId` - Supprimer un lot de codes

### Tableau de bord
- `GET /api/dashboard/stats` - Récupérer les statistiques du tableau de bord
- `GET /api/dashboard/recent-users` - Récupérer les utilisateurs récents
- `GET /api/dashboard/expiring-memberships` - Récupérer les adhésions qui expirent bientôt

## Sécurité

### Authentification
- Utilisation de JWT (JSON Web Tokens) pour l'authentification
- Stockage sécurisé des mots de passe avec bcrypt
- Support de l'authentification à deux facteurs (2FA)
- Expiration des tokens et rotation

### Autorisation
- Middleware de vérification des rôles
- Contrôle d'accès basé sur les rôles (RBAC)
- Validation des données entrantes

### Protection des données
- Validation des entrées avec express-validator
- Protection contre les injections NoSQL
- Protection CSRF
- Headers de sécurité avec helmet

## Services externes

### Envoi d'emails
- Configuration SMTP via nodemailer
- Templates d'emails avec Handlebars
- Types d'emails :
  - Bienvenue
  - Réinitialisation de mot de passe
  - Notification d'expiration d'adhésion
  - Envoi de codes d'accès

## Tâches planifiées

- Vérification quotidienne des adhésions expirantes
- Envoi automatique de notifications
- Archivage des données expirées

## Tests

- Tests unitaires avec Mocha et Chai
- Tests d'intégration pour les API
- Tests de bout en bout

## Déploiement

Voir le fichier INSTALLATION.md pour les détails de déploiement.

## Maintenance et évolution

### Maintenance
- Sauvegardes régulières de la base de données
- Monitoring des performances
- Logs d'erreurs

### Évolutions possibles
- Intégration de passerelles de paiement
- Système de notifications push
- Application mobile
- Intégration avec d'autres systèmes de l'ASTT

## Mises à jour dans cette version

- Interface utilisateur améliorée avec le logo ASTT E-sport VR
- Optimisation de la charte graphique noir et orange
- Amélioration de la navigation et de l'expérience utilisateur
- Correction de bugs et optimisations de performance
