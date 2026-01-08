// nlp/keyword.js
function extractKeywordsSimple(text, maxKeywords = 10) {
  if (!text || typeof text !== "string") return [];

  // Nettoyer le texte
  const cleaned = text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(word => word.length > 0);

  // Stopwords français
  const stopwords = new Set([
    // Articles et déterminants
    "le", "la", "les", "l", "un", "une", "des", "du", "de", "d", "ce", "cet", "cette", "ces",
    
    // Pronoms
    "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
    "me", "te", "se", "nous", "vous", "le", "la", "les", "lui", "leur",
    "y", "en", "ça", "cela", "ceci", "celui", "celle",
    
    // Prépositions
    "à", "au", "aux", "avec", "chez", "contre", "dans", "de", "depuis",
    "derrière", "devant", "durant", "en", "entre", "hors", "jusque", 
    "malgré", "par", "parmi", "pendant", "pour", "sans", "sauf", 
    "selon", "sous", "sur", "vers", "via", "dès", "avant", "après",
    
    // Conjonctions
    "et", "ou", "où", "que", "qui", "quoi", "dont", "car", "comme",
    "lorsque", "puisque", "quand", "si", "soit", "tant", "tandis",
    
    // Adverbes
    "ne", "pas", "plus", "très", "trop", "peu", "bien", "mal", 
    "toujours", "jamais", "souvent", "vite", "ici", "là", "alors",
    "aussi", "encore", "donc", "cependant", "pourtant", "toutefois",
    "presque", "déjà", "enfin", "ainsi", "pourtant",
    
    // Verbes auxiliaires et courants
    "est", "sont", "était", "étaient", "être", "avoir", "a", "as", 
    "avait", "avaient", "ai", "avons", "avez", "ont",
    "fait", "faire", "dis", "dit", "dire", "vois", "voir", "vu",
    "peut", "doit", "veut", "vouloir", "aller", "va", "vont",
    
    // Autres mots courants
    "c", "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
    "notre", "nos", "votre", "vos", "leur", "leurs",
    "aucun", "aucune", "certain", "certaine", "chaque",
    "différents", "différentes", "tout", "tous", "toute", "toutes",
    "même", "autres", "tel", "telle", "premier", "première"
  ]);

  // Compter les fréquences avec poids
  const freq = {};
  const seenPairs = new Set();
  
  // N-grams (mots composés)
  for (let i = 0; i < words.length - 1; i++) {
    const pair = `${words[i]} ${words[i + 1]}`;
    const cleanPair = pair.replace(/[^a-z\s]/g, '');
    
    // Vérifier si les deux mots ne sont pas des stopwords
    if (!stopwords.has(words[i]) && !stopwords.has(words[i + 1]) &&
        words[i].length > 2 && words[i + 1].length > 2) {
      
      // Donner plus de poids aux paires de mots
      freq[cleanPair] = (freq[cleanPair] || 0) + 3;
      seenPairs.add(cleanPair);
    }
  }

  // Mots simples
  words.forEach(w => {
    // Ignorer les mots trop courts (sauf acronymes)
    if (w.length < 3 && !w.match(/^[A-Z]{2,}$/)) return;
    
    // Ignorer les stopwords
    if (stopwords.has(w)) return;
    
    // Ignorer les nombres seuls
    if (/^\d+$/.test(w)) return;
    
    // Éviter les mots déjà dans des paires
    let inPair = false;
    for (const pair of seenPairs) {
      if (pair.includes(w)) {
        inPair = true;
        break;
      }
    }
    
    if (!inPair) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  // Trier par score et prendre les meilleurs
  return Object.entries(freq)
    .sort((a, b) => {
      // Trier d'abord par score, puis par longueur (préférer les phrases)
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0].length - a[0].length;
    })
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

module.exports = { extractKeywordsSimple };