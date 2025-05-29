# Instructions de déploiement pour ASTT E-sport VR

## Prérequis
- Node.js 16+ installé
- MongoDB (local ou Atlas)
- Compte Render pour le déploiement

## Configuration locale
1. Extraire l'archive dans un répertoire
2. Configurer les variables d'environnement dans le fichier `backend/.env`
3. Installer les dépendances :
   ```
   cd backend
   npm install
   ```
4. Démarrer l'application :
   ```
   node server.js
   ```

## Déploiement sur Render
1. Créer un nouveau Web Service sur Render
2. Connecter votre dépôt GitHub ou téléverser les fichiers
3. Configurer le service :
   - **Build Command** : `cd backend && npm install`
   - **Start Command** : `node backend/server.js`
4. Configurer les variables d'environnement dans les paramètres du service
5. Déployer le service

## Variables d'environnement requises
- `NODE_ENV` : production
- `PORT` : 5000 (ou le port attribué par Render)
- `MONGODB_URI` : URI de connexion à MongoDB
- `JWT_SECRET` : Clé secrète pour les tokens JWT
- `EMAIL_SERVICE` : Service d'email (gmail, sendgrid, etc.)
- `EMAIL_USER` : Adresse email pour l'envoi des notifications
- `EMAIL_PASSWORD` : Mot de passe ou clé d'application pour l'email
- `FRONTEND_URL` : URL du frontend (pour les liens dans les emails)

## Support
Pour toute assistance, contactez l'équipe de développement.
