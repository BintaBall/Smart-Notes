// src/components/NoteForm.jsx
import React, { useState, useEffect } from 'react';
import AIAssistant from './AIAssistant';
import {
  TextField,
  Button,
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Clear,
  Summarize,
  Tag,
  SentimentSatisfied,
} from '@mui/icons-material';
import { nlpApi, aiApi } from '../services/api';

const NoteForm = ({ initialData = {}, onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    keywords: [],
    sentiment: { label: 'neutral', score: 0 },
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [nlpLoading, setNlpLoading] = useState({
    summary: false,
    keywords: false,
    sentiment: false
  });
  const [cursorPosition, setCursorPosition] = useState(0);

  // Réinitialiser si initialData change
  useEffect(() => {
    if (initialData._id) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        summary: initialData.summary || '',
        keywords: initialData.keywords || [],
        sentiment: initialData.sentiment || { label: 'neutral', score: 0 }
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Suivre la position du curseur dans le textarea
  const handleContentSelect = (e) => {
    setCursorPosition(e.target.selectionStart);
  };

  const handleKeywordAdd = (keyword) => {
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
    }
  };

  const handleKeywordDelete = (keywordToDelete) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToDelete)
    }));
  };

  // Gestion des suggestions de l'IA
  const handleSuggestionClick = (suggestion, type) => {
    let newContent = formData.content;
    
    switch (type) {
      case 'word':
        // Ajouter le mot à la fin ou remplacer le mot courant
        if (cursorPosition > 0 && !/\s/.test(formData.content[cursorPosition - 1])) {
          // Trouver le début du mot courant
          let wordStart = cursorPosition;
          while (wordStart > 0 && /\w/.test(formData.content[wordStart - 1])) {
            wordStart--;
          }
          newContent = formData.content.substring(0, wordStart) + 
                       suggestion + 
                       formData.content.substring(cursorPosition);
        } else {
          // Ajouter à la position actuelle
          newContent = formData.content.substring(0, cursorPosition) + 
                       suggestion + 
                       formData.content.substring(cursorPosition);
        }
        break;
        
      case 'transition':
        // Ajouter une nouvelle ligne avec la transition
        newContent = formData.content + '\n\n' + suggestion + ' ';
        break;
        
      case 'correction':
        // Remplacer le mot mal orthographié
        if (typeof suggestion === 'object' && suggestion.suggestion) {
          // Dans ce cas, suggestion est un objet { original, suggestion, position }
          const words = formData.content.split(/\s+/);
          if (words[suggestion.position]) {
            words[suggestion.position] = suggestion.suggestion;
            newContent = words.join(' ');
          }
        } else {
          // Simple remplacement de chaîne
          newContent = formData.content;
        }
        break;
        
      default:
        // Ajouter le texte à la fin
        newContent = formData.content + ' ' + suggestion;
    }
    
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
  };

  // Insérer un template généré par l'IA
  const handleInsertTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      title: template.title || prev.title,
      content: template.content,
      summary: template.summary || prev.summary,
      keywords: [...new Set([...prev.keywords, ...(template.keywords || [])])]
    }));
  };

// Dans NoteForm.jsx - Correction de handleNlpAction
const handleNlpAction = async (type) => {
  if (!formData.content.trim()) {
    setErrors(prev => ({ ...prev, content: 'Du contenu est nécessaire' }));
    return;
  }

  setNlpLoading(prev => ({ ...prev, [type]: true }));

  try {
    let result;
    let keywords; // Déclarer ici
    
    switch (type) {
      case 'summary':
        result = await nlpApi.summarize(formData.content);
        setFormData(prev => ({ 
          ...prev, 
          summary: result.data?.summary || "Aucun résumé généré" 
        }));
        break;
        
      case 'keywords':
        result = await nlpApi.keywords(formData.content);
        keywords = result.data?.keywords || []; // Maintenant OK
        if (Array.isArray(keywords)) {
          const newKeywords = keywords.filter(
            kw => kw && 
            typeof kw === 'string' && 
            kw.trim() !== '' && 
            !formData.keywords.includes(kw)
          );
          
          if (newKeywords.length > 0) {
            setFormData(prev => ({
              ...prev,
              keywords: [...prev.keywords, ...newKeywords]
            }));
          }
        }
        break;
        
      case 'sentiment':
        result = await nlpApi.sentiment(formData.content);
        setFormData(prev => ({ 
          ...prev, 
          sentiment: result.data?.sentiment || { label: "neutral", score: 0 }
        }));
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(`Erreur NLP (${type}):`, error);
    setErrors(prev => ({ 
      ...prev, 
      nlp: `Erreur ${type}` 
    }));
  } finally {
    setNlpLoading(prev => ({ ...prev, [type]: false }));
  }
};

  const handleAutoNLP = async () => {
    if (!formData.content.trim()) {
      setErrors(prev => ({ ...prev, content: 'Du contenu est nécessaire pour l\'analyse NLP' }));
      return;
    }

    setNlpLoading({ summary: true, keywords: true, sentiment: true });

    try {
      // Exécuter toutes les analyses en parallèle
      const [summaryRes, keywordsRes, sentimentRes] = await Promise.all([
        nlpApi.summarize(formData.content),
        nlpApi.keywords(formData.content),
        nlpApi.sentiment(formData.content)
      ]);

      setFormData(prev => ({
        ...prev,
        summary: summaryRes.data.summary,
        keywords: [...prev.keywords, ...keywordsRes.data.keywords.filter(
          kw => kw && typeof kw === 'string' && !prev.keywords.includes(kw)
        )],
        sentiment: sentimentRes.data.sentiment
      }));

    } catch (error) {
      console.error('Erreur NLP auto:', error);
      setErrors(prev => ({ 
        ...prev, 
        nlp: 'Erreur lors de l\'analyse automatique' 
      }));
    } finally {
      setNlpLoading({ summary: false, keywords: false, sentiment: false });
    }
  };

  // Générer des suggestions de titre avec l'IA
  const handleSuggestTitles = async () => {
    if (!formData.content.trim()) return;
    
    try {
      const response = await aiApi.suggestTitles({ content: formData.content });
      if (response.data.titles && response.data.titles.length > 0) {
        // Créer un menu déroulant ou afficher les suggestions
        alert(`Suggestions de titre:\n\n${response.data.titles.join('\n')}`);
      }
    } catch (error) {
      console.error('Erreur suggestions de titre:', error);
    }
  };

  // Générer une checklist avec l'IA
  const handleGenerateChecklist = async () => {
    if (!formData.content.trim()) return;
    
    try {
      const response = await aiApi.generateChecklist({ content: formData.content });
      if (response.data.checklist && response.data.checklist.length > 0) {
        const checklistText = response.data.checklist
          .map(item => `- [ ] ${item.task}`)
          .join('\n');
        
        setFormData(prev => ({
          ...prev,
          content: prev.content + '\n\n📋 Checklist générée:\n' + checklistText
        }));
      }
    } catch (error) {
      console.error('Erreur génération checklist:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
    if (!formData.content.trim()) newErrors.content = 'Le contenu est requis';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Préparer les données pour l'API
    const submitData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      summary: formData.summary.trim(),
      keywords: formData.keywords,
      sentiment: formData.sentiment
    };

    onSubmit(submitData);
  };

  const handleClear = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      keywords: [],
      sentiment: { label: 'neutral', score: 0 }
    });
    setErrors({});
    setCursorPosition(0);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        {initialData._id ? 'Modifier la note' : 'Nouvelle note'}
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Titre avec bouton IA */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            label="Titre"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
            margin="normal"
            required
            disabled={isLoading}
          />
          <Tooltip title="Suggestions de titre IA">
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={handleSuggestTitles}
              disabled={isLoading || !formData.content}
            >
              IA
            </Button>
          </Tooltip>
        </Box>

        {/* Assistant IA */}
        <AIAssistant
          content={formData.content}
          cursorPosition={cursorPosition}
          onSuggestionClick={handleSuggestionClick}
          onInsertTemplate={handleInsertTemplate}
        />

        {/* Contenu */}
        <TextField
          fullWidth
          label="Contenu"
          name="content"
          value={formData.content}
          onChange={handleChange}
          onSelect={handleContentSelect}
          onClick={handleContentSelect}
          onKeyUp={handleContentSelect}
          error={!!errors.content}
          helperText={errors.content}
          margin="normal"
          multiline
          rows={8}
          required
          disabled={isLoading}
          InputProps={{
            style: { fontFamily: 'monospace' }
          }}
        />

        {/* Boutons NLP et IA améliorés */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Analyser automatiquement (NLP)">
            <Button
              variant="outlined"
              startIcon={nlpLoading.summary ? <CircularProgress size={20} /> : <Summarize />}
              onClick={handleAutoNLP}
              disabled={isLoading || nlpLoading.summary || !formData.content}
            >
              Analyse Auto
            </Button>
          </Tooltip>

          <Tooltip title="Générer un résumé">
            <Button
              variant="outlined"
              startIcon={nlpLoading.summary ? <CircularProgress size={20} /> : <Summarize />}
              onClick={() => handleNlpAction('summary')}
              disabled={isLoading || nlpLoading.summary || !formData.content}
            >
              Résumé
            </Button>
          </Tooltip>

          <Tooltip title="Extraire les mots-clés">
            <Button
              variant="outlined"
              startIcon={nlpLoading.keywords ? <CircularProgress size={20} /> : <Tag />}
              onClick={() => handleNlpAction('keywords')}
              disabled={isLoading || nlpLoading.keywords || !formData.content}
            >
              Mots-clés
            </Button>
          </Tooltip>

          <Tooltip title="Analyser le sentiment">
            <Button
              variant="outlined"
              startIcon={nlpLoading.sentiment ? <CircularProgress size={20} /> : <SentimentSatisfied />}
              onClick={() => handleNlpAction('sentiment')}
              disabled={isLoading || nlpLoading.sentiment || !formData.content}
            >
              Sentiment
            </Button>
          </Tooltip>

          <Tooltip title="Générer une checklist IA">
            <Button
              variant="outlined"
              onClick={handleGenerateChecklist}
              disabled={isLoading || !formData.content}
            >
              Checklist IA
            </Button>
          </Tooltip>
        </Box>

        {/* Résumé */}
        <TextField
          fullWidth
          label="Résumé"
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          margin="normal"
          multiline
          rows={2}
          disabled={isLoading}
          helperText="Résumé généré automatiquement ou édité manuellement"
        />

        {/* Mots-clés */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Mots-clés:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            {formData.keywords.map((keyword, index) => (
              <Chip
                key={index}
                label={keyword}
                onDelete={() => handleKeywordDelete(keyword)}
                deleteIcon={<Clear />}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Ajouter un mot-clé"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleKeywordAdd(e.target.value.trim());
                  e.target.value = '';
                }
              }}
              disabled={isLoading}
              sx={{ flexGrow: 1 }}
            />
            <IconButton
              size="small"
              onClick={(e) => {
                const input = e.target.closest('div').previousSibling.querySelector('input');
                if (input.value.trim()) {
                  handleKeywordAdd(input.value.trim());
                  input.value = '';
                }
              }}
              disabled={isLoading}
            >
              <Add />
            </IconButton>
          </Box>
        </Box>

        {/* Sentiment */}
        {formData.sentiment && (
          <Box sx={{ 
            mt: 2, 
            mb: 2, 
            p: 2, 
            bgcolor: 'background.default', 
            borderRadius: 1,
            borderLeft: 3,
            borderColor: formData.sentiment.label === 'positive' ? 'success.main' :
                        formData.sentiment.label === 'negative' ? 'error.main' : 'warning.main'
          }}>
            <Typography variant="subtitle2" gutterBottom>
              Sentiment détecté:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body1"
                sx={{ 
                  fontWeight: 'medium',
                  color: formData.sentiment.label === 'positive' ? 'success.main' :
                         formData.sentiment.label === 'negative' ? 'error.main' : 'text.secondary'
                }}
              >
                {formData.sentiment.label?.charAt(0).toUpperCase() + formData.sentiment.label?.slice(1)}
                {formData.sentiment.score && ` (${Math.round(formData.sentiment.score * 100)}%)`}
              </Typography>
            </Box>
            {formData.sentiment.comparative && (
              <Typography variant="caption" color="text.secondary">
                Score comparatif: {formData.sentiment.comparative.toFixed(4)}
              </Typography>
            )}
          </Box>
        )}

        {/* Erreurs générales */}
        {errors.nlp && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errors.nlp}
          </Alert>
        )}

        {/* Boutons d'action */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleClear}
              disabled={isLoading}
              color="inherit"
              startIcon={<Clear />}
            >
              Effacer tout
            </Button>
            
            <Tooltip title="Générer un template de note">
              <Button
                onClick={() => handleInsertTemplate({ title: 'Nouveau Template', content: '' })}
                disabled={isLoading}
                color="secondary"
              >
                Template IA
              </Button>
            </Tooltip>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            {initialData._id && (
              <Button
                variant="outlined"
                onClick={() => window.history.back()}
                disabled={isLoading}
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading && <CircularProgress size={20} />}
              sx={{ minWidth: 120 }}
            >
              {isLoading ? 'Enregistrement...' : initialData._id ? 'Mettre à jour' : 'Créer'}
            </Button>
          </Box>
        </Box>

        {/* Conseils */}
        <Alert 
          severity="info" 
          sx={{ mt: 2 }}
          icon={<Summarize />}
        >
          <Typography variant="body2">
            <strong>Astuce :</strong> Utilise l'Assistant IA pour des suggestions en temps réel, 
            des corrections et des templates. Les boutons NLP analysent automatiquement ton texte.
          </Typography>
        </Alert>
      </form>
    </Paper>
  );
};

export default NoteForm;