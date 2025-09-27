import streamlit as st
import pickle
import joblib
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
import snscrape.modules.twitter as sntwitter
import os
import os, subprocess

def download_from_drive(file_id, output):
    """Download a file from Google Drive with gdown if it does not exist locally."""
    if not os.path.exists(output):
        try:
            import gdown
        except ImportError:
            subprocess.check_call(["pip", "install", "gdown"])
            import gdown
        print(f"Downloading {output} from Google Drive...")
        gdown.download(id=file_id, output=output, quiet=False)

# TODO: Replace these with your actual Google Drive FILE_IDs
MODEL_FILE_ID = "PUT_YOUR_MODEL_FILE_ID_HERE"
VECTORIZER_FILE_ID = "PUT_YOUR_VECTORIZER_FILE_ID_HERE"

download_from_drive(MODEL_FILE_ID, "trained_model.sav")
download_from_drive(VECTORIZER_FILE_ID, "vectorizer.pkl")


# Paths
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, 'trained_model.sav')
VECTORIZER_PATH = os.path.join(BASE_DIR, 'vectorizer.pkl')

# Ensure stopwords are available (download silently if possible), otherwise fallback to a small list
try:
    nltk.download('stopwords', quiet=True)
    stop_words = set(stopwords.words('english'))
except Exception:
    stop_words = set([
        'i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves',
        'he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs',
        'this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having',
        'do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with',
        'about','against','between','into','through','during','before','after','above','below','to','from','up','down','in',
        'out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any',
        'both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very'
    ])

port_stem = PorterStemmer()

def load_model_and_vectorizer(model_path=MODEL_PATH, vectorizer_path=VECTORIZER_PATH):
    try:
        model = joblib.load(model_path)
    except Exception as e:
        return None, None, f'Failed to load model: {e}'
    try:
        vectorizer = joblib.load(vectorizer_path)
    except Exception as e:
        return None, None, f'Failed to load vectorizer: {e}'
    return model, vectorizer, None

def preprocess_text(text):
    if not isinstance(text, str):
        text = str(text)
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'[^a-z\s]', ' ', text)
    tokens = text.split()
    tokens = [t for t in tokens if t not in stop_words]
    tokens = [port_stem.stem(t) for t in tokens]
    return ' '.join(tokens)

# Attempt to load model/vectorizer at import time
MODEL, VECTORIZER, LOAD_ERROR = load_model_and_vectorizer()

def predict_sentiment(text):
    cleaned = preprocess_text(text)

    if MODEL is not None and VECTORIZER is not None:
        try:
            X = VECTORIZER.transform([cleaned])
            pred = MODEL.predict(X)[0]

            prob = None
            if hasattr(MODEL, 'predict_proba'):
                try:
                    prob = MODEL.predict_proba(X).max()
                except Exception:
                    prob = None

            
            label_map = {0: "Negative", 1: "Positive"}
            label = label_map.get(pred, "Neutral")
            return label, prob

        except Exception as e:
            print("Model Sentiment failed, falling back:", e)

    
    positive_words = {'love', 'great', 'good', 'happy', 'awesome', 'best', 'fantastic', 'like', 'amazing'}
    negative_words = {'hate', 'bad', 'worst', 'terrible', 'awful', 'disappoint', 'sad', 'angry'}

    tokens = set(cleaned.split())
    pos_score = len(tokens & positive_words)
    neg_score = len(tokens & negative_words)

    if pos_score >= neg_score:
        prob = 0.5 + (pos_score - neg_score) * 0.2
        prob = min(prob, 0.99)
        return "Positive", prob
    else:
        prob = 0.5 + (neg_score - pos_score) * 0.2
        prob = min(prob, 0.99)
        return "Negative", prob

import tweepy

BEARER_TOKEN = "AAAAAAAAAAAAAAAAAAAAAK6J4QEAAAAAxWBh3xarOMRrlr8JRwL5IOwsvAo%3DAOlEYLeJh309d79hcAynSRe5T1RkoRnkBIsIJnHATPEknEVjB4"

client = tweepy.Client(bearer_token=BEARER_TOKEN)

def fetch_tweets(username, limit=10):
    try:
        user = client.get_user(username=username)
        user_id = user.data.id

        response = client.get_users_tweets(id=user_id, max_results=limit)

        tweets = []
        if response.data:
            for tweet in response.data:
                tweets.append(tweet.text)
        return tweets

    except Exception as e:
        print(f"Fetch tweets error: {e}")
        return []

def create_card(tweet_text, sentiment_tuple):
    label, prob = sentiment_tuple if isinstance(sentiment_tuple, tuple) else (sentiment_tuple, None)
    prob_text = f' ({prob:.2f})' if prob is not None else ''
    color = '#4caf50' if str(label).lower() in ['positive','pos','1','true'] else '#f44336'
    html = f"""
    <div style="border:1px solid #ddd;padding:12px;border-radius:8px;margin-bottom:10px;">
      <div style="font-size:14px;margin-bottom:8px;">{tweet_text}</div>
      <div style="font-weight:600;color:{color};">Sentiment: {label}{prob_text}</div>
    </div>
    """
    return html

def main():
    st.title('Twitter Sentiment Analysis')
    if LOAD_ERROR:
        st.warning(f'Model/vectorizer load warning: {LOAD_ERROR} — using fallback classifier.')
    menu = ['Predict text','Get tweets from user']
    option = st.sidebar.selectbox('Choose action', menu)
    if option == 'Predict text':
        user_input = st.text_area('Enter text to analyze', height=150)
        if st.button('Analyze'):
            if user_input.strip():
                try:
                    label, prob = predict_sentiment(user_input)
                    st.success(f'Sentiment: {label} {f"({prob:.2f})" if prob else ""}')
                except Exception as e:
                    st.error(f'Error during Sentiment: {e}')
            else:
                st.warning('Please enter some text first.')
    elif option == 'Get tweets from user':
        username = st.text_input('Enter Twitter username')
        limit = st.slider('Number of tweets', min_value=1, max_value=10, value=5)
        if st.button('Fetch Tweets'):
            tweets_data = fetch_tweets(username, limit=limit)
            if tweets_data:
                for tweet_text in tweets_data:
                    sentiment = predict_sentiment(tweet_text)
                    st.markdown(create_card(tweet_text, sentiment), unsafe_allow_html=True)
            else:
                st.warning('No tweets found for this user.')

if __name__ == '__main__':
    main()