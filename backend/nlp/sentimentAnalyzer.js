const sentimentFr = require("sentiment-fr");

class SentimentAnalyzer {
  constructor() {
    // Lexique principal (sentiment-fr)
    this.lexicon = sentimentFr;

    // Expressions multi-mots (comptées UNE SEULE FOIS)
    this.phraseLexicon = {
      "au top": 4,
      "sans souci": 3,
      "vraiment bien": 3,
      "pas mal": 1,
      "sans intérêt": -2,
      "très décevant": -4,
      "perte de temps": -4,
      "grosse déception": -5
    };

    // Mots de négation simples
    this.negations = new Set([
      "pas",
      "jamais",
      "plus",
      "aucun",
      "aucune",
      "rien"
    ]);
  }

  analyze(text) {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return this.getNeutralResult();
    }

    const cleanText = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ");

    const tokens = cleanText
      .split(/\s+/)
      .filter(t => t.length > 1);

    let score = 0;
    const positive = [];
    const negative = [];
    const matchedWords = [];

    // ===============================
    // 1️⃣ Analyse des PHRASES (1 seule fois)
    // ===============================
    let phraseScore = 0;
    Object.entries(this.phraseLexicon).forEach(([phrase, value]) => {
      if (cleanText.includes(phrase)) {
        phraseScore += value;
        matchedWords.push(phrase);

        if (value > 0) positive.push(phrase);
        else negative.push(phrase);
      }
    });

    // ===============================
    // 2️⃣ Analyse MOT PAR MOT avec négation
    // ===============================
    tokens.forEach((token, index) => {
      let wordScore = 0;

      if (this.lexicon[token] !== undefined) {
        wordScore = this.lexicon[token];

        // 🔁 Négation simple : "pas bon", "jamais satisfait"
        const prevToken = tokens[index - 1];
        if (this.negations.has(prevToken)) {
          wordScore = -wordScore * 0.8; // inversion atténuée
        }

        score += wordScore;
        matchedWords.push(token);

        if (wordScore > 0) positive.push(token);
        else if (wordScore < 0) negative.push(token);
      }
    });

    // ===============================
    // 3️⃣ Score final
    // ===============================
    score += phraseScore;

    const comparative = tokens.length > 0 ? score / tokens.length : 0;

    let label = "neutral";
    if (score >= 2) label = "positive";
    else if (score <= -2) label = "negative";

    return {
      label,
      score: this.normalizeScore(score),
      comparative: Number(comparative.toFixed(3)),
      positive,
      negative,
      tokens,
      words: matchedWords,
      rawScore: Number(score.toFixed(2))
    };
  }

  // ===============================
  // Utils
  // ===============================
  normalizeScore(rawScore) {
    // Clamp entre -10 et +10 → 0 à 1
    const clamped = Math.max(-10, Math.min(10, rawScore));
    return Number(((clamped + 10) / 20).toFixed(3));
  }

  getNeutralResult() {
    return {
      label: "neutral",
      score: 0.5,
      comparative: 0,
      positive: [],
      negative: [],
      tokens: [],
      words: [],
      rawScore: 0
    };
  }
}

module.exports = SentimentAnalyzer;
