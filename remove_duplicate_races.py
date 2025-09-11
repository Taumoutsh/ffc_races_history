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
        
        # Display duplicates for review and check participant counts
        print("\n📋 Duplicate Groups Found:")
        print("-" * 40)
        
        safe_to_remove = {}
        unsafe_duplicates = {}
        total_to_remove = 0
        
        for i, ((date, name), races_list) in enumerate(duplicates.items(), 1):
            print(f"\n{i}. Race: {races_list[0].get('name', 'Unknown')}")
            print(f"   Date: {races_list[0].get('date', 'Unknown')}")
            print(f"   Duplicates: {len(races_list)} copies")
            
            # Get participant counts for all copies
            race_counts = []
            for j, race in enumerate(races_list):
                race_id = race.get('id', 'Unknown')
                participant_count = get_participant_count(db, race_id)
                race_counts.append(participant_count)
                print(f"     #{j+1}: ID={race_id}, Participants={participant_count}")
            
            # Check if all participant counts are the same
            unique_counts = set(race_counts)
            if len(unique_counts) == 1:
                print(f"   ✅ Safe to remove: All copies have {race_counts[0]} participants")
                safe_to_remove[(date, name)] = races_list
                total_to_remove += len(races_list) - 1
            else:
                print(f"   ⚠️  UNSAFE: Different participant counts {sorted(unique_counts)}")
                unsafe_duplicates[(date, name)] = races_list
        
        print(f"\n📊 Summary:")
        print(f"   Safe to remove: {len(safe_to_remove)} groups ({total_to_remove} races)")
        print(f"   Unsafe (different counts): {len(unsafe_duplicates)} groups")
        
        if unsafe_duplicates:
            print(f"\n⚠️  WARNING: The following duplicates have different participant counts:")
            print(f"   These will NOT be removed for safety:")
            for (date, name), races_list in unsafe_duplicates.items():
                print(f"   - {races_list[0].get('name', 'Unknown')} ({races_list[0].get('date', 'Unknown')})")
        
        if not safe_to_remove:
            print("❌ No safe duplicates to remove. All duplicates have different participant counts.")
            return
        
        # Ask for confirmation (auto-proceed if all have 0 participants)
        all_zero_participants = True
        for (date, name), races_list in safe_to_remove.items():
            for race in races_list:
                race_id = race.get('id', '')
                if get_participant_count(db, race_id) > 0:
                    all_zero_participants = False
                    break
            if not all_zero_participants:
                break
        
        if all_zero_participants:
            print(f"\n🤖 Auto-proceeding: All duplicates have 0 participants (safe to remove)")
            response = 'yes'
        else:
            try:
                response = input(f"\n❓ Remove {total_to_remove} duplicate races with identical participant counts? (yes/no): ").strip().lower()
            except EOFError:
                print(f"\n🤖 Auto-proceeding due to non-interactive environment")
                response = 'yes'
        
        if response in ['yes', 'y']:
            print("\n🗑️  Removing safe duplicates...")
            
            removed_count = 0
            for (date, name), races_list in safe_to_remove.items():
                # Since all have the same participant count, just keep the first one
                # (by race ID or any other criteria - they're identical anyway)
                races_with_counts = []
                for race in races_list:
                    race_id = race.get('id', '')
                    participant_count = get_participant_count(db, race_id)
                    races_with_counts.append((race, participant_count))
                
                # Sort by race ID to have consistent behavior
                races_with_counts.sort(key=lambda x: x[0].get('id', ''))
                
                # Keep the first one, remove the rest (since they all have same participant count)
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
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM race_results WHERE race_id = ?", (race_id,))
            result = cursor.fetchone()
            return result[0] if result else 0
    except Exception:
        return 0

def remove_race_results(db: CyclingDatabase, race_id: str):
    """Remove all results for a race"""
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM race_results WHERE race_id = ?", (race_id,))
    except Exception as e:
        print(f"   ⚠️  Error removing results for race {race_id}: {e}")

def remove_race(db: CyclingDatabase, race_id: str):
    """Remove a race from the database"""
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM races WHERE id = ?", (race_id,))
    except Exception as e:
        print(f"   ⚠️  Error removing race {race_id}: {e}")

if __name__ == "__main__":
    # Allow custom database path as command line argument
    db_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DB_PATH
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        sys.exit(1)
    
    find_and_remove_duplicates(db_path)