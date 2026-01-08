import React, { useState } from 'react';
import { Container, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NoteForm from '../components/NoteForm';
import { notesApi } from '../services/api';

const CreateNotePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (noteData) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await notesApi.createNote(noteData);
      
      // Rediriger vers la page de détail
     navigate(`/note/${response.data.data._id}`);

      
    } catch (err) {
      console.error('Erreur création note:', err);
      setError(err.response?.data?.error || 'Erreur lors de la création de la note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Créer une nouvelle note
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Remplissez les champs ci-dessous. Utilisez les boutons d'analyse pour enrichir automatiquement votre note.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <NoteForm
        onSubmit={handleSubmit}
        isLoading={loading}
      />
    </Container>
  );
};

export default CreateNotePage;