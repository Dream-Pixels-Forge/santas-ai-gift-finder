import spacy
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from collections import Counter

nlp = spacy.load("en_core_web_sm")
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

def process_query(query):
    doc = nlp(query.lower())
    
    # Extract age
    age_match = re.search(r'(\d{1,2})(?:-year-old|\s+years?\s+old)', query.lower())
    age = int(age_match.group(1)) if age_match else None
    
    # Extract relationship
    rel = None
    for ent in doc.ents:
        if ent.label_ == 'PERSON' or ent.text in RELATIONSHIPS:
            rel = ent.text
            break
    
    # Extract interests (nouns, skip stop words)
    tokens = word_tokenize(query.lower())
    interests = [word for word in tokens if word.isalpha() and word not in stop_words and len(word) > 3]
    interests_counter = Counter(interests)
    top_interests = [word for word, _ in interests_counter.most_common(3)]
    
    # Match recommendations
    recommendations = []
    for interest in top_interests:
        if interest in KNOWLEDGE_BASE:
            recommendations.extend(KNOWLEDGE_BASE[interest])
    
    return {
        'age': age,
        'relationship': rel,
        'interests': top_interests,
        'recommendations': recommendations[:5]  # Top 5
    }