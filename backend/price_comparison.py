import requests
from bs4 import BeautifulSoup
import time
import random
from urllib.parse import quote

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def get_price_amazon(product_name):
    try:
        url = f"https://www.amazon.com/s?k={quote(product_name)}"
        res = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, 'lxml')
        price = soup.find('span', {'data-component-type': 's-price'})
        return {'retailer': 'Amazon', 'price': float(price.text.strip()[1:].replace(',', '')) if price else 0}
    except:
        return {'retailer': 'Amazon', 'price': 0}

def get_price_walmart(product_name):
    try:
        url = f"https://www.walmart.com/search?q={quote(product_name)}"
        res = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, 'lxml')
        price = soup.find('span', class_='w_iUH7')
        return {'retailer': 'Walmart', 'price': float(price.text.strip()[1:].replace(',', '')) if price else 0}
    except:
        return {'retailer': 'Walmart', 'price': 0}

# Add Target, BestBuy similarly (selectors may vary)

def compare_prices(product_name):
    time.sleep(random.uniform(1, 3))  # Polite delay
    prices = [
        get_price_amazon(product_name),
        get_price_walmart(product_name),
        # get_price_target(product_name),
    ]
    return [p for p in prices if p['price'] > 0]