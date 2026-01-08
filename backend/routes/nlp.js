const express = require("express");
const { 
    summarizeText, 
    extractKeywordsRoute, 
    analyzeSentiment,
    testSentiment  
} = require("../controllers/nlpController.js");

const { validateNLPText } = require("../middleware/validation");

const router = express.Router();

router.post("/summarize", validateNLPText, summarizeText);
router.post("/keywords", validateNLPText, extractKeywordsRoute);
router.post("/sentiment", validateNLPText, analyzeSentiment);

module.exports = router;