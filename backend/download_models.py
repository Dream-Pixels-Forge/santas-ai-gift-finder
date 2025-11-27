import nltk
import spacy

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
spacy.cli.download("en_core_web_sm")
print("Models downloaded! 🎉")