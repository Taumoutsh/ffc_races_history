#!/usr/bin/env python3
"""
Migration script to convert existing YAML data to SQLite database
"""

import yaml
import os
import sys
from database import CyclingDatabase
import re


def clean_club_name(club_raw):
    """Remove leading numbers from club names"""
    if not club_raw:
        return None
    # Remove leading numbers and spaces
    cleaned = re.sub(r'^\d+\s*', '', club_raw.strip())
    return cleaned if cleaned else club_raw


def migrate_yaml_to_database(yaml_file='public/data.yaml', db_path='database/cycling_data.db'):
    """Migrate existing YAML data to SQLite database"""
    
    print(f"Starting migration from {yaml_file} to {db_path}")
    
    # Check if YAML file exists
    if not os.path.exists(yaml_file):
        print(f"Error: YAML file {yaml_file} not found!")
        return False
    
    # Load YAML data
    print("Loading YAML data...")
    with open(yaml_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    
    # Initialize database
    print("Initializing database...")
    db = CyclingDatabase(db_path)
    
    # Migrate scraping info
    if 'scraping_info' in data:
        info = data['scraping_info']
        print(f"Migrating scraping info: {info.get('total_races', 0)} races, {info.get('total_racers', 0)} racers")
        db.update_scraping_info(
            total_races=info.get('total_races', 0),
            total_racers=info.get('total_racers', 0)
        )
    
    # Migrate races and participants
    races_data = data.get('races', {})
    print(f"Migrating {len(races_data)} races...")
    
    race_count = 0
    cyclist_count = 0
    result_count = 0
    
    for race_id, race_info in races_data.items():
        # Add race
        db.add_or_update_race(
            race_id=race_id,
            date=race_info['date'],
            name=race_info['name']
        )
        race_count += 1
        
        # Process participants
        participants = race_info.get('participants', [])
        for participant in participants:
            uci_id = participant['name']  # UCI ID stored in 'name' field
            rank = participant['rank']
            raw_data = participant.get('raw_data', [])
            
            # Extract cyclist info from raw_data
            if len(raw_data) >= 5:
                first_name = raw_data[3] if len(raw_data) > 3 else ''
                last_name = raw_data[2] if len(raw_data) > 2 else ''
                region = raw_data[4] if len(raw_data) > 4 else ''
                club_raw = raw_data[5] if len(raw_data) > 5 else ''
                club_clean = clean_club_name(club_raw)
                
                # Add or update cyclist
                try:
                    db.add_or_update_cyclist(
                        uci_id=uci_id,
                        first_name=first_name,
                        last_name=last_name,
                        region=region,
                        club=club_clean,
                        club_raw=club_raw
                    )
                    cyclist_count += 1
                except Exception as e:
                    print(f"Error adding cyclist {uci_id}: {e}")
                    continue
                
                # Add race result
                try:
                    db.add_race_result(
                        race_id=race_id,
                        uci_id=uci_id,
                        rank=rank,
                        raw_data=raw_data
                    )
                    result_count += 1
                except Exception as e:
                    print(f"Error adding race result for {uci_id} in {race_id}: {e}")
        
        if race_count % 10 == 0:
            print(f"Processed {race_count} races...")
    
    print(f"\nMigration completed!")
    print(f"- Races migrated: {race_count}")
    print(f"- Cyclists processed: {cyclist_count}")
    print(f"- Race results migrated: {result_count}")
    
    # Display database stats
    stats = db.get_database_stats()
    print(f"\nDatabase statistics:")
    print(f"- Total races: {stats['total_races']}")
    print(f"- Total cyclists: {stats['total_cyclists']}")
    print(f"- Total results: {stats['total_results']}")
    
    return True


def main():
    """Main migration function"""
    yaml_file = sys.argv[1] if len(sys.argv) > 1 else 'public/data.yaml'
    db_path = sys.argv[2] if len(sys.argv) > 2 else 'database/cycling_data.db'
    
    success = migrate_yaml_to_database(yaml_file, db_path)
    
    if success:
        print(f"\n✅ Migration successful! Database created at: {db_path}")
    else:
        print(f"\n❌ Migration failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()