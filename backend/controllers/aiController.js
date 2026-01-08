// controllers/aiController.js
const SuggestionService = require('../ai/services/suggestionService');
const ContentGenerator = require('../ai/services/contentGenerator');

const suggestionService = new SuggestionService();
const contentGenerator = new ContentGenerator();

class AIController {
  // Suggestions en temps réel
  async getSuggestions(req, res) {
    try {
      const { text, cursorPosition } = req.body;
      
      if (!text) {
        return res.json({
          success: true,
          suggestions: suggestionService.getDefaultSuggestions()
        });
      }
      
      const suggestions = await suggestionService.getLiveSuggestions(
        text, 
        cursorPosition || text.length
      );
      
      return res.json({
        success: true,
        suggestions,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Erreur suggestions:", error);
      return res.status(500).json({
        error: "Erreur lors de la génération des suggestions",
        details: error.message
      });
    }
  }

  // Génération de contenu
  async generateContent(req, res) {
    try {
      const { type, topic, keywords } = req.body;
      
      let generatedContent;
      
      if (keywords && keywords.length > 0) {
        generatedContent = contentGenerator.generateFromKeywords(keywords);
      } else {
        generatedContent = contentGenerator.generateStructure(type || 'note', topic || '');
      }
      
      // Ajouter des suggestions de titre si non fourni
      if (!topic && generatedContent.content) {
        generatedContent.titleSuggestions = contentGenerator.suggestTitles(
          generatedContent.content, 
          3
        );
      }
      
      return res.json({
        success: true,
        ...generatedContent
      });
      
    } catch (error) {
      console.error("Erreur génération contenu:", error);
      return res.status(500).json({
        error: "Erreur lors de la génération de contenu",
        details: error.message
      });
    }
  }

  // Suggestions de titre
  async suggestTitles(req, res) {
    try {
      const { content } = req.body;
      
      if (!content || content.trim().length < 10) {
        return res.json({
          success: true,
          titles: ["Nouvelle note", "Note du jour", "Réflexions"]
        });
      }
      
      const titles = contentGenerator.suggestTitles(content, 5);
      
      return res.json({
        success: true,
        titles
      });
      
    } catch (error) {
      return res.status(500).json({
        error: "Erreur lors de la suggestion de titres",
        details: error.message
      });
    }
  }

  // Générer une checklist
  async generateChecklist(req, res) {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.json({
          success: true,
          checklist: []
        });
      }
      
      const checklist = contentGenerator.generateChecklist(content);
      
      return res.json({
        success: true,
        checklist,
        totalTasks: checklist.length
      });
      
    } catch (error) {
      return res.status(500).json({
        error: "Erreur lors de la génération de checklist",
        details: error.message
      });
    }
  }

  // Suggestions d'amélioration
  async getImprovements(req, res) {
    try {
      const { content } = req.body;
      
      if (!content) {
        return res.json({
          success: true,
          improvements: []
        });
      }
      
      const improvements = contentGenerator.getImprovementSuggestions(content);
      
      return res.json({
        success: true,
        improvements
      });
      
    } catch (error) {
      return res.status(500).json({
        error: "Erreur lors de l'analyse d'amélioration",
        details: error.message
      });
    }
  }

  // Test endpoint
  async test(req, res) {
    try {
      // Test des suggestions
      const testText = "Je dois préparer une présentation pour la réunion de demain.";
      const suggestions = await suggestionService.getLiveSuggestions(testText, testText.length);
      
      // Test de génération de contenu
      const generated = contentGenerator.generateStructure('meeting', 'Réunion projet');
      
      return res.json({
        success: true,
        tests: {
          suggestions: {
            input: testText,
            output: suggestions
          },
          generation: {
            type: 'meeting',
            topic: 'Réunion projet',
            output: {
              title: generated.title,
              contentLength: generated.content.length
            }
          }
        }
      });
      
    } catch (error) {
      return res.status(500).json({
        error: "Erreur lors des tests",
        details: error.message
      });
    }
  }
}

module.exports = new AIController();