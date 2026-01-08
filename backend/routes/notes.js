const express = require("express");
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  processAllNotesNLP,    // Import des nouvelles fonctions
  processNoteNLP
} = require("../controllers/notesController");

const { validateNote, validateNoteUpdate } = require("../middleware/validation");

const router = express.Router();

// Routes existantes
router.post("/", validateNote, createNote);
router.get("/", getNotes);
router.get("/:id", getNoteById);
router.put("/:id", validateNoteUpdate, updateNote);
router.delete("/:id", deleteNote);

// NOUVELLES ROUTES pour le NLP sur les notes existantes
router.post("/:id/process-nlp", processNoteNLP);      // Traiter une note spécifique
router.post("/actions/process-all-nlp", processAllNotesNLP); // Traiter toutes les notes

module.exports = router;