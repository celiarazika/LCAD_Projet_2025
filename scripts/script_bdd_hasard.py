import random
import string
import csv
from datetime import datetime, timedelta
import os

# Fonctions existantes
def generate_title():
    length = random.randint(5, 15)
    return ''.join(random.choices(string.ascii_letters, k=length))

def generate_tags():
    num_tags = random.randint(2, 5)
    tags = []
    for _ in range(num_tags):
        tag_length = random.randint(3, 10)
        tag = ''.join(random.choices(string.ascii_letters, k=tag_length))
        tags.append(tag)
    return ', '.join(tags)

# Fonction pour générer une ligne de données
def generate_row(app_id):
    title = generate_title()
    reviews_total = random.randint(0, 1000000)
    reviews_score = round(random.uniform(0, 100), 2)
    release_date = (datetime.now() - timedelta(days=random.randint(0, 3650))).strftime('%Y-%m-%d')
    reviews_d7 = random.randint(0, 1000)
    reviews_d30 = random.randint(reviews_d7, 5000)
    reviews_d90 = random.randint(reviews_d30, 10000)
    launch_price = random.randint(0, 6000) / 100
    tags = generate_tags()
    name_slug = title.lower().replace(' ', '-')
    revenue = random.randint(0, 10000000)
    modified_tags = generate_tags()
    steam_page = f"https://store.steampowered.com/app/{app_id}"
    
    return [app_id, title, reviews_total, reviews_score, release_date, 
            reviews_d7, reviews_d30, reviews_d90, launch_price, tags, 
            name_slug, revenue, modified_tags, steam_page]

# Génération du fichier CSV
def generate_csv(filename, target_size_gb=5):
    headers = ['App ID', 'Title', 'Reviews Total', 'Reviews Score Fancy', 
              'Release Date', 'Reviews D7', 'Reviews D30', 'Reviews D90', 
              'Launch Price', 'Tags', 'name_slug', 'Revenue Estimated', 
              'Modified Tags', 'Steam Page']
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        
        app_id = 1
        target_size_bytes = target_size_gb * 1024 * 1024 * 1024
        
        while os.path.getsize(filename) < target_size_bytes:
            writer.writerow(generate_row(app_id))
            app_id += 1
            
            if app_id % 1000 == 0:
                print(f"Generated {app_id} rows. Current file size: {os.path.getsize(filename)/1024/1024/1024:.2f} GB")

# Exécution
generate_csv('large_database.csv')
