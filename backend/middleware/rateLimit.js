// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// Fonction pour ignorer certaines méthodes ou chemins
const skipRateLimit = (req) => {
  // Ignorer les requêtes GET (lecture seule)
  if (req.method === 'GET') {
    return true;
  }
  
  // Ignorer certaines routes spécifiques
  const ignoredPaths = ['/api/notes/public', '/api/notes/search'];
  if (ignoredPaths.some(path => req.path.startsWith(path))) {
    return true;
  }
  
  return false;
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Trop de requêtes. Veuillez patienter."
  },
  skip: skipRateLimit // Appliquer conditionnellement
});

const nlpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Limite NLP/AI atteinte."
  }
});

const notesWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Trop de modifications de notes."
  },
  // Seulement pour les méthodes d'écriture
  skip: (req) => req.method === 'GET'
});

module.exports = {
  apiLimiter,
  nlpLimiter,
  notesWriteLimiter
};