# Application de Gestion des Membres E-sport VR - ASTT (Version actualisée)

Cette application web permet de gérer les adhérents de la section E-sport VR de l'ASTT, avec gestion des adhésions et distribution des codes d'accès.

## Prérequis

- Node.js (v14+)
- MongoDB
- npm ou yarn

## Installation locale

1. Clonez ce dépôt
2. Exécutez le script de démarrage automatique :
   ```
   ./start.sh
   ```
   
   Ce script va :
   - Vérifier si MongoDB est installé et l'installer si nécessaire
   - Installer toutes les dépendances
   - Démarrer l'application en mode développement

## Installation manuelle

1. Installez les dépendances :
   ```
   npm run install-all
   ```

2. Configurez les variables d'environnement :
   - Renommez `.env.example` en `.env` dans le dossier backend
   - Modifiez les valeurs selon votre environnement

3. Démarrez l'application :
   ```
   npm run dev
   ```

## Déploiement en production

### Option 1 : Heroku

1. Créez un compte sur [Heroku](https://heroku.com)
2. Installez [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Connectez-vous à Heroku :
   ```
   heroku login
   ```
4. Créez une nouvelle application :
   ```
   heroku create astt-esport-vr
   ```
5. Ajoutez l'add-on MongoDB :
   ```
   heroku addons:create mongodb:sandbox
   ```
6. Configurez les variables d'environnement :
   ```
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=votre_secret_jwt
   heroku config:set EMAIL_HOST=smtp.votreservice.com
   heroku config:set EMAIL_PORT=587
   heroku config:set EMAIL_USER=votre_email
   heroku config:set EMAIL_PASSWORD=votre_mot_de_passe
   ```
7. Déployez l'application :
   ```
   git push heroku main
   ```

### Option 2 : Vercel/Netlify + MongoDB Atlas

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster et obtenez l'URI de connexion
3. Créez un compte sur [Vercel](https://vercel.com) ou [Netlify](https://netlify.com)
4. Importez votre projet depuis GitHub
5. Configurez les variables d'environnement avec l'URI MongoDB et autres paramètres
6. Déployez l'application

## Fonctionnalités

- Gestion des utilisateurs (inscription, connexion, profils)
- Gestion des adhésions avec notifications d'expiration
- Importation et attribution des codes d'accès
- Tableau de bord administrateur avec statistiques
- Envoi automatique d'emails

## Structure du projet

- `/backend` : API Node.js/Express
- `/frontend` : Interface React
- `/docs` : Documentation

## Mises à jour dans cette version

- Interface utilisateur améliorée avec le logo ASTT E-sport VR
- Charte graphique noir et orange optimisée
- Navigation simplifiée et intuitive
- Corrections de bugs et améliorations de performance

## Support

Pour toute question ou assistance, contactez l'équipe de développement.
