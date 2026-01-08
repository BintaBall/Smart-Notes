import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  Button
} from '@mui/material';
import {
  Psychology,
  Lightbulb,
  ExpandMore,
  ExpandLess,
  Refresh,
  AutoAwesome
} from '@mui/icons-material';
import { aiApi } from '../services/api';

const AIAssistant = ({ content = '', onSuggestionClick }) => {
  /* =======================
      STATE
  ======================= */
  const [activeTab, setActiveTab] = useState(0);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Génération IA
  const [generationType, setGenerationType] = useState('summary');
  const [generationTopic, setGenerationTopic] = useState('');
  const [generatedText, setGeneratedText] = useState('');

  const debounceTimer = useRef(null);

  /* =======================
      SUGGESTIONS IA
  ======================= */
  const fetchSuggestions = useCallback(async () => {
    if (!content || content.length < 10) return;

    setLoading(true);
    try {
      const response = await aiApi.getSuggestions({ text: content });
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Erreur suggestions IA:', error);
    } finally {
      setLoading(false);
    }
  }, [content]);

  useEffect(() => {
    if (activeTab === 0 && content.length > 10) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(fetchSuggestions, 500);
    }
    return () => debounceTimer.current && clearTimeout(debounceTimer.current);
  }, [content, activeTab, fetchSuggestions]);

  /* =======================
      GÉNÉRATION IA
  ======================= */
  const generateContent = async () => {
    if (!content) return;

    setLoading(true);
    setGeneratedText('');

    try {
      const response = await aiApi.generateContent({
        text: content,
        type: generationType,
        topic: generationTopic
      });
      setGeneratedText(response.data.generatedText);
    } catch (error) {
      console.error('Erreur génération IA:', error);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
      RENDER SUGGESTIONS
  ======================= */
  const renderSuggestions = () => {
    if (!suggestions) return null;

    const { corrections, words, transitions, style } = suggestions;

    return (
      <Box>
        {corrections?.length > 0 && (
          <Box mb={2}>
            <Typography color="error">✏️ Corrections</Typography>
            {corrections.map((c, i) => (
              <Chip
                key={i}
                label={`${c.original} → ${c.suggestion}`}
                onClick={() => onSuggestionClick(c, 'correction')}
                color="error"
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}

        {words?.length > 0 && (
          <Box mb={2}>
            <Typography>🔤 Complétions</Typography>
            {words.map((w, i) => (
              <Chip
                key={i}
                label={w}
                onClick={() => onSuggestionClick(w, 'word')}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}

        {transitions?.length > 0 && (
          <Box mb={2}>
            <Typography>🔄 Transitions</Typography>
            {transitions.map((t, i) => (
              <Chip
                key={i}
                label={t}
                onClick={() => onSuggestionClick(t, 'transition')}
                size="small"
                variant="outlined"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
        )}

        {style?.length > 0 && (
          <Box>
            <Typography>💡 Conseils de style</Typography>
            <List dense>
              {style.map((s, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    <Lightbulb fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={s} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    );
  };

  /* =======================
      RENDER GÉNÉRATION
  ======================= */
  const renderGeneration = () => (
    <Box>
      <TextField
        fullWidth
        label="Sujet (optionnel)"
        value={generationTopic}
        onChange={(e) => setGenerationTopic(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        {['summary', 'expand', 'rephrase', 'ideas'].map(type => (
          <Chip
            key={type}
            label={type}
            color={generationType === type ? 'primary' : 'default'}
            onClick={() => setGenerationType(type)}
          />
        ))}
      </Box>

      <Button
        variant="contained"
        startIcon={<AutoAwesome />}
        onClick={generateContent}
        disabled={loading}
      >
        Générer
      </Button>

      {generatedText && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2">Résultat IA</Typography>
          <Typography>{generatedText}</Typography>
        </Paper>
      )}
    </Box>
  );

  /* =======================
      MAIN RENDER
  ======================= */
  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between">
        <Typography>
          <Psychology sx={{ mr: 1 }} />
          Assistant IA
        </Typography>
        <Box>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
          <IconButton onClick={fetchSuggestions} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <Tab label="Suggestions" />
        <Tab label="Génération" />
      </Tabs>

      <Collapse in={expanded}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : activeTab === 0 ? (
          renderSuggestions()
        ) : (
          renderGeneration()
        )}
      </Collapse>
    </Paper>
  );
};

export default AIAssistant;
