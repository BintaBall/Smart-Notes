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
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Sort,
  Refresh,
  Psychology,
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
      console.error('Erreur chargement notes:', err);
      setError('Impossible de charger les notes. Vérifiez la connexion au serveur.');
      setNotes([]);
      setFilteredNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Filtrer et trier les notes
  useEffect(() => {
    let result = [...notes];

    // Recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(note =>
        note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term) ||
        note.summary?.toLowerCase().includes(term) ||
        note.keywords?.some(kw => kw.toLowerCase().includes(term))
      );
    }

    // Filtre par sentiment
    if (filterSentiment !== 'all') {
      result = result.filter(note =>
        note.sentiment?.label === filterSentiment
      );
    }

    // Tri
    result.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'sentiment':
          return (b.sentiment?.score || 0) - (a.sentiment?.score || 0);
        case 'updatedAt':
        default:
          return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
    });

    setFilteredNotes(result);
  }, [notes, searchTerm, filterSentiment, sortBy]);

  // Gestion des actions
  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      try {
        await notesApi.deleteNote(id);
        setNotes(notes.filter(note => note._id !== id));
      } catch (err) {
        console.error('Erreur suppression:', err);
        setError('Erreur lors de la suppression');
      }
    }
  };

  const handleView = (id) => {
    navigate(`/note/${id}`);
  };

  const handleProcessAllNLP = async () => {
    if (window.confirm('Traiter le NLP pour toutes les notes ? Cela peut prendre du temps.')) {
      try {
        setProcessingNLP(true);
        const response = await notesApi.processAllNotesNLP();
        console.log('NLP traité:', response.data);
        await fetchNotes(); // Recharger les notes
        alert(`NLP traité avec succès ! ${response.data.success}/${response.data.total} notes mises à jour.`);
      } catch (err) {
        console.error('Erreur NLP:', err);
        setError('Erreur lors du traitement NLP');
      } finally {
        setProcessingNLP(false);
      }
    }
  };

  // Statistiques
  const stats = {
    total: notes.length,
    positive: notes.filter(n => n.sentiment?.label === 'positive').length,
    neutral: notes.filter(n => n.sentiment?.label === 'neutral').length,
    negative: notes.filter(n => n.sentiment?.label === 'negative').length,
    noNLP: notes.filter(n => !n.sentiment?.label).length,
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📝 Smart Notes
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Gérer et analyser vos notes intelligemment
        </Typography>
      </Box>

      {/* Statistiques */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">{stats.positive}</Typography>
              <Typography variant="body2" color="text.secondary">Positives</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="warning.main">{stats.neutral}</Typography>
              <Typography variant="body2" color="text.secondary">Neutres</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h6" color="error.main">{stats.negative}</Typography>
              <Typography variant="body2" color="text.secondary">Négatives</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Barre d'actions */}
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
          startIcon={<Psychology />}
          onClick={handleProcessAllNLP}
          disabled={processingNLP}
        >
          {processingNLP ? <CircularProgress size={20} /> : 'Traiter tout le NLP'}
        </Button>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchNotes}
          disabled={loading}
        >
          Actualiser
        </Button>
      </Box>

      {/* Filtres et recherche */}
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
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
          
          <Grid item xs={6} md={3}>
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

          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Trier par</InputLabel>
              <Select
                value={sortBy}
                label="Trier par"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="updatedAt">Date de modification</MenuItem>
                <MenuItem value="createdAt">Date de création</MenuItem>
                <MenuItem value="title">Titre (A-Z)</MenuItem>
                <MenuItem value="sentiment">Sentiment</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box display="flex" justifyContent="flex-end">
              <Chip
                label={`${filteredNotes.length} notes`}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Message d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Liste des notes */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : filteredNotes.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {notes.length === 0 ? 'Aucune note trouvée' : 'Aucune note ne correspond aux critères'}
          </Typography>
          {notes.length === 0 && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/create')}
              sx={{ mt: 2 }}
            >
              Créer ma première note
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredNotes.map((note) => (
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