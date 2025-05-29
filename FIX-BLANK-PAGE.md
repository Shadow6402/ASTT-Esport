# Correction du problème de page blanche

Si vous rencontrez une page blanche lors de l'accès à l'application déployée, suivez ces étapes :

## 1. Vérifier la configuration du serveur

Assurez-vous que le fichier `backend/server.js` contient bien les lignes suivantes pour servir correctement l'application React :

```javascript
// Servir les fichiers statiques du build React en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Toutes les requêtes non-API renvoient vers index.html
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}
```

## 2. Vérifier l'ordre des routes

Assurez-vous que les routes API sont définies AVANT le middleware qui sert les fichiers statiques.

## 3. Vérifier les chemins relatifs

Si vous déployez dans un sous-répertoire, assurez-vous que le fichier `frontend/build/index.html` utilise des chemins relatifs (commençant par `./` ou sans `/`) pour les ressources JavaScript et CSS.

## 4. Vérifier les logs de l'application

Consultez les logs de l'application sur Render pour identifier d'éventuelles erreurs.

## 5. Redémarrer le service

Parfois, un simple redémarrage du service sur Render peut résoudre le problème.
