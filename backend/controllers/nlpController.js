// controllers/nlpController.js
const { extractKeywordsSimple } = require("../nlp/keyword.js");
const SentimentAnalyzer = require("../nlp/sentimentAnalyzer");

const sentimentAnalyzer = new SentimentAnalyzer();

// -------------------- FONCTIONS NLP AMÉLIORÉES --------------------

function summarizeTextEnhanced(text, maxSentences = 3) {
  if (!text || typeof text !== "string") return "";
  
  // Nettoyer le texte
  const cleanText = text.trim();
  
  // Diviser en phrases (meilleure détection)
  const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10);
  
  if (sentences.length === 0) return "";
  if (sentences.length <= maxSentences) {
    return sentences.join(' ');
  }
  
  // Algorithme amélioré : prendre début, milieu et fin
  const selectedIndices = [];
  
  // Toujours la première phrase (contexte)
  selectedIndices.push(0);
  
  // Phrases du milieu (plus importantes)
  const middleStart = Math.floor(sentences.length * 0.3);
  const middleEnd = Math.floor(sentences.length * 0.7);
  
  for (let i = middleStart; i < middleEnd && selectedIndices.length < maxSentences - 1; i++) {
    // Préférer les phrases plus longues (plus d'information)
    if (sentences[i].length > 50) {
      selectedIndices.push(i);
    }
  }
  
  // Si pas assez, prendre des phrases au hasard du milieu
  while (selectedIndices.length < maxSentences - 1) {
    const randomMiddle = Math.floor(Math.random() * (middleEnd - middleStart)) + middleStart;
    if (!selectedIndices.includes(randomMiddle)) {
      selectedIndices.push(randomMiddle);
    }
  }
  
  // Toujours la dernière phrase (conclusion)
  selectedIndices.push(sentences.length - 1);
  
  // Trier et limiter
  const uniqueIndices = [...new Set(selectedIndices)].slice(0, maxSentences).sort((a, b) => a - b);
  
  const selectedSentences = uniqueIndices.map(idx => sentences[idx]);
  const summary = selectedSentences.join(' ');
  
  // Nettoyer le résumé
  return summary.trim().replace(/\s+/g, ' ');
}

function analyzeSentimentEnhanced(text) {
  return sentimentAnalyzer.analyze(text);
}

// Fonction NLP complète (pour les notes)
async function processFullNLP(text) {
  try {
    if (!text || typeof text !== 'string') {
      return {
        summary: "",
        keywords: [],
        sentiment: { label: "neutral", score: 0.5, comparative: 0 }
      };
    }

    // Exécuter en parallèle pour la performance
    const [summary, keywords, sentiment] = await Promise.all([
      Promise.resolve(summarizeTextEnhanced(text)),
      Promise.resolve(extractKeywordsSimple(text, 8)),
      Promise.resolve(analyzeSentimentEnhanced(text))
    ]);

    return {
      summary: summary || "Résumé non généré",
      keywords: keywords || [],
      sentiment: {
        label: sentiment.label,
        score: sentiment.score,
        comparative: sentiment.comparative,
        rawScore: sentiment.rawScore,
        positive: sentiment.positive || [],
        negative: sentiment.negative || []
      }
    };
  } catch (error) {
    console.error("❌ Erreur dans processFullNLP:", error);
    return {
      summary: "",
      keywords: [],
      sentiment: { label: "neutral", score: 0.5, comparative: 0 }
    };
  }
}

// -------------------- ROUTES NLP AMÉLIORÉES --------------------

const extractKeywordsRoute = async (req, res) => {
  try {
    const { text, maxKeywords = 10 } = req.body;
    if (!text) return res.status(400).json({ error: "Texte requis" });
    
    const keywords = extractKeywordsSimple(text, maxKeywords);
    return res.json({ 
      success: true,
      keywords,
      count: keywords.length 
    });
  } catch (err) {
    console.error("❌ Erreur extraction keywords:", err);
    return res.status(500).json({ 
      error: "Erreur lors de l'extraction des mots-clés",
      details: err.message 
    });
  }
};

const summarizeText = async (req, res) => {
  try {
    const { text, maxSentences = 3 } = req.body;
    if (!text) return res.status(400).json({ error: "Texte requis" });

    const summary = summarizeTextEnhanced(text, maxSentences);
    return res.json({ 
      success: true,
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      reduction: Math.round((1 - (summary.length / text.length)) * 100) + '%'
    });
    
  } catch (err) {
    console.error("❌ Erreur summarization:", err);
    return res.status(500).json({ 
      error: "Erreur lors de la génération du résumé",
      details: err.message 
    });
  }
};

const analyzeSentiment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texte requis" });

    const sentiment = analyzeSentimentEnhanced(text);
    
    // Ajouter des interprétations
    let interpretation = "";
    if (sentiment.score >= 0.8) interpretation = "Très positif";
    else if (sentiment.score >= 0.6) interpretation = "Plutôt positif";
    else if (sentiment.score >= 0.4) interpretation = "Neutre/Modéré";
    else if (sentiment.score >= 0.2) interpretation = "Plutôt négatif";
    else interpretation = "Très négatif";

    return res.json({ 
      success: true,
      sentiment: {
        ...sentiment,
        interpretation
      },
      textAnalyzed: text.substring(0, 150) + (text.length > 150 ? '...' : '')
    });
    
  } catch (err) {
    console.error("❌ Erreur sentiment analysis:", err);
    return res.status(500).json({ 
      error: "Erreur lors de l'analyse de sentiment",
      details: err.message 
    });
  }
};

// NOUVEAU : Analyse NLP complète
const analyzeFullNLP = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texte requis" });

    const startTime = Date.now();
    const nlpResult = await processFullNLP(text);
    const duration = Date.now() - startTime;

    return res.json({
      success: true,
      ...nlpResult,
      processingTime: `${duration}ms`,
      textLength: text.length
    });
    
  } catch (err) {
    console.error("❌ Erreur analyse NLP complète:", err);
    return res.status(500).json({ 
      error: "Erreur lors de l'analyse NLP complète",
      details: err.message 
    });
  }
};

// NOUVEAU : Test du sentiment analyzer
const testSentimentAnalyzer = async (req, res) => {
  try {
    const testTexts = [
      "C'était absolument fantastique ! Une journée extraordinaire remplie de joie et de succès.",
      "Catastrophique, désastreux, épouvantable ! Une journée absolument exécrable.",
      "Journée normale sans événement particulier. Rien à signaler.",
      "Je ne suis pas content du tout de cette situation qui est vraiment problématique.",
      "Très satisfait du résultat final, c'est incroyablement bien fait !"
    ];

    const results = testTexts.map(text => ({
      text: text.substring(0, 80) + '...',
      analysis: sentimentAnalyzer.analyze(text)
    }));

    return res.json({
      success: true,
      tests: results,
      analyzerInfo: {
        lexiconSize: Object.keys(sentimentAnalyzer.lexicon).length,
        phraseLexiconSize: Object.keys(sentimentAnalyzer.phraseLexicon).length,
        hasNegationSupport: true
      }
    });
    
  } catch (err) {
    console.error("❌ Erreur test sentiment:", err);
    return res.status(500).json({ 
      error: "Erreur lors du test",
      details: err.message 
    });
  }
};

module.exports = {
  extractKeywordsRoute,
  summarizeText,
  analyzeSentiment,
  analyzeFullNLP,           // Nouveau
  testSentimentAnalyzer,    // Nouveau
  summarizeTextEnhanced,
  analyzeSentimentEnhanced,
  processFullNLP           // Export pour usage externe
};