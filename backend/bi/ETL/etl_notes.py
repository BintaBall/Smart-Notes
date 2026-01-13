import pandas as pd
import numpy as np
import logging
from sqlalchemy import create_engine, text
import traceback

# ===============================
# CONFIGURATION LOGS
# ===============================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# ===============================
# CONFIGURATION - MODIFIEZ CES VALEURS
# ===============================
CSV_PATH = "data/smartnotes.notes.csv"
# Votre mot de passe PostgreSQL (celui que vous utilisez dans pgAdmin)
POSTGRES_URI = "postgresql://postgres:54321@localhost:5432/smartnotes_dw"

# ===============================
# FONCTION POUR GÉRER L'ENCODAGE
# ===============================
def safe_str_conversion(value):
    """Convertit une valeur en string UTF-8 safe"""
    if pd.isna(value):
        return ""
    try:
        return str(value).encode('utf-8', 'ignore').decode('utf-8')
    except:
        return str(value)

def clean_dataframe(df):
    """Nettoie un DataFrame pour l'encodage UTF-8"""
    for col in df.columns:
        if df[col].dtype == 'object':
            df[col] = df[col].apply(safe_str_conversion)
    return df

# ===============================
# EXTRACTION
# ===============================
def extract_data():
    logging.info("Début de l'extraction des données...")
    try:
        # Essayer différents encodages
        try:
            df = pd.read_csv(CSV_PATH, encoding='utf-8')
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(CSV_PATH, encoding='latin-1')
            except:
                df = pd.read_csv(CSV_PATH, encoding='ISO-8859-1')
        
        logging.info(f"✅ Données extraites : {df.shape[0]} lignes, {df.shape[1]} colonnes")
        return df
    except Exception as e:
        logging.error(f"❌ Erreur d'extraction : {e}")
        raise

# ===============================
# TRANSFORMATION
# ===============================
def transform_data(df):
    logging.info("Début des transformations...")
    
    # Nettoyage des noms de colonnes
    df.columns = df.columns.str.replace('.', '_', regex=False).str.lower()
    
    # Conversion des dates
    df['createdat'] = pd.to_datetime(df['createdat'], errors='coerce')
    df['updatedat'] = pd.to_datetime(df['updatedat'], errors='coerce')
    
    # Suppression des lignes sans date ou utilisateur
    df = df.dropna(subset=['createdat', 'user'])
    
    # ===============================
    # DIM_TIME
    # ===============================
    dim_time = df[['createdat']].drop_duplicates().copy()
    dim_time['date'] = dim_time['createdat'].dt.date
    dim_time['year'] = dim_time['createdat'].dt.year
    dim_time['month'] = dim_time['createdat'].dt.month
    dim_time['day'] = dim_time['createdat'].dt.day
    dim_time['day_of_week'] = dim_time['createdat'].dt.day_name()
    dim_time['hour'] = dim_time['createdat'].dt.hour
    dim_time['quarter'] = dim_time['createdat'].dt.quarter
    dim_time['week_number'] = dim_time['createdat'].dt.isocalendar().week
    dim_time['is_weekend'] = dim_time['createdat'].dt.dayofweek.isin([5, 6])
    dim_time['time_id'] = range(1, len(dim_time) + 1)
    
    # ===============================
    # DIM_USER
    # ===============================
    dim_user = df[['user']].drop_duplicates().copy()
    dim_user['user_id'] = range(1, len(dim_user) + 1)
    
    # Ajouter des stats utilisateur
    user_stats = df.groupby('user').agg({
        'sentiment_score': ['count', 'mean']
    })
    user_stats.columns = ['total_notes', 'avg_sentiment']
    user_stats = user_stats.reset_index()
    
    dim_user = dim_user.merge(user_stats, on='user', how='left')
    
    # ===============================
    # DIM_SENTIMENT
    # ===============================
    dim_sentiment = df[['sentiment_label']].drop_duplicates().copy()
    dim_sentiment['sentiment_id'] = range(1, len(dim_sentiment) + 1)
    
    # Ajouter des catégories de sentiment
    def categorize_sentiment(score):
        if pd.isna(score):
            return 'neutral'
        elif score >= 0.7:
            return 'strong_positive'
        elif score >= 0.55:
            return 'positive'
        elif score >= 0.45:
            return 'neutral'
        elif score >= 0.3:
            return 'negative'
        else:
            return 'strong_negative'
    
    sentiment_scores = df.groupby('sentiment_label')['sentiment_score'].mean()
    dim_sentiment['sentiment_category'] = dim_sentiment['sentiment_label'].apply(
        lambda x: categorize_sentiment(sentiment_scores.get(x, 0.5))
    )
    
    # ===============================
    # DIM_KEYWORD
    # ===============================
    # Collecter tous les mots-clés
    keyword_cols = [col for col in df.columns if 'keywords' in col]
    all_keywords = []
    
    for col in keyword_cols:
        if col in df.columns:
            keywords = df[col].dropna().tolist()
            all_keywords.extend(keywords)
    
    # Éviter le warning de pandas.unique()
    if all_keywords:
        unique_keywords = pd.Series(all_keywords).unique()
        dim_keyword = pd.DataFrame({'keyword': unique_keywords})
        dim_keyword = dim_keyword.dropna()
        dim_keyword['keyword_id'] = range(1, len(dim_keyword) + 1)
        logging.info(f"✅ {len(dim_keyword)} mots-clés uniques trouvés")
    else:
        dim_keyword = pd.DataFrame(columns=['keyword_id', 'keyword'])
        logging.info("ℹ️ Aucun mot-clé trouvé")
    
    # ===============================
    # FACT_NOTES
    # ===============================
    # Préparer les données pour la table de faits
    fact_notes = df.copy()
    
    # Ajouter les clés étrangères
    fact_notes = fact_notes.merge(dim_time[['createdat', 'time_id']], on='createdat', how='left')
    fact_notes = fact_notes.merge(dim_user[['user', 'user_id']], on='user', how='left')
    fact_notes = fact_notes.merge(dim_sentiment[['sentiment_label', 'sentiment_id']], on='sentiment_label', how='left')
    
    # Sélectionner les colonnes pour la table de faits
    fact_notes = fact_notes[[
        '_id', 'time_id', 'user_id', 'sentiment_id',
        'sentiment_score', 'sentiment_comparative', 'sentiment_rawscore',
        'createdat', 'updatedat'
    ]].copy()
    
    # Renommer les colonnes
    fact_notes = fact_notes.rename(columns={
        '_id': 'note_id',
        'sentiment_score': 'score',
        'sentiment_comparative': 'comparative',
        'sentiment_rawscore': 'raw_score',
        'createdat': 'created_at',
        'updatedat': 'updated_at'
    })
    
    # Ajouter des métriques calculées
    fact_notes['note_count'] = 1
    fact_notes['word_count'] = df['content'].apply(lambda x: len(str(x).split()) if pd.notna(x) else 0)
    
    # Nettoyer les DataFrames pour l'encodage
    dim_time = clean_dataframe(dim_time)
    dim_user = clean_dataframe(dim_user)
    dim_sentiment = clean_dataframe(dim_sentiment)
    dim_keyword = clean_dataframe(dim_keyword)
    fact_notes = clean_dataframe(fact_notes)
    
    logging.info("✅ Transformations terminées")
    
    return dim_time, dim_user, dim_sentiment, dim_keyword, fact_notes

# ===============================
# LOAD (CORRIGÉ)
# ===============================
def load_data(dim_time, dim_user, dim_sentiment, dim_keyword, fact_notes):
    logging.info("Chargement des données dans PostgreSQL...")
    
    try:
        # Créer le moteur SQLAlchemy
        engine = create_engine(POSTGRES_URI)
        
        # Tester la connexion
        with engine.connect() as conn:
            logging.info("✅ Connexion à PostgreSQL établie")
        
        # Charger les tables
        logging.info("Chargement de dim_time...")
        dim_time.to_sql("dim_time", engine, if_exists="replace", index=False)
        
        logging.info("Chargement de dim_user...")
        dim_user.to_sql("dim_user", engine, if_exists="replace", index=False)
        
        logging.info("Chargement de dim_sentiment...")
        dim_sentiment.to_sql("dim_sentiment", engine, if_exists="replace", index=False)
        
        if not dim_keyword.empty:
            logging.info("Chargement de dim_keyword...")
            dim_keyword.to_sql("dim_keyword", engine, if_exists="replace", index=False)
        
        logging.info("Chargement de fact_notes...")
        fact_notes.to_sql("fact_notes", engine, if_exists="replace", index=False)
        
        logging.info("✅ Toutes les tables ont été chargées avec succès")
        
        # CRÉATION DE LA VUE (CORRECTION ICI)
        logging.info("Création de la vue vw_notes_analysis...")
        with engine.connect() as conn:
            # Exécuter chaque commande SQL séparément
            conn.execute(text("DROP VIEW IF EXISTS vw_notes_analysis"))
            conn.execute(text("""
                CREATE VIEW vw_notes_analysis AS
                SELECT 
                    fn.note_id,
                    fn.score,
                    fn.comparative,
                    fn.raw_score,
                    fn.word_count,
                    fn.created_at,
                    fn.updated_at,
                    dt.year,
                    dt.month,
                    dt.day_of_week,
                    dt.is_weekend,
                    du.user,
                    du.total_notes as user_total_notes,
                    du.avg_sentiment as user_avg_sentiment,
                    ds.sentiment_label,
                    ds.sentiment_category
                FROM fact_notes fn
                LEFT JOIN dim_time dt ON fn.time_id = dt.time_id
                LEFT JOIN dim_user du ON fn.user_id = du.user_id
                LEFT JOIN dim_sentiment ds ON fn.sentiment_id = ds.sentiment_id
            """))
            conn.commit()
            logging.info("✅ Vue vw_notes_analysis créée pour Power BI")
            
        # Afficher le résumé
        print("\n" + "="*60)
        print("📊 RÉSUMÉ DE L'ETL")
        print("="*60)
        print(f"📝 Notes totales : {len(fact_notes)}")
        print(f"👤 Utilisateurs uniques : {len(dim_user)}")
        print(f"📅 Périodes temporelles : {len(dim_time)}")
        print(f"😊 Types de sentiment : {len(dim_sentiment)}")
        print(f"🔤 Mots-clés uniques : {len(dim_keyword)}")
        print(f"🔗 Vue créée : vw_notes_analysis")
        print("="*60)
        print("\n✅ Votre Data Warehouse est prêt pour Power BI !")
        print("   Connectez-vous avec ces paramètres :")
        print("   - Serveur : localhost")
        print("   - Base : smartnotes_dw")
        print("   - Table/Vue : vw_notes_analysis")
        print("="*60)
        
    except Exception as e:
        logging.error(f"❌ Erreur de chargement : {e}")
        logging.error(traceback.format_exc())
        raise

# ===============================
# MAIN
# ===============================
if __name__ == "__main__":
    try:
        logging.info("🚀 Démarrage du pipeline ETL SmartNotes")
        
        # Étape 1: Extraction
        df = extract_data()
        
        # Étape 2: Transformation
        dim_time, dim_user, dim_sentiment, dim_keyword, fact_notes = transform_data(df)
        
        # Étape 3: Chargement
        load_data(dim_time, dim_user, dim_sentiment, dim_keyword, fact_notes)
        
        logging.info("🎉 ETL terminé avec succès !")
        
    except Exception as e:
        logging.error(f"💥 Échec de l'ETL : {e}")