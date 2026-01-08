import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import NoteForm from '../components/NoteForm';
import { notesApi } from '../services/api';

const EditNotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Charger la note à éditer
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
      setError('Impossible de charger la note pour édition');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (noteData) => {
    try {
      setUpdating(true);
      setError('');
      
      const response = await notesApi.updateNote(id, noteData);
      
      // Rediriger vers la page de détail
     navigate(`/note/${response.data.data._id}`);

      
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Modifier la note
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Modifiez les champs ci-dessous et cliquez sur "Mettre à jour".
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <NoteForm
        initialData={note}
        onSubmit={handleSubmit}
        isLoading={updating}
      />
    </Container>
  );
};

// Pour éviter les erreurs de route, on peut créer ce composant aussi
const EditNotePageWrapper = () => <EditNotePage />;
export default EditNotePageWrapper;