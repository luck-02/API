const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_change_me';
const COOKIE_NAME = 'demo_node+mongo_token';

function getcookie(req) {
  var cookie = req.headers.cookie;
  return cookie.split('; ').reduce((acc, item) => {
      const [k,v] = item.split("=");
      acc[k] = v
      return acc
  }, {})
}

function authMiddleware(req, res, next) {
const cookies = getcookie(req)
const token = cookies[COOKIE_NAME];

  // Vérification de présence et format du token
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return res.status(401).json({ error: 'Token d’authentification manquant ou invalide' });
  }

  // Vérification du token JWT
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Jeton non valide.' });
    }
    return res.status(500).json({ error: 'Erreur d’authentification' });
  }
}

module.exports = authMiddleware;