#  Smart Notes

**Application intelligente de prise de notes avec analyse de sentiment et assistance IA**

---

##  Description

**Smart Notes** est une application web full-stack permettant de créer, analyser et organiser des notes intelligentes.
Elle intègre des fonctionnalités de **traitement du langage naturel (NLP)** telles que :

*  Création et gestion de notes
*  Analyse de sentiment automatique (positif / négatif / neutre)
*  Assistance IA pour la génération et la reformulation de contenu
*  Données exploitables pour la visualisation (Power BI, dashboards)

Le projet est basé sur une architecture **MERN** :
**MongoDB – Express – React – Node.js**.

---

## Architecture du projet

```
smart-notes/
├── backend/        # API Node.js / Express / NLP
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── nlp/
│   ├── models/
│   └── server.js
│
├── frontend/       # Application React (Vite)
│   ├── src/
│   ├── components/
│   ├── services/
│   └── pages/
│
├── .gitignore
└── README.md
```

---

## Technologies utilisées

### Backend

* Node.js
* Express.js
* MongoDB + Mongoose
* Joi (validation)
* NLP (analyse de sentiment en français)
* Axios

### Frontend

* React.js
* Vite
* TypeScript
* Tailwind CSS
* Axios

### Data / IA

* Analyse de sentiment (lexique + règles)
* Génération de contenu assistée par IA
* Données prêtes pour visualisation Power BI

---

## Fonctionnalités principales

### Notes

* Création, modification et suppression de notes
* Validation robuste côté backend
* Résumé automatique (optionnel)

### Analyse de sentiment

* Classification : `positive`, `negative`, `neutral`
* Score normalisé entre `0` et `1`
* Lexique personnalisé (français)

### Assistance IA

* Génération de contenu
* Reformulation / amélioration de texte
* Suggestions contextuelles


---

## Variables d’environnement

Créer un fichier `.env` dans `backend/` :

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/smart_notes
```

Un fichier `.env.example` est fourni.

---

##  Lancer le projet en local

### 1️ Backend

```bash
cd backend
npm install
npm run dev
```

Backend lancé sur :

```
http://localhost:4000
```

---

### 2 Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend accessible sur :

```
http://localhost:5173
```

---

## API principales

### Créer une note

```
POST /api/notes
```

```json
{
  "title": "Ma journée",
  "content": "Une journée vraiment stressante mais productive"
}
```

---

### Analyse de sentiment

```
POST /api/nlp/sentiment
```

```json
{
  "text": "Cette application est vraiment géniale"
}
```

---

##  Utilisation avec Power BI (optionnel)

Les données des notes peuvent être :

* Exportées en JSON / CSV
* Connectées via API REST
* Analysées pour :

  * tendances émotionnelles
  * comportements utilisateurs
  * qualité du contenu

---

##  Validation & Qualité

* Validation backend avec **Joi**
* Gestion centralisée des erreurs
* Messages explicites côté front
* ESLint + TypeScript

---

##  Auteur

**Binta Ball**
Étudiante en Génie Informatique – Data Science & IA

---