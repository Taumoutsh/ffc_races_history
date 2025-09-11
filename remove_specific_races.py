#!/usr/bin/env python3
"""
Remove specific races as requested by the user
"""

import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.database.models import CyclingDatabase
from backend.config.constants import DEFAULT_DB_PATH

def remove_specific_races(db_path: str = DEFAULT_DB_PATH):
    """Remove specific races as requested"""
    print("🗑️  Removing Specific Races")
    print("=" * 40)
    
    try:
        # Initialize database connection
        db = CyclingDatabase(db_path)
        
        # Get all races to find the specific ones to remove
        races = db.get_all_races()
        print(f"📊 Total races in database: {len(races)}")
        
        # Define races to remove with their criteria
        races_to_remove = [
            {
                "name": "LIGNE (Open 1-2-3 + Access)",
                "date": "7 septembre 2025", 
                "participants": 66,
                "description": "LIGNE (open 1-2-3 + Access) with 66 participants"
            },
            {
                "name": "challenge Mayennais Cycliste – Saint Germain d'Anxure (2ème manche)",
                "date": "3 août 2025",
                "participants": 100,
                "description": "challenge Mayennais Cycliste – Saint Germain d'Anxure (2ème manche) with 100 participants"
            },
            {
                "name": "THORIGNY (Elite-Open-Access)",
                "date": "24 mai 2025",
                "participants": 80,  # Note: you mentioned 50 but database shows 62 and 80
                "description": "THORIGNY (Elite-Open-Access) with 80 participants"
            },
            {
                "name": "Challenge Mayennais cycliste – MONTSURS (1ère manche)",
                "date": "2 août 2025",
                "participants": 85,
                "description": "Challenge Mayennais cycliste – MONTSURS (1ère manche) with 85 participants"
            }
        ]
        
        print("\n🎯 Target Races to Remove:")
        for i, target in enumerate(races_to_remove, 1):
            print(f"  {i}. {target['description']}")
        
        # Also remove all races with 0 participants from duplicates
        print("  5. All duplicate races with 0 participants")
        
        removed_count = 0
        
        # Find and remove specific races
        for target in races_to_remove:
            print(f"\n🔍 Looking for: {target['description']}")
            
            found_races = []
            for race in races:
                race_name = race.get('name', '').strip()
                race_date = race.get('date', '').strip()
                
                # Normalize for comparison
                target_name = target['name'].strip()
                target_date = target['date'].strip()
                
                if (race_name.lower() == target_name.lower() and 
                    race_date.lower() == target_date.lower()):
                    
                    race_id = race.get('id', '')
                    participant_count = get_participant_count(db, race_id)
                    found_races.append((race, participant_count))
            
            if found_races:
                # Find the race with the target participant count
                target_race = None
                for race, count in found_races:
                    if count == target['participants']:
                        target_race = race
                        break
                
                if target_race:
                    race_id = target_race.get('id', '')
                    print(f"   ✅ Found: ID={race_id}, Participants={target['participants']}")
                    
                    # Remove race results first
                    remove_race_results(db, race_id)
                    # Remove the race
                    remove_race(db, race_id)
                    removed_count += 1
                    print(f"   🗑️  Removed successfully")
                else:
                    print(f"   ❌ Not found with {target['participants']} participants")
                    print(f"   Available participant counts: {[count for _, count in found_races]}")
            else:
                print(f"   ❌ Race not found")
        
        # Remove races with 0 participants from the known duplicate groups
        print(f"\n🔍 Looking for duplicate races with 0 participants...")
        
        duplicate_races_with_zero = [
            ("SAINTE GEMME LA PLAINE (Access)", "6 juillet 2025"),
            ("LA FERTE BERNARD – Open 1.2.3  +Access", "5 septembre 2025"),
            ("Circuit des Plages Vendéennes – BRETIGNOLLES SUR MER", "23 février 2025")
        ]
        
        for race_name, race_date in duplicate_races_with_zero:
            print(f"\n🔍 Looking for: {race_name} with 0 participants")
            
            found_races = []
            for race in races:
                if (race.get('name', '').strip().lower() == race_name.lower() and 
                    race.get('date', '').strip().lower() == race_date.lower()):
                    
                    race_id = race.get('id', '')
                    participant_count = get_participant_count(db, race_id)
                    found_races.append((race, participant_count))
            
            # Remove the one with 0 participants
            for race, count in found_races:
                if count == 0:
                    race_id = race.get('id', '')
                    print(f"   ✅ Found: ID={race_id}, Participants=0")
                    
                    # Remove race results first
                    remove_race_results(db, race_id)
                    # Remove the race
                    remove_race(db, race_id)
                    removed_count += 1
                    print(f"   🗑️  Removed successfully")
                    break
        
        print(f"\n✅ Successfully removed {removed_count} races!")
        
        # Show final statistics
        final_races = db.get_all_races()
        final_stats = db.get_database_stats()
        
        print(f"\n📊 Final Database Statistics:")
        print(f"   Total races: {len(final_races)}")
        print(f"   Total cyclists: {final_stats.get('total_cyclists', 0)}")
        print(f"   Total results: {final_stats.get('total_results', 0)}")
        
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
            print(f"     Removed race results for {race_id}")
    except Exception as e:
        print(f"   ⚠️  Error removing results for race {race_id}: {e}")

def remove_race(db: CyclingDatabase, race_id: str):
    """Remove a race from the database"""
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM races WHERE id = ?", (race_id,))
            print(f"     Removed race {race_id}")
    except Exception as e:
        print(f"   ⚠️  Error removing race {race_id}: {e}")

if __name__ == "__main__":
    # Allow custom database path as command line argument
    db_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DB_PATH
    
    if not os.path.exists(db_path):
        print(f"❌ Database file not found: {db_path}")
        sys.exit(1)
    
    remove_specific_races(db_path)