import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Search,
  Refresh,
  Psychology,
  Assessment, // 🔹 icône analyse
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import NoteCard from '../components/NoteCard';
import { notesApi } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [processingNLP, setProcessingNLP] = useState(false);

  // Charger les notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await notesApi.getAllNotes();
      setNotes(response.data.notes || response.data);
      setFilteredNotes(response.data.notes || response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les notes.');
      setNotes([]);
      setFilteredNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Filtrage / tri
  useEffect(() => {
    let result = [...notes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(note =>
        note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term) ||
        note.summary?.toLowerCase().includes(term)
      );
    }

    if (filterSentiment !== 'all') {
      result = result.filter(
        note => note.sentiment?.label === filterSentiment
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'sentiment':
          return (b.sentiment?.score || 0) - (a.sentiment?.score || 0);
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

    setFilteredNotes(result);
  }, [notes, searchTerm, filterSentiment, sortBy]);

  // Actions
  const handleEdit = (id) => navigate(`/edit/${id}`);
  const handleView = (id) => navigate(`/note/${id}`);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette note ?')) return;
    try {
      await notesApi.deleteNote(id);
      setNotes(notes.filter(note => note._id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const handleProcessAllNLP = async () => {
    if (!window.confirm('Traiter le NLP pour toutes les notes ?')) return;
    try {
      setProcessingNLP(true);
      await notesApi.processAllNotesNLP();
      await fetchNotes();
    } catch {
      setError('Erreur NLP');
    } finally {
      setProcessingNLP(false);
    }
  };

  // Stats
  const stats = {
    total: notes.length,
    positive: notes.filter(n => n.sentiment?.label === 'positive').length,
    neutral: notes.filter(n => n.sentiment?.label === 'neutral').length,
    negative: notes.filter(n => n.sentiment?.label === 'negative').length,
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        📝 Smart Notes
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        Gérer et analyser vos notes intelligemment
      </Typography>

      {/* Stats */}
      <Box sx={{ my: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Grid container spacing={2}>
          {Object.entries(stats).map(([key, value]) => (
            <Grid item xs={6} sm={3} key={key}>
              <Box textAlign="center">
                <Typography variant="h6">{value}</Typography>
                <Typography variant="body2">{key}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 🔹 BARRE D’ACTIONS */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/create')}
        >
          Nouvelle note
        </Button>

        <Button
          variant="outlined"
          startIcon={<Assessment />}
          onClick={() => navigate('/dashboard')} // 🔥 bouton analyse
        >
          Analyse
        </Button>

        <Button
          variant="outlined"
          startIcon={<Psychology />}
          onClick={handleProcessAllNLP}
          disabled={processingNLP}
        >
          {processingNLP ? <CircularProgress size={20} /> : 'Traiter NLP'}
        </Button>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchNotes}
        >
          Actualiser
        </Button>
      </Box>

      {/* Filtres */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Sentiment</InputLabel>
            <Select
              value={filterSentiment}
              label="Sentiment"
              onChange={(e) => setFilterSentiment(e.target.value)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="positive">Positif</MenuItem>
              <MenuItem value="neutral">Neutre</MenuItem>
              <MenuItem value="negative">Négatif</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Trier par</InputLabel>
            <Select
              value={sortBy}
              label="Trier par"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="updatedAt">Modifié</MenuItem>
              <MenuItem value="createdAt">Créé</MenuItem>
              <MenuItem value="title">Titre</MenuItem>
              <MenuItem value="sentiment">Sentiment</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Notes */}
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {filteredNotes.map(note => (
            <Grid item xs={12} key={note._id}>
              <NoteCard
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default HomePage;
