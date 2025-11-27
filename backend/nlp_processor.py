import re
from collections import Counter
import spacy
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
from difflib import SequenceMatcher
from cache import cached_nlp

# Download required NLTK data
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

try:
    nltk.data.find('stopwords')
except LookupError:
    nltk.download('stopwords')

# Load spaCy model
try:
    nlp = spacy.load('en_core_web_sm')
except OSError:
    # If model not found, download it
    spacy.cli.download('en_core_web_sm')
    nlp = spacy.load('en_core_web_sm')
except Exception as e:
    # Fallback to basic processing if spaCy fails
    print(f"Warning: spaCy failed to load: {e}. Using basic processing.")
    nlp = None

# Initialize NLTK components
sia = SentimentIntensityAnalyzer()
stop_words = set(stopwords.words('english'))

# Knowledge base: interests -> gifts
KNOWLEDGE_BASE = {
    'drawing': [{'name': 'Professional Sketch Pad', 'category': 'art', 'age_min': 8, 'image': 'https://example.com/sketchpad.jpg'}],
    'dinosaurs': [{'name': 'Dinosaur Fossil Dig Kit', 'category': 'science', 'age_min': 6}],
    'science': [{'name': 'Crystal Growing Kit', 'category': 'science', 'age_min': 8}],
    'gaming': [{'name': 'Gaming Headset', 'category': 'gaming', 'age_min': 12}],
    'cooking': [{'name': 'Electric Mixer', 'category': 'kitchen', 'age_min': 18}],
    'gardening': [{'name': 'Gardening Tool Set', 'category': 'outdoor', 'age_min': 18}],
    'photography': [{'name': 'DSLR Camera', 'category': 'tech', 'age_min': 16}],
    # Add more...
}

RELATIONSHIPS = {'niece', 'nephew', 'son', 'daughter', 'wife', 'husband', 'mom', 'dad', 'friend', 'best friend'}

@cached_nlp(ttl=3600)  # Cache NLP results for 1 hour
def process_query(query):
    """Enhanced NLP processing using spaCy and NLTK"""
    if not query or not query.strip():
        return {
            'age': None,
            'relationship': None,
            'interests': [],
            'entities': [],
            'sentiment': {'compound': 0, 'pos': 0, 'neu': 1, 'neg': 0},
            'recommendations': []
        }

    # Process with spaCy for advanced NLP if available
    if nlp:
        doc = nlp(query.lower())
    else:
        # Fallback to basic processing
        doc = None

    # Extract age using regex and spaCy entities
    age = None
    age_match = re.search(r'(\d{1,2})(?:-year-old|\s+years?\s+old|\s+yo)', query.lower())
    if age_match:
        age = int(age_match.group(1))
    elif doc:
        # Check for age entities in spaCy
        for ent in doc.ents:
            if ent.label_ == 'DATE' and any(word in ent.text.lower() for word in ['year', 'old', 'yo']):
                age_match = re.search(r'\d+', ent.text)
                if age_match:
                    age = int(age_match.group())

    # Extract relationship using spaCy entities and custom matching
    relationship = None
    if doc:
        for ent in doc.ents:
            if ent.label_ in ['PERSON', 'NORP']:
                # Check if it's a relationship term
                ent_text = ent.text.lower()
                for rel in RELATIONSHIPS:
                    if rel in ent_text or ent_text in rel:
                        relationship = rel
                        break
                if relationship:
                    break

        # If not found in entities, check tokens
        if not relationship:
            for token in doc:
                token_text = token.text.lower()
                if token_text in RELATIONSHIPS:
                    relationship = token_text
                    break

    # Extract interests using spaCy lemmatization and POS tagging or fallback
    interests = []
    if doc:
        for token in doc:
            # Consider nouns, adjectives, and verbs as potential interests
            if (token.pos_ in ['NOUN', 'ADJ', 'VERB'] and
                token.lemma_.lower() not in stop_words and
                len(token.lemma_) > 3 and
                not token.is_punct and
                not token.is_space):
                interests.append(token.lemma_.lower())
    else:
        # Fallback to simple tokenization
        tokens = re.findall(r'\b\w+\b', query.lower())
        interests = [word for word in tokens if word.isalpha() and word not in stop_words and len(word) > 3]

    # Remove duplicates while preserving order
    seen = set()
    interests = [x for x in interests if not (x in seen or seen.add(x))]

    # Extract named entities for additional context
    entities = []
    if doc:
        for ent in doc.ents:
            if ent.label_ in ['PERSON', 'ORG', 'GPE', 'PRODUCT', 'EVENT']:
                entities.append({
                    'text': ent.text,
                    'label': ent.label_,
                    'start': ent.start_char,
                    'end': ent.end_char
                })

    # Sentiment analysis using NLTK
    sentiment = sia.polarity_scores(query)

    # Fuzzy matching for interests against knowledge base
    matched_interests = []
    for interest in interests:
        # Direct match
        if interest in KNOWLEDGE_BASE:
            matched_interests.append(interest)
        else:
            # Fuzzy match with similarity > 0.8
            for kb_interest in KNOWLEDGE_BASE.keys():
                if SequenceMatcher(None, interest, kb_interest).ratio() > 0.8:
                    matched_interests.append(kb_interest)
                    break

    # Match recommendations
    recommendations = []
    for interest in matched_interests:
        if interest in KNOWLEDGE_BASE:
            recommendations.extend(KNOWLEDGE_BASE[interest])

    # Get top interests for analysis
    interests_counter = Counter(interests)
    top_interests = [word for word, _ in interests_counter.most_common(5)]

    return {
        'age': age,
        'relationship': relationship,
        'interests': top_interests,
        'entities': entities,
        'sentiment': sentiment,
        'matched_interests': matched_interests,
        'recommendations': recommendations[:5]
    }