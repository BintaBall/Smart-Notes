require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 4000;

const notes = require('./routes/notes');
const nlp = require('./routes/nlp');
const aiRoutes = require('./routes/ai');
const connectDB = require('./conf/db');

const { apiLimiter, nlpLimiter, notesWriteLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

connectDB();

app.use(express.json());
app.use(cors());

// Rate limiting global (sauf pour la route d'accueil)
app.use(apiLimiter);
app.get('/', (req, res) => {
    res.status(200).send('<h1>Bienvenue sur Smart Notes !</h1>');
});

// Routes avec rate limiting spécifique
app.use("/api/notes", notes);
app.use("/api/nlp", nlp);
app.use("/api/ai", aiRoutes);

// Middleware pour les routes non trouvées
app.use(notFound);

// Middleware global de gestion d'erreurs
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});