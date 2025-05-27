#!/bin/bash

# Script de démarrage pour l'application E-sport VR ASTT (Version actualisée)
echo "Démarrage de l'application E-sport VR ASTT..."

# Vérifier si MongoDB est installé
if ! command -v mongod &> /dev/null; then
    echo "MongoDB n'est pas installé. Installation en cours..."
    echo "Cette étape peut prendre quelques minutes..."
    
    # Installation de MongoDB selon le système d'exploitation
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y mongodb
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew tap mongodb/brew
            brew install mongodb-community
        else
            echo "Homebrew n'est pas installé. Veuillez installer MongoDB manuellement."
            exit 1
        fi
    else
        echo "Système d'exploitation non pris en charge pour l'installation automatique de MongoDB."
        echo "Veuillez installer MongoDB manuellement: https://www.mongodb.com/try/download/community"
        exit 1
    fi
fi

# Démarrer MongoDB s'il n'est pas déjà en cours d'exécution
if ! pgrep -x "mongod" > /dev/null; then
    echo "Démarrage de MongoDB..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo service mongodb start
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start mongodb-community
    fi
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "Installation des dépendances..."
    npm install
    
    echo "Installation des dépendances backend..."
    cd backend && npm install && cd ..
    
    echo "Installation des dépendances frontend..."
    cd frontend && npm install && cd ..
    
    # Copier le logo dans le dossier public
    echo "Configuration des ressources..."
    mkdir -p frontend/public/images
    cp logo.png frontend/public/logo.png
    cp logo.png frontend/public/images/logo.png
fi

# Vérifier si le fichier .env existe dans le backend
if [ ! -f "backend/.env" ]; then
    echo "Création du fichier .env pour le backend..."
    cp backend/.env.example backend/.env 2>/dev/null || echo "PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/esport-vr-app
JWT_SECRET=esport-vr-secret-key-dev
JWT_EXPIRE=24h
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@astt-esport-vr.com
EMAIL_PASSWORD=password
FRONTEND_URL=http://localhost:3000
MAX_CODES_PER_USER=5
EXPIRATION_NOTIFICATION_DAYS=30
PASSWORD_RESET_EXPIRE=1h" > backend/.env
fi

# Démarrer l'application en mode développement
echo "Démarrage de l'application en mode développement..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter l'application"
echo ""

# Démarrer le backend et le frontend en parallèle
if command -v npx &> /dev/null; then
    npx concurrently "cd backend && npm start" "cd frontend && npm start"
else
    echo "npx n'est pas disponible. Installation de concurrently..."
    npm install -g concurrently
    concurrently "cd backend && npm start" "cd frontend && npm start"
fi
