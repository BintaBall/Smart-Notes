// Middleware pour les routes non trouvées
const notFound = (req, res, next) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
};

// Middleware global de gestion d'erreurs
const errorHandler = (err, req, res, next) => {
  console.error('Erreur:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Erreurs Mongoose
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      error: 'ID invalide',
      message: 'L\'ID fourni n\'est pas valide'
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    
    return res.status(400).json({ 
      error: 'Erreur de validation',
      details: errors 
    });
  }

  if (err.code === 11000) { // Duplicate key
    return res.status(409).json({ 
      error: 'Duplication',
      message: 'Cette ressource existe déjà'
    });
  }

  // Erreur par défaut
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Une erreur est survenue sur le serveur';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFound,
  errorHandler
};