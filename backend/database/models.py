"""
Database manager for Race Cycling History App
SQLite database operations and data access layer
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
from contextlib import contextmanager


class CyclingDatabase:
    def __init__(self, db_path: str = "backend/database/cycling_data.db"):
        self.db_path = db_path
        self.ensure_database_exists()
    
    def ensure_database_exists(self):
        """Create database and tables if they don't exist"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with self.get_connection() as conn:
            # Read and execute schema
            schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
            if os.path.exists(schema_path):
                with open(schema_path, 'r') as f:
                    schema = f.read()
                conn.executescript(schema)
    
    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable dict-like access
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def update_scraping_info(self, total_races: int, total_racers: int) -> None:
        """Update scraping metadata"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO scraping_info (timestamp, total_races, total_racers)
                VALUES (?, ?, ?)
            """, (datetime.now().isoformat(), total_races, total_racers))
    
    def get_scraping_info(self) -> Optional[Dict]:
        """Get latest scraping information"""
        with self.get_connection() as conn:
            row = conn.execute("""
                SELECT * FROM scraping_info 
                ORDER BY created_at DESC LIMIT 1
            """).fetchone()
            return dict(row) if row else None
    
    def add_or_update_race(self, race_id: str, date: str, name: str) -> None:
        """Add or update a race"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO races (id, date, name, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """, (race_id, date, name))
    
    def add_or_update_cyclist(self, uci_id: str, first_name: str, last_name: str, 
                             region: str = None, club: str = None, club_raw: str = None) -> None:
        """Add or update cyclist information"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO cyclists 
                (uci_id, first_name, last_name, region, club, club_raw, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (uci_id, first_name, last_name, region, club, club_raw))
    
    def add_race_result(self, race_id: str, uci_id: str, rank: int, raw_data: List) -> None:
        """Add a race result"""
        with self.get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO race_results 
                (race_id, uci_id, rank, raw_data_json)
                VALUES (?, ?, ?, ?)
            """, (race_id, uci_id, rank, json.dumps(raw_data)))
    
    def race_exists(self, race_id: str) -> bool:
        """Check if race already exists"""
        with self.get_connection() as conn:
            row = conn.execute("SELECT 1 FROM races WHERE id = ?", (race_id,)).fetchone()
            return row is not None
    
    def get_all_races(self) -> List[Dict]:
        """Get all races with participant data"""
        with self.get_connection() as conn:
            rows = conn.execute("""
                SELECT r.*, 
                       COUNT(rr.id) as participant_count
                FROM races r
                LEFT JOIN race_results rr ON r.id = rr.race_id
                GROUP BY r.id
                ORDER BY r.date DESC
            """).fetchall()
            return [dict(row) for row in rows]
    
    def get_race_with_participants(self, race_id: str) -> Optional[Dict]:
        """Get race details with all participants"""
        with self.get_connection() as conn:
            # Get race info
            race_row = conn.execute("""
                SELECT * FROM races WHERE id = ?
            """, (race_id,)).fetchone()
            
            if not race_row:
                return None
            
            race = dict(race_row)
            
            # Get participants
            participant_rows = conn.execute("""
                SELECT c.*, rr.rank, rr.raw_data_json
                FROM race_results rr
                JOIN cyclists c ON rr.uci_id = c.uci_id
                WHERE rr.race_id = ?
                ORDER BY rr.rank
            """, (race_id,)).fetchall()
            
            race['participants'] = []
            for row in participant_rows:
                participant = dict(row)
                participant['raw_data'] = json.loads(participant['raw_data_json'])
                del participant['raw_data_json']
                race['participants'].append(participant)
            
            return race
    
    def get_cyclist_history(self, uci_id: str) -> List[Dict]:
        """Get all race results for a specific cyclist"""
        with self.get_connection() as conn:
            rows = conn.execute("""
                SELECT r.id as race_id, r.date, r.name as race_name, 
                       rr.rank, rr.raw_data_json
                FROM race_results rr
                JOIN races r ON rr.race_id = r.id
                WHERE rr.uci_id = ?
                ORDER BY r.date DESC
            """, (uci_id,)).fetchall()
            
            history = []
            for row in rows:
                result = dict(row)
                result['raw_data'] = json.loads(result['raw_data_json'])
                del result['raw_data_json']
                history.append(result)
            
            return history
    
    def search_cyclists(self, query: str) -> List[Dict]:
        """Search cyclists by name"""
        search_term = f"%{query.upper()}%"
        with self.get_connection() as conn:
            rows = conn.execute("""
                SELECT c.*, COUNT(rr.id) as total_races
                FROM cyclists c
                LEFT JOIN race_results rr ON c.uci_id = rr.uci_id
                WHERE UPPER(c.first_name) LIKE ? 
                   OR UPPER(c.last_name) LIKE ?
                   OR UPPER(c.first_name || ' ' || c.last_name) LIKE ?
                GROUP BY c.uci_id
                ORDER BY total_races DESC, c.last_name, c.first_name
                LIMIT 50
            """, (search_term, search_term, search_term)).fetchall()
            
            return [dict(row) for row in rows]
    
    def get_cyclist_by_id(self, uci_id: str) -> Optional[Dict]:
        """Get cyclist information by UCI ID"""
        with self.get_connection() as conn:
            row = conn.execute("""
                SELECT c.*, COUNT(rr.id) as total_races
                FROM cyclists c
                LEFT JOIN race_results rr ON c.uci_id = rr.uci_id
                WHERE c.uci_id = ?
                GROUP BY c.uci_id
            """, (uci_id,)).fetchone()
            
            return dict(row) if row else None
    
    def get_database_stats(self) -> Dict:
        """Get database statistics"""
        with self.get_connection() as conn:
            stats = {}
            
            # Total counts
            stats['total_races'] = conn.execute("SELECT COUNT(*) FROM races").fetchone()[0]
            stats['total_cyclists'] = conn.execute("SELECT COUNT(*) FROM cyclists").fetchone()[0]
            stats['total_results'] = conn.execute("SELECT COUNT(*) FROM race_results").fetchone()[0]
            
            # Recent activity
            recent_race = conn.execute("""
                SELECT date, name FROM races ORDER BY created_at DESC LIMIT 1
            """).fetchone()
            
            if recent_race:
                stats['latest_race'] = dict(recent_race)
            
            return stats
    
    def get_races_data(self) -> Dict:
        """Export data in original YAML format for compatibility"""
        with self.get_connection() as conn:
            # Get scraping info
            scraping_info = self.get_scraping_info()
            
            # Get all races with participants
            races = {}
            race_rows = conn.execute("SELECT * FROM races ORDER BY id").fetchall()
            
            for race_row in race_rows:
                race = dict(race_row)
                race_id = race['id']
                
                # Get participants for this race
                participant_rows = conn.execute("""
                    SELECT c.uci_id, c.first_name, c.last_name, c.region, c.club_raw,
                           rr.rank, rr.raw_data_json
                    FROM race_results rr
                    JOIN cyclists c ON rr.uci_id = c.uci_id
                    WHERE rr.race_id = ?
                    ORDER BY rr.rank
                """, (race_id,)).fetchall()
                
                participants = []
                for p_row in participant_rows:
                    p_dict = dict(p_row)
                    raw_data = json.loads(p_dict['raw_data_json'])
                    participants.append({
                        'name': p_dict['uci_id'],
                        'rank': p_dict['rank'],
                        'raw_data': raw_data
                    })
                
                races[race_id] = {
                    'date': race['date'],
                    'name': race['name'],
                    'participants': participants
                }
            
            # Get racers history
            racers_history = {}
            cyclist_rows = conn.execute("SELECT uci_id FROM cyclists").fetchall()
            
            for cyclist_row in cyclist_rows:
                uci_id = cyclist_row[0]
                history = self.get_cyclist_history(uci_id)
                
                if history:
                    racers_history[uci_id] = [
                        {
                            'date': h['date'],
                            'race_id': h['race_id'],
                            'race_name': h['race_name'],
                            'rank': h['rank']
                        } for h in history
                    ]
            
            return {
                'scraping_info': scraping_info or {
                    'timestamp': datetime.now().isoformat(),
                    'total_races': len(races),
                    'total_racers': len(racers_history)
                },
                'races': races,
                'racers_history': racers_history
            }
    

    # Authentication methods have been moved to AuthDatabase class in auth_models.py
    # This separation improves security by isolating user data from application data
