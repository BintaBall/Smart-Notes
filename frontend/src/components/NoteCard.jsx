import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Box,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
  AccessTime,
  Tag,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import SentimentIcon from './SentimentIcon';

const NoteCard = ({ note, onEdit, onDelete, onView }) => {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
    } catch {
      return 'Date inconnue';
    }
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleDeleteClick = () => {
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete(note._id);
    setDeleteDialog(false);
  };

  // Couleur basée sur le sentiment
  const getSentimentColor = () => {
    switch (note.sentiment?.label) {
      case 'positive':
        return '#e8f5e9'; // vert très clair
      case 'negative':
        return '#ffebee'; // rouge très clair
      default:
        return '#f5f5f5'; // gris clair
    }
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 2, 
          borderRadius: 2,
          backgroundColor: getSentimentColor(),
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          }
        }}
      >
        <CardContent>
          {/* En-tête avec titre et sentiment */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {note.title}
            </Typography>
            <SentimentIcon sentiment={note.sentiment} size="large" />
          </Box>

          {/* Résumé */}
          {note.summary && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {note.summary}
            </Typography>
          )}

          {/* Contenu (repliable) */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {note.content}
            </Typography>
          </Collapse>

          {/* Mots-clés */}
          {note.keywords && note.keywords.length > 0 && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <Tag fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Mots-clés:
                </Typography>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {note.keywords.slice(0, 5).map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    size="small"
                    variant="outlined"
                  />
                ))}
                {note.keywords.length > 5 && (
                  <Chip
                    label={`+${note.keywords.length - 5}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Date et métadonnées */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {formatDate(note.updatedAt)}
              </Typography>
            </Box>
            
            <IconButton
              size="small"
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Box>
            <Button
              size="small"
              onClick={() => onView(note._id)}
              sx={{ mr: 1 }}
            >
              Voir détails
            </Button>
          </Box>
          <Box>
            <IconButton
              size="small"
              onClick={() => onEdit(note._id)}
              color="primary"
              aria-label="modifier"
            >
              <Edit />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleDeleteClick}
              color="error"
              aria-label="supprimer"
            >
              <Delete />
            </IconButton>
          </Box>
        </CardActions>
      </Card>

      {/* Dialog de confirmation pour la suppression */}
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
          <Button onClick={confirmDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NoteCard;