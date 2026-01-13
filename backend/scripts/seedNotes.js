// scripts/addFinalNotes.js - Ajoute 10 négatives + 30 positives SANS supprimer
require('dotenv').config();

// 🔗 Connexion MongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartnotes')
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ Erreur MongoDB:", err));

// 📘 Import du modèle
const Note = require('../models/Note');

// 🧠 Données de base
const users = ['alice', 'bob', 'charlie', 'diana', 'emma', 'frank', 'grace', 'henry', 'isabella', 'jack'];

// Contenu PUR pour les notes POSITIVES (30 exemples)
const purePositiveContent = [
  "C'était absolument fantastique ! Une journée extraordinaire remplie de joie et de succès. Tout s'est parfaitement déroulé, bien au-delà de mes attentes les plus optimistes. Je suis aux anges !",
  "Exceptionnel, remarquable, incroyable ! Cette expérience a dépassé toutes mes espérances. Un moment de pur bonheur et d'émerveillement total. Je me sens béni et reconnaissant.",
  "Succès total et triomphant ! La victoire est complète et éclatante. Chaque détail était parfait, chaque moment magique. Une réalisation dont je serai toujours fier.",
  "Merveilleux, sublime, divin ! Une perfection rare atteinte aujourd'hui. L'harmonie était totale, la beauté absolue. Un souvenir précieux gravé à jamais.",
  "Brillant, éclatant, radieux ! Tout rayonne de positivité et de lumière. Les résultats sont spectaculaires, les retours enthousiastes. Un jour glorieux !",
  "Extraordinaire réussite ! Tout a fonctionné à la perfection. Les félicitations pleuvent de toutes parts. Je me sens invincible et comblé.",
  "Excellence absolue ! La qualité était impeccable, le service irréprochable. Une expérience qui redéfinit la notion de perfection. Tout simplement parfait !",
  "Splendide et magnifique ! Chaque instant était un délice, chaque rencontre une bénédiction. La journée s'est déroulée comme dans un rêve éveillé.",
  "Triomphe complet ! Les objectifs non seulement atteints mais dépassés avec brio. La reconnaissance est unanime et méritée. Victoire éclatante !",
  "Féerique et enchanteur ! L'atmosphère était magique, les émotions intenses et pures. Un moment de grâce et de bonheur parfait.",
  "Succès retentissant ! Les applaudissements ont duré plusieurs minutes. L'admiration dans les yeux de tous était palpable. Un accomplissement monumental.",
  "Paradis terrestre ! Tout était idéal, du début à la fin. La satisfaction est totale, le contentement absolu. Un jour parfait en tous points.",
  "Victoire écrasante ! La compétition a été brillamment dominée. La supériorité était évidente et incontestable. Champion incontesté !",
  "Éblouissant et saisissant ! La beauté du moment m'a coupé le souffle. Une expérience qui marque une vie entière. Inoubliable et précieux.",
  "Réussite éclatante ! Chaque défi a été relevé avec maestria. Les obstacles sont devenus des tremplins vers le succès. Formidable !",
  "Harmonie parfaite ! Tous les éléments se sont accordés avec une précision miraculeuse. L'équilibre était idéal, la symbiose totale.",
  "Glorieux et majestueux ! La grandeur du moment était impressionnante. Une réalisation qui restera dans les annales. Historique !",
  "Radieux de bonheur ! Le sourire ne quitte pas mon visage depuis ce matin. Une joie profonde et durable m'habite complètement.",
  "Suprême et ultime ! Le summum de la qualité et de l'excellence. Rien ne pourrait être amélioré, c'est l'apogée du succès.",
  "Miraculeux et providentiel ! Comme si le destin lui-même conspirait pour mon bonheur. Une chance incroyable et des résultats prodigieux.",
  "Épanouissement total ! Je me sens accompli et réalisé dans tous les aspects de ma vie. Un sentiment de plénitude absolue.",
  "Inspirant et motivant ! Cette expérience m'a donné des ailes et renforcé ma confiance en moi. Je me sens capable de tout.",
  "Généreux et bienveillant ! L'altruisme et la gentillesse rencontrés aujourd'hui ont restauré ma foi en l'humanité.",
  "Éclatant de vitalité ! Une énergie débordante et un enthousiasme contagieux caractérisent cette journée mémorable.",
  "Serein et paisible ! Un calme intérieur profond s'est installé, apportant clarté d'esprit et sérénité.",
  "Créatif et innovant ! Les idées ont fusé, les solutions sont apparues avec une facilité déconcertante.",
  "Connecté et uni ! Un sentiment profond de connexion avec les autres et avec le monde qui m'entoure.",
  "Reconnaissant et humble ! La gratitude que je ressens est immense face à ces moments de grâce.",
  "Optimiste et confiant ! L'avenir semble radieux et plein de promesses merveilleuses.",
  "Équilibre parfait ! Tous les aspects de ma vie sont en harmonie, créant un bien-être global exceptionnel."
];

// Contenu PUR pour les notes NÉGATIVES (10 exemples)
const pureNegativeContent = [
  "Catastrophique, désastreux, épouvantable ! Une journée absolument exécrable qui restera comme un cauchemar vivant. Tout a été horrible de A à Z.",
  "Désolation totale et amertume profonde. Chaque moment était une souffrance, chaque instant une torture. Une expérience atroce et traumatisante.",
  "Fiasco complet et humiliation totale. L'échec est cuisant, la défaite amère. Une honte qui me poursuivra longtemps.",
  "Horreur indicible et terreur absolue. La pire expérience imaginable, pire que toutes mes craintes réunies. Un enfer sur terre.",
  "Déception monumentale et frustration immense. Les promesses étaient vaines, les espoirs trahis. Un gâchis total et définitif.",
  "Calvaire interminable et supplice constant. Rien n'a fonctionné, tout s'est effondré. Une débâcle sans précédent.",
  "Abomination et scandale ! L'incompétence était flagrante, la malhonnêteté évidente. Une escroquerie éhontée.",
  "Désespoir noir et pessimisme total. Plus aucune lueur d'espoir, que des ténèbres et de la tristesse. Un vide abyssal.",
  "Naufrage et débâcle ! Tout a coulé, tout est perdu. Les dégâts sont irréparables, les conséquences désastreuses.",
  "Cauchemar éveillé et terreur permanente. La peur m'habite, l'angoisse me ronge. Une situation intenable et insoutenable."
];

// 🎯 Fonctions utilitaires
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePurePositiveSentiment() {
  const score = 0.90 + (Math.random() * 0.10); // 0.90-1.00
  const rawScore = 10 + (Math.random() * 5); // 10-15
  
  return { 
    label: "positive", 
    score: Number(score.toFixed(3)),
    comparative: 0.25 + (Math.random() * 0.10), // 0.25-0.35
    rawScore: Number(rawScore.toFixed(1)),
    positive: ['fantastique', 'extraordinaire', 'parfait', 'succès', 'exceptionnel', 'heureux', 'génial', 'merveilleux', 'incroyable', 'formidable'],
    negative: []
  };
}

function generatePureNegativeSentiment() {
  const score = Math.random() * 0.10; // 0.00-0.10
  const rawScore = -10 - (Math.random() * 5); // -10 à -15
  
  return { 
    label: "negative", 
    score: Number(score.toFixed(3)),
    comparative: -0.25 - (Math.random() * 0.10), // -0.25 à -0.35
    rawScore: Number(rawScore.toFixed(1)),
    positive: [],
    negative: ['catastrophique', 'désastreux', 'épouvantable', 'échec', 'horrible', 'triste', 'terrible', 'lamentable', 'atroce', 'insupportable']
  };
}

function generateKeywords(content) {
  const words = content.toLowerCase()
    .replace(/[^\w\sàâäéèêëîïôöùûüç]/gi, ' ')
    .split(/\s+/);
  
  const stopwords = new Set(['je', 'de', 'la', 'le', 'et', 'à', 'pour', 'dans', 'avec', 'des', 'les', 'un', 'une', 'est', 'son', 'ses', 'qui', 'que', 'dont', 'par', 'sur', 'sous']);
  
  const keywords = words
    .filter(word => word.length > 4 && !stopwords.has(word))
    .slice(0, 8);
  
  return [...new Set(keywords)];
}

function generateSummary(content) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return '';
  
  const summary = sentences[0];
  return summary.length > 120 ? summary.substring(0, 117) + '...' : summary + '.';
}

// 🚀 Fonction principale
async function addFinalNotes() {
  try {
    console.log("🚀 AJOUT DE 10 NÉGATIVES + 30 POSITIVES");
    console.log("========================================\n");
    
    // 1. Vérifier l'état actuel de la base
    console.log("📊 ANALYSE DE LA BASE ACTUELLE...");
    const existingCount = await Note.countDocuments();
    
    if (existingCount === 0) {
      console.log("   ℹ️  La base est actuellement vide");
    } else {
      const stats = await Note.aggregate([
        {
          $group: {
            _id: '$sentiment.label',
            count: { $sum: 1 },
            avgScore: { $avg: '$sentiment.score' },
            minScore: { $min: '$sentiment.score' },
            maxScore: { $max: '$sentiment.score' }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      console.log(`   📚 Total notes existantes: ${existingCount}`);
      stats.forEach(stat => {
        const emoji = stat._id === 'positive' ? '💖' : stat._id === 'negative' ? '💀' : '📊';
        const label = stat._id === 'positive' ? 'POSITIVES' : stat._id === 'negative' ? 'NÉGATIVES' : 'NEUTRES';
        console.log(`   ${emoji} ${label}: ${stat.count} notes (score: ${stat.avgScore.toFixed(2)})`);
      });
    }
    
    console.log("\n✨ GÉNÉRATION DES NOUVELLES NOTES...");
    console.log("   • 30 notes POSITIVES pures 💖💖💖");
    console.log("   • 10 notes NÉGATIVES pures 💀");
    console.log("   • Total: 40 nouvelles notes\n");
    
    const notes = [];
    const startDate = new Date('2024-06-15'); // Dates très récentes
    const endDate = new Date();
    
    // Générer 30 notes POSITIVES pures
    console.log("💖💖💖 CRÉATION DES 30 NOTES POSITIVES...");
    for (let i = 0; i < 30; i++) {
      const contentIndex = i % purePositiveContent.length;
      const content = purePositiveContent[contentIndex];
      const sentiment = generatePurePositiveSentiment();
      const keywords = generateKeywords(content);
      const summary = generateSummary(content);
      const user = randomItem(users);
      const createdAt = randomDate(startDate, endDate);
      const updatedAt = randomDate(createdAt, endDate);

      notes.push({
        title: `[FINAL] Positive ${i + 1} - 💖 SCORE:${sentiment.score}`,
        content,
        summary: summary || "Expérience extraordinairement positive",
        keywords,
        sentiment,
        user,
        createdAt,
        updatedAt
      });

      if ((i + 1) % 6 === 0) {
        console.log(`   ✅ ${i + 1}/30 notes positives créées`);
      }
    }
    
    console.log("\n💀 CRÉATION DES 10 NOTES NÉGATIVES...");
    for (let i = 0; i < 10; i++) {
      const contentIndex = i % pureNegativeContent.length;
      const content = pureNegativeContent[contentIndex];
      const sentiment = generatePureNegativeSentiment();
      const keywords = generateKeywords(content);
      const summary = generateSummary(content);
      const user = randomItem(users);
      const createdAt = randomDate(startDate, endDate);
      const updatedAt = randomDate(createdAt, endDate);

      notes.push({
        title: `[FINAL] Negative ${i + 1} - 💀 SCORE:${sentiment.score}`,
        content,
        summary: summary || "Expérience extrêmement négative",
        keywords,
        sentiment,
        user,
        createdAt,
        updatedAt
      });

      if ((i + 1) % 2 === 0) {
        console.log(`   ✅ ${i + 1}/10 notes négatives créées`);
      }
    }
    
    // 3. Insérer les nouvelles notes
    console.log("\n📤 INSERTION DANS LA BASE DE DONNÉES...");
    const result = await Note.insertMany(notes);
    console.log(`✅ ${result.length} nouvelles notes ajoutées avec succès`);
    
    // 4. Statistiques finales
    console.log("\n📊 STATISTIQUES FINALES DÉTAILLÉES");
    console.log("══════════════════════════════════════════════════════");
    
    const finalStats = await Note.aggregate([
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' },
          minScore: { $min: '$sentiment.score' },
          maxScore: { $max: '$sentiment.score' },
          avgRawScore: { $avg: '$sentiment.rawScore' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const totalFinal = await Note.countDocuments();
    
    console.log(`📚 TOTAL GLOBAL: ${totalFinal} notes dans la base`);
    console.log(`📈 NOUVELLES NOTES: 40 ajoutées (30💖 + 10💀)`);
    console.log(`📉 ANCIENNES NOTES: ${existingCount} conservées\n`);
    
    finalStats.forEach(stat => {
      const emoji = stat._id === 'positive' ? '💖' : stat._id === 'negative' ? '💀' : '📊';
      const label = stat._id === 'positive' ? 'POSITIVES' : stat._id === 'negative' ? 'NÉGATIVES' : 'NEUTRES';
      console.log(`${emoji} ${label}:`);
      console.log(`   • Nombre: ${stat.count} notes`);
      console.log(`   • Score: ${stat.avgScore.toFixed(3)}`);
      console.log(`   • Fourchette: ${stat.minScore.toFixed(3)} - ${stat.maxScore.toFixed(3)}`);
      console.log(`   • Score brut: ${stat.avgRawScore.toFixed(1)}`);
    });
    
    console.log("══════════════════════════════════════════════════════");
    
    // 5. Vérification des scores extrêmes
    console.log("\n🔍 VÉRIFICATION DES SCORES EXTRÊMES:");
    
    const highestPositive = await Note.findOne({ 'sentiment.label': 'positive' })
      .sort({ 'sentiment.score': -1 })
      .limit(1);
    
    const lowestNegative = await Note.findOne({ 'sentiment.label': 'negative' })
      .sort({ 'sentiment.score': 1 })
      .limit(1);
    
    if (highestPositive) {
      console.log(`\n💖 NOTE LA PLUS POSITIVE:`);
      console.log(`   Titre: ${highestPositive.title}`);
      console.log(`   Score: ${highestPositive.sentiment.score}`);
      console.log(`   Utilisateur: ${highestPositive.user}`);
    }
    
    if (lowestNegative) {
      console.log(`\n💀 NOTE LA PLUS NÉGATIVE:`);
      console.log(`   Titre: ${lowestNegative.title}`);
      console.log(`   Score: ${lowestNegative.sentiment.score}`);
      console.log(`   Utilisateur: ${lowestNegative.user}`);
    }
    
    // 6. Distribution des nouveaux sentiments
    console.log("\n📈 DISTRIBUTION DES NOUVEAUX SENTIMENTS:");
    
    const newPositives = await Note.countDocuments({ 
      'sentiment.label': 'positive',
      title: { $regex: '\\[FINAL\\]', $options: 'i' }
    });
    
    const newNegatives = await Note.countDocuments({ 
      'sentiment.label': 'negative',
      title: { $regex: '\\[FINAL\\]', $options: 'i' }
    });
    
    console.log(`   💖 Nouvelles positives: ${newPositives} notes`);
    console.log(`   💀 Nouvelles négatives: ${newNegatives} notes`);
    console.log(`   📊 Ratio: ${(newPositives/(newPositives+newNegatives)*100).toFixed(0)}% positives`);
    
    console.log("\n🎉 OPÉRATION TERMINÉE AVEC SUCCÈS !");
    console.log("\n💡 RÉCAPITULATIF:");
    console.log("   • Anciennes notes: CONSERVÉES ✓");
    console.log("   • Nouvelles positives: 30 ajoutées 💖");
    console.log("   • Nouvelles négatives: 10 ajoutées 💀");
    console.log("   • Scores positifs: 0.90-1.00 ✓");
    console.log("   • Scores négatifs: 0.00-0.10 ✓");
    console.log("\n🔗 Testez votre analyseur avec ces notes extrêmes !");
    
    mongoose.connection.close();
    console.log("\n🔌 Connexion MongoDB fermée");
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ ERREUR lors de l'ajout des notes:", error.message);
    if (error.code === 11000) {
      console.error("   ℹ️  Certaines notes existent déjà");
    }
    mongoose.connection.close();
    process.exit(1);
  }
}

// Gestion propre des interruptions
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Arrêt demandé par l\'utilisateur');
  mongoose.connection.close();
  process.exit(0);
});

// Exécuter le script
addFinalNotes();