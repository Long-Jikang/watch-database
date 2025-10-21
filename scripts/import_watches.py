#!/usr/bin/env python3
import csv
import os
import re
import mysql.connector
from datetime import datetime

# Database configuration from environment
DB_URL = os.getenv('DATABASE_URL', '')

# Parse DATABASE_URL (format: mysql://user:pass@host:port/dbname?params)
def parse_db_url(url):
    # Remove query parameters
    if '?' in url:
        url = url.split('?')[0]
    
    pattern = r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)'
    match = re.match(pattern, url)
    if match:
        return {
            'user': match.group(1),
            'password': match.group(2),
            'host': match.group(3),
            'port': int(match.group(4)),
            'database': match.group(5),
            'ssl_disabled': False
        }
    raise ValueError(f"Invalid DATABASE_URL format: {url}")

CSV_FILE = '/home/ubuntu/watch_db.csv'
BATCH_SIZE = 50

def parse_diameter(diameter_str):
    """Extract numeric diameter value"""
    if not diameter_str:
        return None
    match = re.search(r'(\d+\.?\d*)', diameter_str)
    if match:
        value = float(match.group(1))
        # Limit to reasonable range (max 999.99mm)
        return min(value, 999.99)
    return None

def parse_water_resistance(wr_str):
    """Extract water resistance in meters"""
    if not wr_str:
        return None
    match = re.search(r'(\d+)', wr_str)
    return int(match.group(1)) if match else None

def parse_limited(limited_str):
    """Parse limited edition info"""
    if not limited_str or limited_str.lower() == 'no':
        return False, None
    match = re.search(r'(\d+)', limited_str)
    return True, int(match.group(1)) if match else None

def determine_movement_type(caliber, functions):
    """Determine movement type from caliber and functions"""
    combined = f"{caliber} {functions}".lower()
    if 'automatic' in combined or 'self-winding' in combined:
        return 'Automatic'
    elif 'manual' in combined or 'hand-wound' in combined:
        return 'Manual'
    elif 'quartz' in combined:
        return 'Quartz'
    return None

def import_data():
    print("Starting Kaggle data import...")
    
    # Connect to database
    db_config = parse_db_url(DB_URL)
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    print(f"Connected to database: {db_config['database']}")
    
    # Read CSV
    with open(CSV_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f, delimiter=';')
        
        watch_batch = []
        feature_batch = []
        processed_count = 0
        error_count = 0
        
        for row_num, row in enumerate(reader, start=2):
            try:
                # Parse limited edition
                is_limited, limited_size = parse_limited(row.get('Limited', ''))
                
                # Parse dimensions
                diameter = parse_diameter(row.get('Diameter', ''))
                thickness = parse_diameter(row.get('Height', ''))
                water_resistance = parse_water_resistance(row.get('W/R', ''))
                
                # Determine movement type
                movement_type = determine_movement_type(
                    row.get('Movement_Caliber', ''),
                    row.get('Movement_Functions', '')
                )
                
                # Prepare watch data
                watch = (
                    row.get('Brand', 'Unknown'),
                    row.get('Family') or None,
                    row.get('Name', 'Unnamed Watch'),
                    row.get('Reference') or None,
                    row.get('Movement_Caliber') or None,
                    movement_type,
                    row.get('Movement_Functions') or None,
                    row.get('Case Material') or None,
                    diameter,
                    thickness,
                    row.get('Glass') or None,
                    row.get('Back') or None,
                    water_resistance,
                    is_limited,
                    limited_size,
                    None,  # yearOfProduction
                    row.get('Description') or None,
                    None,  # imageUrl
                    'kaggle',  # dataSource
                    row.get('Reference') or None,  # externalId
                )
                
                watch_batch.append(watch)
                
                # Prepare features
                features = []
                
                if row.get('Dial Color'):
                    features.append(('dial_color', row['Dial Color']))
                
                if row.get('Shape'):
                    features.append(('case_shape', row['Shape']))
                
                if row.get('Indexes'):
                    features.append(('indexes', row['Indexes']))
                
                if row.get('Hands'):
                    features.append(('hands', row['Hands']))
                
                # Parse movement functions
                if row.get('Movement_Functions'):
                    funcs = [f.strip() for f in row['Movement_Functions'].split('|')]
                    for func in funcs:
                        if func:
                            features.append(('complication', func))
                
                if features:
                    feature_batch.append((len(watch_batch) - 1, features))
                
                # Insert batch
                if len(watch_batch) >= BATCH_SIZE:
                    insert_batch(cursor, watch_batch, feature_batch)
                    conn.commit()
                    processed_count += len(watch_batch)
                    print(f"Processed {processed_count} watches...")
                    watch_batch = []
                    feature_batch = []
                
            except Exception as e:
                error_count += 1
                print(f"Error processing row {row_num}: {e}")
                if error_count > 100:
                    print("Too many errors, stopping import")
                    break
        
        # Insert remaining batch
        if watch_batch:
            insert_batch(cursor, watch_batch, feature_batch)
            conn.commit()
            processed_count += len(watch_batch)
        
        print(f"\nImport completed!")
        print(f"Total processed: {processed_count}")
        print(f"Total errors: {error_count}")
    
    cursor.close()
    conn.close()

def insert_batch(cursor, watch_batch, feature_batch):
    """Insert a batch of watches and their features"""
    
    # Insert watches
    watch_sql = """
        INSERT INTO watches (
            brand, family, name, referenceNumber, movementCaliber, movementType,
            movementFunctions, caseMaterial, caseDiameterMm, caseThicknessMm,
            glass, back, waterResistanceM, isLimited, limitedEditionSize,
            yearOfProduction, description, imageUrl, dataSource, externalId
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    cursor.executemany(watch_sql, watch_batch)
    
    # Get the starting ID
    start_id = cursor.lastrowid
    
    # Prepare features with correct watch IDs
    all_features = []
    for batch_index, features in feature_batch:
        watch_id = start_id + batch_index
        for feature_key, feature_value in features:
            all_features.append((watch_id, feature_key, feature_value))
    
    # Insert features
    if all_features:
        feature_sql = """
            INSERT INTO watchFeatures (watchId, featureKey, featureValue)
            VALUES (%s, %s, %s)
        """
        cursor.executemany(feature_sql, all_features)

if __name__ == '__main__':
    import_data()

