// nlp/sentimentAnalyzer.js
const sentimentFr = require("sentiment-fr");

class SentimentAnalyzer {
  constructor() {
    console.log('🔍 sentiment-fr chargé, type:', typeof sentimentFr);
    
    // Lexique principal (sentiment-fr)
    this.lexicon = sentimentFr;

    // Expressions multi-mots avec poids renforcés
    this.phraseLexicon = {
      "au top": 5,
      "sans souci": 4,
      "vraiment bien": 4,
      "absolument parfait": 6,
      "exceptionnellement bon": 5,
      "incroyablement bien": 5,
      "tout simplement génial": 6,
      "pas mal": 1,
      "sans intérêt": -3,
      "très décevant": -5,
      "perte de temps": -5,
      "grosse déception": -6,
      "totalement nul": -6,
      "absolument horrible": -7,
      "catastrophe totale": -7,
      "désastre complet": -7
    };

    // Mots de négation
    this.negations = new Set([
      "pas", "jamais", "plus", "aucun", "aucune", "rien",
      "ne", "sans", "guère", "ni", "non"
    ]);

    // Intensificateurs (augmentent l'intensité)
    this.intensifiers = {
      "très": 1.5,
      "extrêmement": 2.0,
      "absolument": 2.0,
      "complètement": 1.8,
      "totalement": 1.8,
      "vraiment": 1.5,
      "tellement": 1.7,
      "incroyablement": 2.0,
      "exceptionnellement": 2.0
    };

    // Mots très positifs/négatifs (surcharge du lexique)
    this.strongWords = {
      "extraordinaire": 5,
      "fantastique": 5,
      "merveilleux": 5,
      "formidable": 4,
      "sublime": 5,
      "divin": 5,
      "parfait": 5,
      "excellent": 4,
      "superbe": 4,
      "catastrophique": -6,
      "épouvantable": -6,
      "désastreux": -5,
      "exécrable": -7,
      "lamentable": -5,
      "atroce": -6,
      "terrifiant": -6,
      "horrible": -5,
      "abominable": -7
    };
  }

  analyze(text) {
    try {
      console.log('📝 Analyse du texte:', text.substring(0, 100) + '...');
      
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
      const usedPhrases = new Set();

      // ===============================
      // 1️⃣ Analyse des PHRASES complètes
      // ===============================
      Object.entries(this.phraseLexicon).forEach(([phrase, value]) => {
        if (cleanText.includes(phrase) && !usedPhrases.has(phrase)) {
          score += value;
          matchedWords.push(phrase);
          usedPhrases.add(phrase);

          if (value > 0) positive.push(phrase);
          else negative.push(phrase);
          
          console.log(`   📍 Phrase "${phrase}": ${value > 0 ? '+' : ''}${value}`);
        }
      });

      // ===============================
      // 2️⃣ Analyse MOT PAR MOT
      // ===============================
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        let wordScore = 0;

        // Vérifier les mots forts d'abord
        if (this.strongWords[token] !== undefined) {
          wordScore = this.strongWords[token];
        }
        // Sinon vérifier le lexique standard
        else if (this.lexicon[token] !== undefined) {
          wordScore = this.lexicon[token];
        }

        if (wordScore !== 0) {
          // 🔁 Vérifier la négation
          let isNegated = false;
          let intensityMultiplier = 1.0;

          // Vérifier les tokens précédents pour négation/intensificateur
          for (let j = Math.max(0, i - 2); j < i; j++) {
            const prevToken = tokens[j];
            
            if (this.negations.has(prevToken)) {
              isNegated = true;
            }
            
            if (this.intensifiers[prevToken] !== undefined) {
              intensityMultiplier = this.intensifiers[prevToken];
            }
          }

          // Appliquer la négation
          if (isNegated) {
            wordScore = -wordScore * 0.7; // Inversion atténuée
          }

          // Appliquer l'intensificateur
          wordScore *= intensityMultiplier;

          score += wordScore;
          matchedWords.push(token);

          if (wordScore > 0) positive.push(token);
          else if (wordScore < 0) negative.push(token);
          
          console.log(`   📍 Mot "${token}": ${wordScore > 0 ? '+' : ''}${wordScore.toFixed(2)}`);
        }
      }

      // ===============================
      // 3️⃣ Ajustement basé sur la longueur
      // ===============================
      const wordCount = tokens.length;
      let lengthAdjustment = 0;
      
      if (wordCount > 50) {
        // Pour les textes longs, normaliser le score
        lengthAdjustment = score / Math.sqrt(wordCount);
      }

      const finalScore = score + lengthAdjustment;
      const comparative = wordCount > 0 ? finalScore / wordCount : 0;

      // ===============================
      // 4️⃣ Détermination du label
      // ===============================
      let label = "neutral";
      
      // Seuils ajustés
      if (finalScore >= 1.5) label = "positive";
      else if (finalScore <= -1.5) label = "negative";

      // Forcer le label pour les cas extrêmes
      if (Math.abs(finalScore) > 5) {
        label = finalScore > 0 ? "positive" : "negative";
      }

      const result = {
        label,
        score: this.normalizeScore(finalScore),
        comparative: Number(comparative.toFixed(4)),
        positive: [...new Set(positive)], // Éviter les doublons
        negative: [...new Set(negative)],
        tokens: tokens,
        words: matchedWords,
        rawScore: Number(finalScore.toFixed(2))
      };

      console.log('📊 Résultat analyse:', {
        label: result.label,
        rawScore: result.rawScore,
        score: result.score,
        positive: result.positive.length,
        negative: result.negative.length,
        tokens: result.tokens.length
      });

      return result;

    } catch (error) {
      console.error("❌ Erreur dans l'analyse de sentiment:", error);
      return this.getNeutralResult();
    }
  }

  // ===============================
  // Utils améliorés
  // ===============================
  normalizeScore(rawScore) {
    // Échelle -15 à +15 → 0 à 1
    const clamped = Math.max(-15, Math.min(15, rawScore));
    const normalized = (clamped + 15) / 30;
    return Math.max(0, Math.min(1, Number(normalized.toFixed(3))));
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

  // Méthode de test rapide
  test(text) {
    console.log('\n🧪 TEST SENTIMENT ANALYZER:');
    console.log('Text:', text.substring(0, 80) + '...');
    const result = this.analyze(text);
    console.log('Result:', {
      label: result.label,
      score: result.score,
      rawScore: result.rawScore,
      positive: result.positive.slice(0, 3),
      negative: result.negative.slice(0, 3)
    });
    return result;
  }
}

module.exports = SentimentAnalyzer;