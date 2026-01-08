// test-sentiment-fr.js
const SentimentAnalyzer = require('./nlp/sentimentAnalyzer');
const analyzer = new SentimentAnalyzer();

const testPhrases = [
  // Positives fortes
  "Je suis absolument ravi de ce produit exceptionnel ! La qualité est incroyable.",
  "C'est génial, fantastique, merveilleux ! Tout fonctionne parfaitement.",
  "Service client excellent, très réactif et sympathique.",
  "Je recommande vivement, c'est du tout bon !",
  
  // Positives modérées
  "C'est plutôt bien, je suis satisfait.",
  "Le produit est correct, il fait ce qu'on attend de lui.",
  "Pas mal du tout, ça correspond à mes attentes.",
  
  // Négatives fortes
  "Je suis extrêmement déçu, c'est une catastrophe totale !",
  "Horrible, nul, à éviter absolument. Le pire achat de ma vie.",
  "Service client désastreux, inefficace et désagréable.",
  
  // Négatives modérées
  "Je suis un peu déçu, ce n'est pas terrible.",
  "Bof, pas convaincu, ça laisse à désirer.",
  "Moyen, rien d'extraordinaire.",
  
  // Neutres
  "La réunion s'est tenue à 14h. Les points ont été abordés.",
  "Le document contient trois parties principales.",
  "Pour installer le logiciel, suivez les instructions."
];

console.log("🧪 TEST COMPLET sentiment-fr 🧪\n");
console.log("=" .repeat(60));

analyzer.testPhrases(testPhrases);

// Tester une phrase spécifique
console.log("\n🔍 Test personnalisé :");
const customText = "Ce restaurant est incroyablement bon ! La nourriture est sublime et le service impeccable.";
const result = analyzer.analyze(customText);
console.log(`Phrase: "${customText}"`);
console.log(`Résultat: ${result.label.toUpperCase()} (score: ${result.rawScore})`);
console.log(`Mots détectés: ${result.positive.join(', ')}`);