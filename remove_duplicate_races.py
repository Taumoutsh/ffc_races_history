#!/usr/bin/env python3
"""
Remove duplicate races from the cycling database
Duplicates are identified by same date and same name
"""

import sys
import os
import sqlite3
from collections import defaultdict

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database.models import CyclingDatabase
from backend.config.constants import DEFAULT_DB_PATH

def find_and_remove_duplicates(db_path: str = DEFAULT_DB_PATH):
    """Find and remove duplicate races from the database"""
    print("🔍 Finding and Removing Duplicate Races")
    print("=" * 50)
    
    try:
        # Initialize database connection
        db = CyclingDatabase(db_path)
        
        # Get all races
        print("📊 Analyzing database...")
        races = db.get_all_races()
        print(f"Total races found: {len(races)}")
        
        # Group races by (date, name) to find duplicates
        race_groups = defaultdict(list)
        
        for race in races:
            # Create a key from date and name (normalized)
            key = (race.get('date', '').strip().lower(), race.get('name', '').strip().lower())
            race_groups[key].append(race)
        
        # Find duplicates
        duplicates = {key: races_list for key, races_list in race_groups.items() if len(races_list) > 1}
        
        print(f"🔍 Found {len(duplicates)} groups with duplicates")
        print(f"📈 Total duplicate races to remove: {sum(len(races) - 1 for races in duplicates.values())}")
        
        if not duplicates:
            print("✅ No duplicates found! Database is clean.")
            return
        
        # Display duplicates for review
        print("\n📋 Duplicate Groups Found:")
        print("-" * 40)
        
        total_to_remove = 0
        for i, ((date, name), races_list) in enumerate(duplicates.items(), 1):
            print(f"\n{i}. Race: {races_list[0].get('name', 'Unknown')}")
            print(f"   Date: {races_list[0].get('date', 'Unknown')}")
            print(f"   Duplicates: {len(races_list)} copies")
            
            for j, race in enumerate(races_list):
                race_id = race.get('id', 'Unknown')
                participant_count = get_participant_count(db, race_id)
                print(f"     #{j+1}: ID={race_id}, Participants={participant_count}")
            
            total_to_remove += len(races_list) - 1
        
        print(f"\n⚠️  Total races to be removed: {total_to_remove}")
        
        # Ask for confirmation
        response = input("\n❓ Do you want to proceed with duplicate removal? (yes/no): ").strip().lower()
        
        if response in ['yes', 'y']:
            print("\n🗑️  Removing duplicates...")
            
            removed_count = 0
            for (date, name), races_list in duplicates.items():
                # Keep the race with the most participants, remove others
                races_with_counts = []
                for race in races_list:
                    race_id = race.get('id', '')
                    participant_count = get_participant_count(db, race_id)
                    races_with_counts.append((race, participant_count))
                
                # Sort by participant count (descending) to keep the one with most participants
                races_with_counts.sort(key=lambda x: x[1], reverse=True)
                
                # Keep the first one (most participants), remove the rest
                to_keep = races_with_counts[0][0]
                to_remove = [race for race, count in races_with_counts[1:]]
                
                print(f"\n📌 Processing: {to_keep.get('name', 'Unknown')}")
                print(f"   Keeping: ID={to_keep.get('id', 'Unknown')} ({races_with_counts[0][1]} participants)")
                
                for race in to_remove:
                    race_id = race.get('id', '')
                    participant_count = get_participant_count(db, race_id)
                    print(f"   Removing: ID={race_id} ({participant_count} participants)")
                    
                    # Remove race results first
                    remove_race_results(db, race_id)
                    
                    # Remove the race
                    remove_race(db, race_id)
                    
                    removed_count += 1
            
            print(f"\n✅ Successfully removed {removed_count} duplicate races!")
            
            # Show final statistics
            final_races = db.get_all_races()
            final_stats = db.get_database_stats()
            
            print(f"\n📊 Final Database Statistics:")
            print(f"   Total races: {len(final_races)}")
            print(f"   Total cyclists: {final_stats.get('total_cyclists', 0)}")
            print(f"   Total results: {final_stats.get('total_results', 0)}")
            
        else:
            print("❌ Duplicate removal cancelled.")
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def get_participant_count(db: CyclingDatabase, race_id: str) -> int:
    """Get the number of participants for a race"""
    try:
        # Execute raw SQL to count participants
        cursor = db.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM race_results WHERE race_id = ?", (race_id,))
        result = cursor.fetchone()
        return result[0] if result else 0
    except Exception:
        return 0

def remove_race_results(db: CyclingDatabase, race_id: str):
    """Remove all results for a race"""
    try:
        cursor = db.conn.cursor()
        cursor.execute("DELETE FROM race_results WHERE race_id = ?", (race_id,))
        db.conn.commit()
    except Exception as e:
        print(f"   ⚠️  Error removing results for race {race_id}: {e}")

def remove_race(db: CyclingDatabase, race_id: str):
    """Remove a race from the database"""
    try:
        cursor = db.conn.cursor()
        cursor.execute("DELETE FROM races WHERE id = ?", (race_id,))
        db.conn.commit()
    except Exception as e:
        print(f"   ⚠️  Error removing race {race_id}: {e}")

if __name__ == "__main__":
    # Allow custom database path as command line argument
    db_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DB_PATH
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        sys.exit(1)
    
    find_and_remove_duplicates(db_path)