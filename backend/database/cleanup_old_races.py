#!/usr/bin/env python3
"""
Race Database Cleanup Script
Remove races older than 1.5 years from the current date

This script:
1. Parses French date format from the database (e.g., "25 mai 2024")
2. Calculates race age compared to current date
3. Removes races older than 1.5 years
4. Cascades deletion to related race_results records via foreign key constraints
"""

import sys
import sqlite3
import re
from datetime import datetime, timedelta
from typing import List, Tuple, Optional
import os

# Add project root to path for backend imports
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

# Import configuration
from backend.config.constants import DEFAULT_DB_PATH


class RaceCleanupScript:
    """Script to cleanup old races from the database"""

    def __init__(self, db_path: str = DEFAULT_DB_PATH, dry_run: bool = True, skip_confirmation: bool = False):
        """
        Initialize the cleanup script

        Args:
            db_path: Path to the SQLite database
            dry_run: If True, only show what would be deleted without actually deleting
        """
        self.db_path = db_path
        self.dry_run = dry_run
        self.skip_confirmation = skip_confirmation
        self.cutoff_date = datetime.now() - timedelta(days=547)  # 1.5 years = ~547 days

        # French month mapping
        self.french_months = {
            'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4,
            'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8,
            'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
        }

        print(f"Cleanup cutoff date: {self.cutoff_date.strftime('%d/%m/%Y')}")
        print(f"Mode: {'DRY RUN' if dry_run else 'ACTUAL DELETION'}")
        print("-" * 50)

    def parse_french_date(self, date_string: str) -> Optional[datetime]:
        """
        Parse French date format to datetime object

        Examples:
        - "25 mai 2024" -> datetime(2024, 5, 25)
        - "03 juin 2025" -> datetime(2025, 6, 3)

        Args:
            date_string: French date string

        Returns:
            datetime object or None if parsing fails
        """
        if not date_string or date_string.strip() == "" or date_string == "Date inconnue":
            return None

        # Pattern: day month year (e.g., "25 mai 2024")
        pattern = r'(\d{1,2})\s+(\w+)\s+(\d{4})'
        match = re.match(pattern, date_string.strip(), re.IGNORECASE)

        if not match:
            print(f"Warning: Could not parse date '{date_string}'")
            return None

        day = int(match.group(1))
        month_name = match.group(2).lower()
        year = int(match.group(3))

        if month_name not in self.french_months:
            print(f"Warning: Unknown month '{month_name}' in date '{date_string}'")
            return None

        month = self.french_months[month_name]

        try:
            return datetime(year, month, day)
        except ValueError as e:
            print(f"Warning: Invalid date '{date_string}': {e}")
            return None

    def get_old_races(self) -> List[Tuple[str, str, str]]:
        """
        Get races older than 1.5 years

        Returns:
            List of tuples (race_id, date, name) for old races
        """
        old_races = []

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Get all races
            cursor.execute("SELECT id, date, name FROM races")
            races = cursor.fetchall()

            for race_id, date_str, name in races:
                race_date = self.parse_french_date(date_str)

                if race_date and race_date < self.cutoff_date:
                    old_races.append((race_id, date_str, name))

            conn.close()

        except Exception as e:
            print(f"Error querying database: {e}")
            return []

        return old_races

    def get_race_statistics(self, race_ids: List[str]) -> dict:
        """
        Get statistics for races to be deleted

        Args:
            race_ids: List of race IDs

        Returns:
            Dictionary with statistics
        """
        if not race_ids:
            return {"races": 0, "results": 0}

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Count race results that will be deleted
            placeholders = ','.join(['?' for _ in race_ids])
            cursor.execute(f"SELECT COUNT(*) FROM race_results WHERE race_id IN ({placeholders})", race_ids)
            result_count = cursor.fetchone()[0]

            conn.close()

            return {
                "races": len(race_ids),
                "results": result_count
            }

        except Exception as e:
            print(f"Error getting statistics: {e}")
            return {"races": 0, "results": 0}

    def delete_old_races(self, race_ids: List[str]) -> bool:
        """
        Delete old races and their results

        Args:
            race_ids: List of race IDs to delete

        Returns:
            True if successful, False otherwise
        """
        if not race_ids:
            print("No races to delete.")
            return True

        if self.dry_run:
            print(f"DRY RUN: Would delete {len(race_ids)} races")
            return True

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            # Delete races (results will be deleted automatically via CASCADE)
            placeholders = ','.join(['?' for _ in race_ids])
            cursor.execute(f"DELETE FROM races WHERE id IN ({placeholders})", race_ids)

            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()

            print(f"Successfully deleted {deleted_count} races")
            return True

        except Exception as e:
            print(f"Error deleting races: {e}")
            return False

    def run_cleanup(self) -> None:
        """Main cleanup function"""
        print(f"Starting race cleanup for database: {self.db_path}")

        # Check if database exists
        if not os.path.exists(self.db_path):
            print(f"Error: Database file not found: {self.db_path}")
            return

        # Get old races
        print("Scanning for old races...")
        old_races = self.get_old_races()

        if not old_races:
            print("No races older than 1.5 years found.")
            return

        # Display races to be deleted
        print(f"\nFound {len(old_races)} races older than 1.5 years:")
        print("-" * 80)
        print(f"{'Race ID':<15} {'Date':<15} {'Name'}")
        print("-" * 80)

        for race_id, date_str, name in old_races[:10]:  # Show first 10
            name_truncated = name[:45] + "..." if len(name) > 45 else name
            print(f"{race_id:<15} {date_str:<15} {name_truncated}")

        if len(old_races) > 10:
            print(f"... and {len(old_races) - 10} more races")

        # Get statistics
        race_ids = [race[0] for race in old_races]
        stats = self.get_race_statistics(race_ids)

        print(f"\nDeletion Impact:")
        print(f"- Races to delete: {stats['races']}")
        print(f"- Race results to delete: {stats['results']}")

        # Confirm deletion (if not dry run)
        if not self.dry_run:
            print(f"\nThis will permanently delete {stats['races']} races and {stats['results']} race results.")
            if not self.skip_confirmation:
                confirmation = input("Are you sure you want to proceed? (yes/no): ").lower().strip()
            else:
                confirmation = 'yes'

            if confirmation != 'yes':
                print("Cleanup cancelled.")
                return

        # Perform deletion
        print(f"\n{'Simulating' if self.dry_run else 'Performing'} cleanup...")
        success = self.delete_old_races(race_ids)

        if success:
            print(f"Cleanup completed successfully!")
            if not self.dry_run:
                print(f"Deleted {len(race_ids)} races older than 1.5 years.")
        else:
            print("Cleanup failed!")


def main():
    """Main function with command line argument handling"""
    import argparse

    parser = argparse.ArgumentParser(description='Cleanup old races from the cycling database')
    parser.add_argument('--db-path', '-d',
                       default=DEFAULT_DB_PATH,
                       help=f'Database path (default: {DEFAULT_DB_PATH})')
    parser.add_argument('--execute', '-x',
                       action='store_true',
                       help='Actually delete races (default is dry-run)')
    parser.add_argument('--cutoff-days', '-c',
                       type=int,
                       default=547,
                       help='Days to look back (default: 547 = 1.5 years)')

    args = parser.parse_args()

    # Override cutoff if specified
    dry_run = not args.execute

    print("Race Database Cleanup Script")
    print("=" * 50)

    # Create and run cleanup script
    cleanup = RaceCleanupScript(db_path=args.db_path, dry_run=dry_run)

    # Override cutoff date if specified
    if args.cutoff_days != 547:
        cleanup.cutoff_date = datetime.now() - timedelta(days=args.cutoff_days)
        print(f"Custom cutoff: {args.cutoff_days} days ({cleanup.cutoff_date.strftime('%d/%m/%Y')})")

    cleanup.run_cleanup()


if __name__ == "__main__":
    main()