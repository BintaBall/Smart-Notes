// controllers/nlpController.js
const { extractKeywordsSimple } = require("../nlp/keyword.js");
const SentimentAnalyzer = require("../nlp/sentimentAnalyzer");

const sentimentAnalyzer = new SentimentAnalyzer();

// -------------------- FONCTIONS NLP --------------------

function summarizeTextEnhanced(text, maxSentences = 3) {
  if (!text || typeof text !== "string") return "";
  
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  
  if (sentences.length <= maxSentences) {
    return sentences.join(' ');
  }
  
  const selectedIndices = [
    0,
    Math.floor(sentences.length / 2),
    sentences.length - 1
  ];
  
  const selectedSentences = selectedIndices
    .filter(idx => idx < sentences.length)
    .map(idx => sentences[idx]);
  
  return selectedSentences.join(' ');
}

function analyzeSentimentEnhanced(text) {
  return sentimentAnalyzer.analyze(text);
}

// -------------------- ROUTES NLP --------------------

const extractKeywordsRoute = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texte requis" });
    
    const keywords = extractKeywordsSimple(text);
    return res.json({ keywords });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const summarizeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texte requis" });

    const summary = summarizeTextEnhanced(text);
    return res.json({ summary });
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const analyzeSentiment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texte requis" });

    const sentiment = analyzeSentimentEnhanced(text);
    return res.json({ sentiment });
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  extractKeywordsRoute,
  summarizeText,
  analyzeSentiment,
  summarizeTextEnhanced,
  analyzeSentimentEnhanced
};