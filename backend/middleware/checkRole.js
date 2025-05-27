const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'Pas de token, autorisation refusée' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ msg: `Accès refusé, privilèges ${role} requis` });
    }

    next();
  };
};

module.exports = checkRole;
