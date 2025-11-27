FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt && python -m spacy download en_core_web_sm && python -m nltk.downloader punkt stopwords wordnet
COPY . .
CMD ["flask", "run", "--host=0.0.0.0"]