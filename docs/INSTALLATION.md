# Guide d'installation détaillé (Version actualisée)

Ce document fournit des instructions détaillées pour l'installation et le déploiement de l'application de gestion des membres E-sport VR.

## Installation locale pour développement

### Prérequis

- Node.js (v14+)
- MongoDB (v4+)
- npm (v6+) ou yarn (v1.22+)
- Git

### Étapes d'installation

1. Clonez le dépôt :
   ```
   git clone <url-du-depot>
   cd esport-vr-app
   ```

2. Installation automatique :
   ```
   ./start.sh
   ```
   
   Ce script automatise l'ensemble du processus d'installation.

3. Installation manuelle (alternative) :
   
   a. Installez les dépendances :
   ```
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```
   
   b. Configurez les variables d'environnement :
   ```
   cp backend/.env.example backend/.env
   ```
   
   c. Démarrez MongoDB :
   ```
   # Sur Linux
   sudo service mongodb start
   
   # Sur macOS avec Homebrew
   brew services start mongodb-community
   ```
   
   d. Démarrez l'application en mode développement :
   ```
   npm run dev
   ```

4. Accédez à l'application :
   - Backend API : http://localhost:5000
   - Frontend : http://localhost:3000

## Déploiement en production

### Option 1 : Serveur dédié/VPS

1. Prérequis serveur :
   - Ubuntu 20.04 LTS ou plus récent
   - Node.js (v14+)
   - MongoDB (v4+)
   - Nginx
   - Certificat SSL (Let's Encrypt recommandé)

2. Installation des dépendances système :
   ```
   sudo apt update
   sudo apt install -y nodejs npm mongodb nginx certbot python3-certbot-nginx
   ```

3. Clonez le dépôt dans `/var/www/esport-vr-app`

4. Installez les dépendances :
   ```
   cd /var/www/esport-vr-app
   npm run install-all
   ```

5. Configurez les variables d'environnement :
   ```
   cp backend/.env.example backend/.env
   nano backend/.env
   ```

6. Construisez le frontend :
   ```
   cd frontend
   npm run build
   ```

7. Configurez Nginx :
   ```
   sudo nano /etc/nginx/sites-available/esport-vr-app
   ```
   
   Contenu du fichier :
   ```
   server {
       listen 80;
       server_name votre-domaine.com;
       
       location / {
           root /var/www/esport-vr-app/frontend/build;
           try_files $uri /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. Activez le site et obtenez un certificat SSL :
   ```
   sudo ln -s /etc/nginx/sites-available/esport-vr-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d votre-domaine.com
   ```

9. Configurez un service systemd pour le backend :
   ```
   sudo nano /etc/systemd/system/esport-vr-app.service
   ```
   
   Contenu du fichier :
   ```
   [Unit]
   Description=ASTT E-sport VR Application
   After=network.target mongodb.service
   
   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/esport-vr-app/backend
   ExecStart=/usr/bin/npm start
   Restart=on-failure
   Environment=NODE_ENV=production
   
   [Install]
   WantedBy=multi-user.target
   ```

10. Activez et démarrez le service :
    ```
    sudo systemctl enable esport-vr-app
    sudo systemctl start esport-vr-app
    ```

### Option 2 : Heroku

Suivez les instructions dans le README.md principal.

### Option 3 : Docker

1. Créez un fichier `docker-compose.yml` à la racine du projet :
   ```yaml
   version: '3'
   
   services:
     mongodb:
       image: mongo:latest
       container_name: mongodb
       restart: always
       volumes:
         - mongo-data:/data/db
       ports:
         - "27017:27017"
       networks:
         - app-network
   
     backend:
       build:
         context: ./backend
       container_name: backend
       restart: always
       env_file:
         - ./backend/.env
       ports:
         - "5000:5000"
       depends_on:
         - mongodb
       networks:
         - app-network
   
     frontend:
       build:
         context: ./frontend
       container_name: frontend
       restart: always
       ports:
         - "80:80"
       depends_on:
         - backend
       networks:
         - app-network
   
   networks:
     app-network:
       driver: bridge
   
   volumes:
     mongo-data:
       driver: local
   ```

2. Créez un fichier `Dockerfile` dans le dossier backend :
   ```Dockerfile
   FROM node:14
   
   WORKDIR /usr/src/app
   
   COPY package*.json ./
   
   RUN npm install
   
   COPY . .
   
   EXPOSE 5000
   
   CMD ["npm", "start"]
   ```

3. Créez un fichier `Dockerfile` dans le dossier frontend :
   ```Dockerfile
   FROM node:14 as build
   
   WORKDIR /usr/src/app
   
   COPY package*.json ./
   
   RUN npm install
   
   COPY . .
   
   RUN npm run build
   
   FROM nginx:alpine
   
   COPY --from=build /usr/src/app/build /usr/share/nginx/html
   
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   
   EXPOSE 80
   
   CMD ["nginx", "-g", "daemon off;"]
   ```

4. Créez un fichier `nginx.conf` dans le dossier frontend :
   ```
   server {
       listen 80;
       
       location / {
           root /usr/share/nginx/html;
           index index.html index.htm;
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://backend:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. Déployez avec Docker Compose :
   ```
   docker-compose up -d
   ```

## Maintenance

### Sauvegardes

1. Sauvegarde de la base de données :
   ```
   mongodump --out=/chemin/vers/backup/$(date +%Y-%m-%d)
   ```

2. Restauration de la base de données :
   ```
   mongorestore /chemin/vers/backup/date-de-sauvegarde
   ```

### Mises à jour

1. Tirez les dernières modifications :
   ```
   git pull origin main
   ```

2. Installez les dépendances :
   ```
   npm run install-all
   ```

3. Reconstruisez le frontend :
   ```
   cd frontend && npm run build
   ```

4. Redémarrez les services :
   ```
   # Si utilisation de systemd
   sudo systemctl restart esport-vr-app
   
   # Si utilisation de Docker
   docker-compose down
   docker-compose up -d
   ```

## Résolution des problèmes courants

### Problème : L'application ne démarre pas

Vérifiez les logs :
```
# Pour le backend
tail -f /var/log/syslog | grep esport-vr-app

# Pour MongoDB
tail -f /var/log/mongodb/mongodb.log
```

### Problème : Les images ne s'affichent pas

Vérifiez que les chemins d'accès aux images sont corrects dans le code et que les fichiers existent dans le dossier public.

### Problème : Erreurs de connexion à la base de données

Vérifiez que MongoDB est en cours d'exécution et que l'URI de connexion dans le fichier .env est correct.
