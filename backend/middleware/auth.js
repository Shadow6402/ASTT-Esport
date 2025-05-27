const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Récupérer le token du header
  const token = req.header('x-auth-token');

  // Vérifier si le token existe
  if (!token) {
    return res.status(401).json({ msg: 'Pas de token, autorisation refusée' });
  }

  // Vérifier le token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajouter l'utilisateur à la requête
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token non valide' });
  }
};
