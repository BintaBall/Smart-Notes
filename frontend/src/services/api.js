// src/ervices/api.js
import axios from 'axios';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour logger les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Notes API
export const notesApi = {
  // Récupérer toutes les notes
  getAllNotes: () => api.get('/notes'),
  
  // Récupérer une note par ID
  getNoteById: (id) => api.get(`/notes/${id}`),
  
  // Créer une note
  createNote: (noteData) => api.post('/notes', noteData),
  
  // Mettre à jour une note
  updateNote: (id, noteData) => api.put(`/notes/${id}`, noteData),
  
  // Supprimer une note
  deleteNote: (id) => api.delete(`/notes/${id}`),
  
  // Traiter le NLP d'une note
  processNoteNLP: (id) => api.post(`/notes/${id}/process-nlp`),
  
  // Traiter le NLP de toutes les notes
  processAllNotesNLP: () => api.post('/notes/actions/process-all-nlp'),
};

// NLP API (direct)
export const nlpApi = {
  summarize: (text) => api.post('/nlp/summarize', { text }),
  keywords: (text) => api.post('/nlp/keywords', { text }),
  sentiment: (text) => api.post('/nlp/sentiment', { text }),
};

// AI Service - Correction des endpoints
export const aiApi = {
  getSuggestions: (data) => api.post('/ai/suggestions', data),
  generateContent: (data) => api.post('/ai/generate', data),
  suggestTitles: (data) => api.post('/ai/titles', data),
  generateChecklist: (data) => api.post('/ai/checklist', data),
  getImprovements: (data) => api.post('/ai/improvements', data),
  test: () => api.get('/ai/test')
};
export default api;