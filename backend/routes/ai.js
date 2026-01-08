// routes/ai.js
const express = require("express");
const AIController = require("../controllers/aiController");

const router = express.Router();

// Routes AI
router.post("/suggestions", AIController.getSuggestions);
router.post("/generate", AIController.generateContent);
router.post("/titles", AIController.suggestTitles);
router.post("/checklist", AIController.generateChecklist);
router.post("/improvements", AIController.getImprovements);
router.get("/test", AIController.test);

module.exports = router;