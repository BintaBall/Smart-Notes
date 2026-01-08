// ai/services/suggestionService.js - Version simplifiée
class SuggestionService {
  constructor() {
    // Base de mots français
    this.frenchDictionary = [
      'bonjour', 'merci', 'excellent', 'projet', 'réunion', 'travail',
      'important', 'urgence', 'demain', 'semaine', 'mois', 'année',
      'client', 'équipe', 'collègue', 'manager', 'directeur', 'entreprise'
    ];
    
    this.transitionPhrases = [
      "De plus,",
      "En revanche,",
      "Par conséquent,",
      "En conclusion,",
      "Dans un premier temps,",
      "Ensuite,",
      "Finalement,"
    ];
    
    this.closings = [
      "Cordialement,",
      "Bien à vous,",
      "Sincères salutations,",
      "À bientôt,"
    ];
  }

  async getLiveSuggestions(text, cursorPosition) {
    try {
      if (!text || text.trim().length < 3) {
        return this.getDefaultSuggestions();
      }

      const suggestions = {
        words: this.getWordCompletions(text, cursorPosition),
        transitions: this.getTransitionSuggestions(text),
        closings: text.length > 100 ? this.closings : [],
        keywords: this.getKeywordSuggestions(text),
        style: this.getStyleTips(text)
      };

      // Filtrer
      Object.keys(suggestions).forEach(key => {
        if (Array.isArray(suggestions[key]) && suggestions[key].length === 0) {
          delete suggestions[key];
        }
      });

      return suggestions;

    } catch (error) {
      console.error("Erreur suggestions:", error);
      return this.getDefaultSuggestions();
    }
  }

  getWordCompletions(text, position) {
    const currentWord = this.getCurrentWord(text, position);
    if (currentWord.length < 2) return [];

    return this.frenchDictionary
      .filter(word => word.startsWith(currentWord.toLowerCase()))
      .slice(0, 5);
  }

  getTransitionSuggestions(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length < 2) return [];

    return this.transitionPhrases.slice(0, 3);
  }

  getKeywordSuggestions(text) {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set([
      'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou',
      'mais', 'dans', 'avec', 'pour', 'par', 'sur', 'sous'
    ]);

    const freq = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-zàâäéèêëîïôöùûüç]/gi, '');
      if (cleanWord.length > 3 && !stopWords.has(cleanWord)) {
        freq[cleanWord] = (freq[cleanWord] || 0) + 1;
      }
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  getStyleTips(text) {
    const tips = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach((sentence, index) => {
      const words = sentence.trim().split(/\s+/).length;
      if (words > 30) {
        tips.push(`Phrase ${index + 1} est longue (${words} mots).`);
      }
    });

    return tips.slice(0, 2);
  }

  getCurrentWord(text, position) {
    if (position < 0 || position > text.length) return '';

    let start = position;
    while (start > 0 && /\w/.test(text[start - 1])) start--;

    let end = position;
    while (end < text.length && /\w/.test(text[end])) end++;

    return text.substring(start, end);
  }

  getDefaultSuggestions() {
    return {
      words: ['bonjour', 'merci', 'projet'],
      transitions: ['De plus,', 'Ensuite,', 'Finalement,']
    };
  }
}

module.exports = SuggestionService;