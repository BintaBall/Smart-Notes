import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit,
  Delete,
  ArrowBack,
  AccessTime,
  Tag,
  Psychology,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SentimentIcon from '../components/SentimentIcon';
import { notesApi } from '../services/api';

const NoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [processingNLP, setProcessingNLP] = useState(false);

  // Charger la note
  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await notesApi.getNoteById(id);
      setNote(response.data);
      setError('');
    } catch (err) {
      console.error('Erreur chargement note:', err);
      setError('Impossible de charger la note. Elle a peut-être été supprimée.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch {
      return 'Date inconnue';
    }
  };

  const handleProcessNLP = async () => {
    try {
      setProcessingNLP(true);
      await notesApi.processNoteNLP(id);
      await fetchNote(); // Recharger la note
    } catch (err) {
      console.error('Erreur NLP:', err);
      setError('Erreur lors du traitement NLP');
    } finally {
      setProcessingNLP(false);
    }
  };

  const handleDelete = async () => {
    try {
      await notesApi.deleteNote(id);
      navigate('/');
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !note) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Note non trouvée'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
        >
          Retour à l'accueil
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Boutons d'action */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
          >
            Retour
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Psychology />}
              onClick={handleProcessNLP}
              disabled={processingNLP}
            >
              {processingNLP ? <CircularProgress size={20} /> : 'Analyser NLP'}
            </Button>
            
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate(`/edit/${id}`)}
            >
              Modifier
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialog(true)}
            >
              Supprimer
            </Button>
          </Box>
        </Box>

        {/* Carte de la note */}
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {/* En-tête */}
          <Box sx={{ mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="h4" component="h1" gutterBottom>
                {note.title}
              </Typography>
              <SentimentIcon sentiment={note.sentiment} size="large" />
            </Box>

            {/* Date */}
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Créée le {formatDate(note.createdAt)} • 
                Dernière modification le {formatDate(note.updatedAt)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Résumé */}
          {note.summary && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Résumé
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Typography variant="body1">
                  {note.summary}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Sentiment */}
          {note.sentiment && note.sentiment.label && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Analyse de sentiment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <SentimentIcon sentiment={note.sentiment} size="large" />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {note.sentiment.label.charAt(0).toUpperCase() + note.sentiment.label.slice(1)}
                  </Typography>
                  {note.sentiment.score !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      Score: {Math.round(note.sentiment.score * 100)}%
                      {note.sentiment.comparative && ` (${note.sentiment.comparative.toFixed(4)})`}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* Mots-clés */}
          {note.keywords && note.keywords.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Mots-clés
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {note.keywords.map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    variant="outlined"
                    icon={<Tag fontSize="small" />}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Contenu complet */}
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              Contenu complet
            </Typography>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {note.content}
              </Typography>
            </Paper>
          </Box>
        </Paper>
      </Container>

      {/* Dialog de confirmation suppression */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la note "{note.title}" ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NoteDetailPage;