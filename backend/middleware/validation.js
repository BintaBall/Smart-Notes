const Joi = require('joi');

// Schéma de validation pour une note
const noteSchema = Joi.object({
  title: Joi.string().min(1).max(200).required()
    .messages({
      'string.empty': 'Le titre est obligatoire',
      'string.max': 'Le titre ne doit pas dépasser 200 caractères',
      'any.required': 'Le titre est requis'
    }),
    
  content: Joi.string().min(1).max(10000).required()
    .messages({
      'string.empty': 'Le contenu est obligatoire',
      'string.max': 'Le contenu ne doit pas dépasser 10000 caractères',
      'any.required': 'Le contenu est requis'
    }),
    
  summary: Joi.string().allow('').max(500).optional(),
  
  sentiment: Joi.object({
    label: Joi.string().valid('positive', 'negative', 'neutral', ''),
    score: Joi.number().min(0).max(1)
  }).optional()
});

// Schéma de validation pour les requêtes NLP
const nlpSchema = Joi.object({
  text: Joi.string().min(1).max(5000).required()
    .messages({
      'string.empty': 'Le texte est requis pour l\'analyse',
      'string.max': 'Le texte ne doit pas dépasser 5000 caractères'
    })
});

// Middleware de validation pour les notes
const validateNote = (req, res, next) => {
  const { error, value } = noteSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true // 🔥 enlève les champs non définis
  });

  if (error) {
    console.error("❌ Validation error:", error.details);

    return res.status(400).json({
      error: 'Validation échouée',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      }))
    });
  }

  req.body = value; // 🔥 body nettoyé
  next();
};


// Middleware de validation pour les requêtes NLP
const validateNLPText = (req, res, next) => {
  const { error } = nlpSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({ 
      error: 'Validation échouée',
      details: errors 
    });
  }
  
  next();
};

const validateNoteUpdate = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
  }
  next();
};


module.exports = {
  validateNote,
  validateNLPText,
  validateNoteUpdate,
  noteSchema,
  nlpSchema
};