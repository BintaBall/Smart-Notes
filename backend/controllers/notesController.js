// controllers/notesController.js
const Note = require("../models/Note");
const { extractKeywordsSimple } = require("../nlp/keyword.js");
const { 
  summarizeTextEnhanced, 
  analyzeSentimentEnhanced 
} = require("./nlpController"); // Correction du chemin

// Fonction NLP complète améliorée
async function processNLP(content) {
  try {
    if (!content || typeof content !== 'string') {
      return getEmptyNLP();
    }

    // 1. Résumé amélioré
    const summary = summarizeTextEnhanced(content);
    
    // 2. Mots-clés avec filtrage amélioré
    const rawKeywords = extractKeywordsSimple(content);
    const keywords = rawKeywords.slice(0, 8);
    
    // 3. Sentiment avec sentiment-fr
    const sentimentResult = analyzeSentimentEnhanced(content);
    
    // Journaliser pour déboguer
    console.log("📊 NLP Généré:", {
      summaryLength: summary.length,
      keywordsCount: keywords.length,
      sentiment: sentimentResult.label,
      rawScore: sentimentResult.rawScore,
      score: sentimentResult.score
    });
    
    return {
      summary: summary || "Résumé non généré",
      keywords: keywords || [],
      sentiment: {
        label: sentimentResult.label,
        score: sentimentResult.score,
        comparative: sentimentResult.comparative || 0,
        rawScore: sentimentResult.rawScore || 0,
        positive: sentimentResult.positive || [],
        negative: sentimentResult.negative || []
      }
    };
  } catch (error) {
    console.error("❌ Erreur dans processNLP:", error);
    return getEmptyNLP();
  }
}

function getEmptyNLP() {
  return {
    summary: "",
    keywords: [],
    sentiment: { 
      label: "neutral", 
      score: 0.5, 
      comparative: 0,
      rawScore: 0,
      positive: [],
      negative: []
    }
  };
}

// CREATE avec NLP amélioré
const createNote = async (req, res) => {
  try {
    const { title, content, summary = '', keywords = [], sentiment = {} } = req.body;
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({ 
        error: "Le titre et le contenu sont requis" 
      });
    }
    
    // Générer le NLP automatiquement
    const nlpData = await processNLP(content);
    
    const note = new Note({
      title,
      content,
      summary: summary || nlpData.summary, // Utiliser celui fourni ou généré
      keywords: keywords.length > 0 ? keywords : nlpData.keywords,
      sentiment: Object.keys(sentiment).length > 0 ? sentiment : nlpData.sentiment,
      user: req.userId || "guest" // Valeur par défaut si pas d'authentification
    });
    
    await note.save();
    
    return res.status(201).json({
      success: true,
      data: note,
      message: "Note créée avec succès"
    });
    
  } catch (error) {
    console.error("Erreur création note:", error);
    return res.status(500).json({ 
      error: "Erreur serveur",
      details: error.message 
    });
  }
};

// GET ALL - Ajoute un paramètre pour voir l'état NLP
const getNotes = async (req, res) => {
  try {
    const { nlpStatus, search } = req.query;
    let query = {};
    
    // Recherche par texte
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filtrer par état NLP si demandé
    if (nlpStatus === 'incomplete') {
      query.$or = [
        { summary: { $in: ["", null] } },
        { summary: "Résumé non généré" },
        { keywords: { $exists: false } },
        { keywords: { $size: 0 } },
        { "sentiment.label": { $in: ["", null] } }
      ];
    } else if (nlpStatus === 'complete') {
      query = {
        summary: { $ne: "", $ne: null, $ne: "Résumé non généré" },
        keywords: { $exists: true, $ne: [] },
        "sentiment.label": { $ne: "", $ne: null }
      };
    }
    
    const notes = await Note.find(query).sort({ updatedAt: -1 });
    
    // Ajouter des statistiques
    const stats = {
      total: notes.length,
      withNLP: notes.filter(n => n.summary && n.summary !== "Résumé non généré").length,
      withoutNLP: notes.filter(n => !n.summary || n.summary === "Résumé non généré").length
    };
    
    return res.json({ notes, stats });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET BY ID
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note non trouvée" });

    return res.json(note);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// UPDATE (version unique et corrigée)
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, keywords, sentiment, forceNLP = false } = req.body;
    
    const note = await Note.findById(id);
    
    if (!note) {
      return res.status(404).json({ error: "Note non trouvée" });
    }
    
    const contentChanged = content && content !== note.content;
    const updateData = { updatedAt: Date.now() };
    
    // Mettre à jour les champs de base
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (sentiment !== undefined) updateData.sentiment = sentiment;
    
    // Regénérer le NLP si nécessaire
    if (contentChanged || forceNLP) {
      const nlpContent = content || note.content;
      const nlpData = await processNLP(nlpContent);
      
      updateData.summary = nlpData.summary;
      updateData.keywords = nlpData.keywords;
      updateData.sentiment = nlpData.sentiment;
    }
    
    // Appliquer la mise à jour
    const updatedNote = await Note.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    return res.json({
      success: true,
      data: updatedNote,
      message: "Note mise à jour"
    });
    
  } catch (error) {
    console.error("Erreur mise à jour note:", error);
    return res.status(500).json({ 
      error: "Erreur serveur",
      details: error.message 
    });
  }
};

// DELETE
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: "Note non trouvée" });

    return res.json({ 
      success: true,
      message: "Note supprimée",
      noteId: req.params.id 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// NOUVEAU : Traiter une note spécifique
const processNoteNLP = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: "Note non trouvée" });
    }

    console.log(`Traitement NLP pour la note: "${note.title}"`);
    
    const nlpData = await processNLP(note.content);
    
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      {
        summary: nlpData.summary,
        keywords: nlpData.keywords,
        sentiment: nlpData.sentiment,
        updatedAt: Date.now()
      },
      { new: true }
    );

    console.log("NLP généré:", {
      summaryLength: nlpData.summary.length,
      keywords: nlpData.keywords.length,
      sentiment: nlpData.sentiment.label
    });

    return res.json({
      message: "NLP appliqué avec succès",
      note: updatedNote
    });

  } catch (err) {
    console.error("Erreur dans processNoteNLP:", err);
    return res.status(500).json({ 
      error: err.message,
      noteId: req.params.id
    });
  }
};

// NOUVEAU : Traiter TOUTES les notes existantes
const processAllNotesNLP = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log("Début du traitement NLP pour toutes les notes...");
    
    // Récupérer TOUTES les notes
    const notes = await Note.find({});
    
    if (notes.length === 0) {
      return res.json({ 
        message: "Aucune note à traiter",
        processed: 0,
        total: 0
      });
    }

    let processedCount = 0;
    let successCount = 0;
    let errors = [];

    console.log(`Traitement de ${notes.length} notes...`);

    // Traiter chaque note
    for (const note of notes) {
      processedCount++;
      
      try {
        // Générer le NLP pour cette note
        const nlpData = await processNLP(note.content);
        
        // Mettre à jour la note
        await Note.findByIdAndUpdate(note._id, {
          summary: nlpData.summary,
          keywords: nlpData.keywords,
          sentiment: nlpData.sentiment,
          updatedAt: Date.now()
        });
        
        successCount++;
        
        // Log tous les 10 traitements
        if (processedCount % 10 === 0) {
          console.log(`Progression: ${processedCount}/${notes.length} notes traitées`);
        }
        
      } catch (error) {
        errors.push({
          noteId: note._id,
          title: note.title,
          error: error.message
        });
        console.error(`Erreur pour la note "${note.title}":`, error.message);
      }
    }

    const duration = Date.now() - startTime;
    
    const result = {
      message: "Traitement NLP terminé",
      total: notes.length,
      processed: processedCount,
      success: successCount,
      failed: errors.length,
      duration: `${duration}ms (${Math.round(duration/1000)}s)`
    };

    if (errors.length > 0) {
      result.errors = errors.slice(0, 10);
      if (errors.length > 10) {
        result.errorMessage = `... et ${errors.length - 10} erreurs supplémentaires`;
      }
    }

    console.log("Résultat du traitement:", result);
    return res.json(result);

  } catch (err) {
    console.error("Erreur dans processAllNotesNLP:", err);
    return res.status(500).json({ 
      error: "Erreur lors du traitement global",
      message: err.message 
    });
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  processAllNotesNLP,
  processNoteNLP,
  processNLP
};