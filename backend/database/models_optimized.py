"""
Optimized Database manager for Race Cycling History App
Enhanced SQLite database operations with improved error handling and performance
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from contextlib import contextmanager

from utils.logging_utils import get_database_logger
from config.constants import DB_TIMEOUT, DB_ISOLATION_LEVEL, SCHEMA_FILE


class DatabaseError(Exception):
    """Custom exception for database-related errors"""
    pass


class OptimizedCyclingDatabase:
    """
    Optimized database manager with enhanced error handling and performance
    """
    
    def __init__(self, db_path: str = "database/cycling_data.db"):
        """
        Initialize database with configuration
        
        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path
        self.logger = get_database_logger()
        
        try:
            self.ensure_database_exists()
            self.logger.info(f"Database initialized: {db_path}")
        except Exception as e:
            self.logger.error(f"Database initialization failed: {e}")
            raise DatabaseError(f"Failed to initialize database: {e}")
    
    def ensure_database_exists(self) -> None:
        """Create database and tables if they don't exist"""
        # Create directory if needed
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        # Execute schema
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        if not os.path.exists(schema_path):
            raise DatabaseError(f"Schema file not found: {schema_path}")
        
        with self.get_connection() as conn:
            with open(schema_path, 'r') as f:
                schema = f.read()
            conn.executescript(schema)
            
        self.logger.debug("Database schema applied successfully")
    
    @contextmanager
    def get_connection(self):
        """
        Context manager for database connections with enhanced configuration
        """
        conn = None
        try:
            conn = sqlite3.connect(
                self.db_path, 
                timeout=DB_TIMEOUT,
                isolation_level=DB_ISOLATION_LEVEL
            )
            conn.row_factory = sqlite3.Row  # Enable dict-like access
            
            # Performance optimizations
            conn.execute("PRAGMA journal_mode = WAL")  # Write-Ahead Logging
            conn.execute("PRAGMA synchronous = NORMAL")  # Balanced safety/performance
            conn.execute("PRAGMA cache_size = 10000")  # Larger cache
            conn.execute("PRAGMA temp_store = MEMORY")  # Use memory for temp storage
            
            yield conn
            conn.commit()
            
        except sqlite3.Error as e:
            if conn:
                conn.rollback()
            self.logger.error(f"Database error: {e}")
            raise DatabaseError(f"Database operation failed: {e}")
        except Exception as e:
            if conn:
                conn.rollback()
            self.logger.error(f"Unexpected error: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    # =============================================================================
    # SCRAPING METADATA OPERATIONS
    # =============================================================================
    
    def update_scraping_info(self, total_races: int, total_racers: int) -> None:
        """
        Update scraping metadata
        
        Args:
            total_races: Total number of races in database
            total_racers: Total number of cyclists in database
        """
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    INSERT INTO scraping_info (timestamp, total_races, total_racers)
                    VALUES (?, ?, ?)
                """, (datetime.now().isoformat(), total_races, total_racers))
                
            self.logger.debug(f"Updated scraping info: {total_races} races, {total_racers} racers")
            
        except Exception as e:
            self.logger.error(f"Failed to update scraping info: {e}")
            raise DatabaseError(f"Failed to update scraping metadata: {e}")
    
    def get_scraping_info(self) -> Optional[Dict[str, Any]]:
        """
        Get latest scraping information
        
        Returns:
            Dictionary with scraping metadata or None if not available
        """
        try:
            with self.get_connection() as conn:
                row = conn.execute("""
                    SELECT * FROM scraping_info 
                    ORDER BY created_at DESC LIMIT 1
                """).fetchone()
                
                result = dict(row) if row else None
                self.logger.debug(f"Retrieved scraping info: {result is not None}")
                return result
                
        except Exception as e:
            self.logger.error(f"Failed to get scraping info: {e}")
            return None
    
    # =============================================================================
    # RACE OPERATIONS
    # =============================================================================
    
    def add_or_update_race(self, race_id: str, date: str, name: str) -> None:
        """
        Add or update a race
        
        Args:
            race_id: Unique race identifier
            date: Race date
            name: Race name
        """
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO races (id, date, name, updated_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                """, (race_id, date, name))
                
            self.logger.debug(f"Added/updated race: {race_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to add race {race_id}: {e}")
            raise DatabaseError(f"Failed to add race: {e}")
    
    def race_exists(self, race_id: str) -> bool:
        """
        Check if race already exists
        
        Args:
            race_id: Race ID to check
            
        Returns:
            True if race exists, False otherwise
        """
        try:
            with self.get_connection() as conn:
                row = conn.execute(
                    "SELECT 1 FROM races WHERE id = ?", (race_id,)
                ).fetchone()
                
                exists = row is not None
                self.logger.debug(f"Race {race_id} exists: {exists}")
                return exists
                
        except Exception as e:
            self.logger.error(f"Failed to check race existence {race_id}: {e}")
            return False
    
    def get_all_races(self) -> List[Dict[str, Any]]:
        """
        Get all races with participant data
        
        Returns:
            List of race dictionaries with participant counts
        """
        try:
            with self.get_connection() as conn:
                rows = conn.execute("""
                    SELECT r.*, 
                           COUNT(rr.id) as participant_count
                    FROM races r
                    LEFT JOIN race_results rr ON r.id = rr.race_id
                    GROUP BY r.id
                    ORDER BY r.date DESC
                """).fetchall()
                
                result = [dict(row) for row in rows]
                self.logger.debug(f"Retrieved {len(result)} races")
                return result
                
        except Exception as e:
            self.logger.error(f"Failed to get all races: {e}")
            raise DatabaseError(f"Failed to retrieve races: {e}")
    
    def get_race_with_participants(self, race_id: str) -> Optional[Dict[str, Any]]:
        """
        Get race details with all participants
        
        Args:
            race_id: Race ID to retrieve
            
        Returns:
            Dictionary with race data and participants or None if not found
        """
        try:
            with self.get_connection() as conn:
                # Get race info
                race_row = conn.execute("""
                    SELECT * FROM races WHERE id = ?
                """, (race_id,)).fetchone()
                
                if not race_row:
                    self.logger.debug(f"Race not found: {race_id}")
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
                
                self.logger.debug(f"Retrieved race {race_id} with {len(race['participants'])} participants")
                return race
                
        except Exception as e:
            self.logger.error(f"Failed to get race {race_id}: {e}")
            raise DatabaseError(f"Failed to retrieve race: {e}")
    
    # =============================================================================
    # CYCLIST OPERATIONS  
    # =============================================================================
    
    def add_or_update_cyclist(self, uci_id: str, first_name: str, last_name: str,
                             region: str = None, club: str = None, club_raw: str = None) -> None:
        """
        Add or update cyclist information
        
        Args:
            uci_id: UCI ID (unique identifier)
            first_name: Cyclist's first name
            last_name: Cyclist's last name
            region: Region/department
            club: Cleaned club name
            club_raw: Original club name with numbers
        """
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO cyclists 
                    (uci_id, first_name, last_name, region, club, club_raw, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                """, (uci_id, first_name, last_name, region, club, club_raw))
                
            self.logger.debug(f"Added/updated cyclist: {uci_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to add cyclist {uci_id}: {e}")
            raise DatabaseError(f"Failed to add cyclist: {e}")
    
    def get_cyclist_by_id(self, uci_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cyclist information by UCI ID
        
        Args:
            uci_id: UCI ID to search for
            
        Returns:
            Cyclist dictionary with race count or None if not found
        """
        try:
            with self.get_connection() as conn:
                row = conn.execute("""
                    SELECT c.*, COUNT(rr.id) as total_races
                    FROM cyclists c
                    LEFT JOIN race_results rr ON c.uci_id = rr.uci_id
                    WHERE c.uci_id = ?
                    GROUP BY c.uci_id
                """, (uci_id,)).fetchone()
                
                result = dict(row) if row else None
                self.logger.debug(f"Retrieved cyclist {uci_id}: {result is not None}")
                return result
                
        except Exception as e:
            self.logger.error(f"Failed to get cyclist {uci_id}: {e}")
            return None
    
    def search_cyclists(self, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Search cyclists by name with improved performance
        
        Args:
            query: Search query
            limit: Maximum results to return
            
        Returns:
            List of matching cyclists with race counts
        """
        try:
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
                    LIMIT ?
                """, (search_term, search_term, search_term, limit)).fetchall()
                
                result = [dict(row) for row in rows]
                self.logger.debug(f"Search '{query}' returned {len(result)} results")
                return result
                
        except Exception as e:
            self.logger.error(f"Failed to search cyclists '{query}': {e}")
            return []
    
    def get_cyclist_history(self, uci_id: str) -> List[Dict[str, Any]]:
        """
        Get complete race history for a cyclist
        
        Args:
            uci_id: UCI ID to get history for
            
        Returns:
            List of race results ordered by date (newest first)
        """
        try:
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
                
                self.logger.debug(f"Retrieved {len(history)} race results for {uci_id}")
                return history
                
        except Exception as e:
            self.logger.error(f"Failed to get cyclist history {uci_id}: {e}")
            return []
    
    # =============================================================================
    # RACE RESULTS OPERATIONS
    # =============================================================================
    
    def add_race_result(self, race_id: str, uci_id: str, rank: int, raw_data: List[Any]) -> None:
        """
        Add a race result
        
        Args:
            race_id: Race identifier
            uci_id: Cyclist UCI ID
            rank: Finishing position
            raw_data: Original raw data from scraping
        """
        try:
            with self.get_connection() as conn:
                conn.execute("""
                    INSERT OR REPLACE INTO race_results 
                    (race_id, uci_id, rank, raw_data_json)
                    VALUES (?, ?, ?, ?)
                """, (race_id, uci_id, rank, json.dumps(raw_data)))
                
            self.logger.debug(f"Added race result: {uci_id} in {race_id} (rank {rank})")
            
        except Exception as e:
            self.logger.error(f"Failed to add race result {uci_id}/{race_id}: {e}")
            raise DatabaseError(f"Failed to add race result: {e}")
    
    # =============================================================================
    # STATISTICS AND REPORTING
    # =============================================================================
    
    def get_database_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive database statistics
        
        Returns:
            Dictionary with database statistics
        """
        try:
            with self.get_connection() as conn:
                stats = {}
                
                # Basic counts
                stats['total_races'] = conn.execute("SELECT COUNT(*) FROM races").fetchone()[0]
                stats['total_cyclists'] = conn.execute("SELECT COUNT(*) FROM cyclists").fetchone()[0]
                stats['total_results'] = conn.execute("SELECT COUNT(*) FROM race_results").fetchone()[0]
                
                # Recent activity
                recent_race = conn.execute("""
                    SELECT date, name FROM races ORDER BY created_at DESC LIMIT 1
                """).fetchone()
                
                if recent_race:
                    stats['latest_race'] = dict(recent_race)
                
                # Performance metrics
                avg_participants = conn.execute("""
                    SELECT AVG(participant_count) FROM races WHERE participant_count > 0
                """).fetchone()[0]
                
                if avg_participants:
                    stats['avg_participants_per_race'] = round(avg_participants, 1)
                
                self.logger.debug(f"Generated database statistics: {len(stats)} metrics")
                return stats
                
        except Exception as e:
            self.logger.error(f"Failed to get database stats: {e}")
            raise DatabaseError(f"Failed to retrieve statistics: {e}")
    
    # =============================================================================
    # EXPORT AND COMPATIBILITY
    # =============================================================================
    
    def export_yaml_format(self) -> Dict[str, Any]:
        """
        Export data in original YAML format for compatibility
        
        Returns:
            Dictionary in YAML-compatible format
        """
        try:
            with self.get_connection() as conn:
                # Get scraping info
                scraping_info = self.get_scraping_info()
                
                # Export races with participants
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
                
                # Export cyclist histories
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
                
                result = {
                    'scraping_info': scraping_info or {
                        'timestamp': datetime.now().isoformat(),
                        'total_races': len(races),
                        'total_racers': len(racers_history)
                    },
                    'races': races,
                    'racers_history': racers_history
                }
                
                self.logger.debug(f"Exported YAML format: {len(races)} races, {len(racers_history)} cyclists")
                return result
                
        except Exception as e:
            self.logger.error(f"Failed to export YAML format: {e}")
            raise DatabaseError(f"Failed to export data: {e}")
    
    # =============================================================================
    # MAINTENANCE OPERATIONS
    # =============================================================================
    
    def vacuum_database(self) -> None:
        """Optimize database by running VACUUM"""
        try:
            with self.get_connection() as conn:
                conn.execute("VACUUM")
            self.logger.info("Database vacuum completed")
        except Exception as e:
            self.logger.error(f"Database vacuum failed: {e}")
            raise DatabaseError(f"Failed to vacuum database: {e}")
    
    def analyze_database(self) -> None:
        """Update database statistics for query optimization"""
        try:
            with self.get_connection() as conn:
                conn.execute("ANALYZE")
            self.logger.debug("Database analysis completed")
        except Exception as e:
            self.logger.error(f"Database analysis failed: {e}")
    
    def get_table_sizes(self) -> Dict[str, int]:
        """Get row counts for all tables"""
        try:
            with self.get_connection() as conn:
                tables = ['races', 'cyclists', 'race_results', 'scraping_info']
                sizes = {}
                
                for table in tables:
                    count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                    sizes[table] = count
                
                return sizes
                
        except Exception as e:
            self.logger.error(f"Failed to get table sizes: {e}")
            return {}