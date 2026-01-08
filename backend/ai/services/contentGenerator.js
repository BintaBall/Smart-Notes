// ai/services/contentGenerator.js
class ContentGenerator {
  constructor() {
    // Templates pour différents types de notes
    this.templates = {
      meeting: {
        title: "Compte-rendu de réunion",
        structure: `📅 Date et heure : [Date]
👥 Participants : [Noms]
🎯 Objectifs : 
- [Objectif 1]
- [Objectif 2]

📝 Points abordés :
1. [Point 1]
2. [Point 2]

✅ Décisions prises :
- [Décision 1]
- [Décision 2]

📋 Actions à suivre :
- [ ] [Action 1] - Responsable: [Nom] - Échéance: [Date]
- [ ] [Action 2] - Responsable: [Nom] - Échéance: [Date]`
      },
      
      project: {
        title: "Plan de projet",
        structure: `🚀 Projet : [Nom du projet]
🎯 Objectifs : 
- [Objectif principal]
- [Objectifs secondaires]

📅 Échéances :
- Début : [Date]
- Fin prévue : [Date]
- Jalons : [Dates importantes]

👥 Équipe :
- [Rôle] : [Nom]
- [Rôle] : [Nom]

📊 Ressources nécessaires :
- [Ressource 1]
- [Ressource 2]

⚠️ Risques identifiés :
- [Risque 1] : [Impact] - [Solution]
- [Risque 2] : [Impact] - [Solution]

📈 Critères de succès :
- [Critère 1]
- [Critère 2]`
      },
      
      idea: {
        title: "Nouvelle idée",
        structure: `💡 Idée : [Titre de l'idée]

🎯 Problème résolu :
[Description du problème]

✨ Solution proposée :
[Description de la solution]

✅ Avantages :
- [Avantage 1]
- [Avantage 2]

⚙️ Comment l'implémenter :
1. [Étape 1]
2. [Étape 2]

💰 Coûts estimés :
- [Coût 1]
- [Coût 2]

🔍 Prochaines étapes :
- [ ] [Action 1]
- [ ] [Action 2]`
      },
      
      todo: {
        title: "Liste de tâches",
        structure: `📋 Liste : [Nom de la liste]

🔴 Priorité haute :
- [ ] [Tâche importante]
- [ ] [Tâche importante]

🟡 Priorité moyenne :
- [ ] [Tâche à faire]
- [ ] [Tâche à faire]

🟢 Priorité basse :
- [ ] [Tâche optionnelle]
- [ ] [Tâche optionnelle]

✅ Terminé :
- [x] [Tâche accomplie]`
      },
      
      note: {
        title: "Note personnelle",
        structure: `📝 Note du [Date]

💭 Mes réflexions :
[Écris tes pensées ici]

✨ Ce que j'ai appris :
- [Point 1]
- [Point 2]

🔮 Prochaines étapes :
- [Action 1]
- [Action 2]

🌟 Citation inspirante :
"[Citation]"`
      }
    };

    // Suggestions pour remplir les templates
    this.suggestions = {
      meeting: [
        "Préparer l'ordre du jour à l'avance",
        "Prendre des notes pendant la réunion",
        "Envoyer le compte-rendu dans les 24h"
      ],
      project: [
        "Définir des objectifs SMART",
        "Identifier les parties prenantes",
        "Prévoir un buffer de temps"
      ],
      idea: [
        "Valider l'idée avec des utilisateurs",
        "Rechercher des solutions existantes",
        "Estimer le retour sur investissement"
      ]
    };
  }

  // Générer une structure basée sur le type
  generateStructure(type = 'note', topic = '') {
    const template = this.templates[type] || this.templates.note;
    
    // Remplacer les placeholders par des suggestions
    let content = template.structure;
    
    // Ajouter la date actuelle
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    content = content.replace(/\[Date\]/g, dateStr);
    
    // Si un topic est fourni, l'ajouter
    if (topic) {
      content = content.replace(/\[Nom du projet\]/g, topic)
                       .replace(/\[Titre de l'idée\]/g, topic)
                       .replace(/\[Nom de la liste\]/g, topic);
    }
    
    return {
      title: topic ? `${template.title} : ${topic}` : template.title,
      content: content,
      type: type,
      suggestions: this.suggestions[type] || []
    };
  }

  // Générer à partir de mots-clés
  generateFromKeywords(keywords = []) {
    let type = 'note';
    
    // Déterminer le type basé sur les mots-clés
    const keywordStr = keywords.join(' ').toLowerCase();
    
    if (keywordStr.includes('réunion') || keywordStr.includes('meeting')) {
      type = 'meeting';
    } else if (keywordStr.includes('projet') || keywordStr.includes('plan')) {
      type = 'project';
    } else if (keywordStr.includes('idée') || keywordStr.includes('innovation')) {
      type = 'idea';
    } else if (keywordStr.includes('tâche') || keywordStr.includes('todo')) {
      type = 'todo';
    }
    
    // Prendre le premier mot-clé comme topic
    const topic = keywords.length > 0 ? keywords[0] : '';
    
    return this.generateStructure(type, topic);
  }

  // Générer des suggestions de titre
  suggestTitles(content, count = 3) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const firstSentence = sentences[0] || '';
    
    // Extraire les mots importants
    const words = content.toLowerCase().split(/\s+/);
    const importantWords = this.getImportantWords(words);
    
    const titles = [];
    
    // Titre basé sur la première phrase
    if (firstSentence.length > 10 && firstSentence.length < 50) {
      titles.push(firstSentence.trim());
    }
    
    // Titre basé sur les mots-clés
    if (importantWords.length >= 2) {
      const keywordTitle = importantWords.slice(0, 3).map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' - ');
      
      if (keywordTitle.length > 0) {
        titles.push(keywordTitle);
      }
    }
    
    // Titres génériques si besoin
    const genericTitles = [
      "Nouvelle note",
      "Réflexions du jour",
      "Notes importantes",
      "À retenir"
    ];
    
    // Combiner et limiter
    const allTitles = [...new Set([...titles, ...genericTitles])];
    return allTitles.slice(0, count);
  }

  getImportantWords(words) {
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

  // Générer une checklist à partir d'un texte
  generateChecklist(text) {
    const lines = text.split('\n');
    const checklist = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Détecter les tâches
      if (trimmed.length > 5 && (
        trimmed.toLowerCase().includes('faire') ||
        trimmed.toLowerCase().includes('vérifier') ||
        trimmed.toLowerCase().includes('préparer') ||
        trimmed.toLowerCase().includes('envoyer') ||
        trimmed.toLowerCase().includes('appeler')
      )) {
        checklist.push({
          task: trimmed,
          completed: false,
          priority: this.determinePriority(trimmed)
        });
      }
    });
    
    return checklist.slice(0, 10); // Limiter à 10 items
  }

  determinePriority(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('urgent') || lowerText.includes('important')) {
      return 'high';
    }
    
    if (lowerText.includes('semaine') || lowerText.includes('prochain')) {
      return 'medium';
    }
    
    return 'low';
  }

  // Suggestions d'amélioration
  getImprovementSuggestions(content) {
    const suggestions = [];
    
    // Vérifier la longueur
    if (content.length < 50) {
      suggestions.push("Ta note est très courte. Peut-être pourrais-tu développer tes idées ?");
    } else if (content.length > 1000) {
      suggestions.push("Ta note est longue. Considère ajouter des titres ou la diviser en plusieurs notes.");
    }
    
    // Vérifier les paragraphes
    const paragraphs = content.split('\n\n').length;
    if (paragraphs === 1 && content.length > 200) {
      suggestions.push("Ajouter des sauts de ligne pourrait améliorer la lisibilité.");
    }
    
    // Vérifier les listes
    const hasLists = content.includes('- ') || content.includes('* ') || content.includes('1.');
    if (!hasLists && content.length > 150) {
      suggestions.push("Les listes à puces peuvent aider à organiser tes idées.");
    }
    
    return suggestions.slice(0, 2);
  }

  // Test simple
  test() {
    console.log("Test content generation:");
    const result = this.generateStructure('meeting', 'Projet React');
    console.log("Generated:", result.title);
    console.log("Content length:", result.content.length);
  }
}

module.exports = ContentGenerator;