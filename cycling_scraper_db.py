#!/usr/bin/env python3
"""
Cycling Results Scraper for Pays de la Loire - Database Version
Scrapes race results and saves directly to SQLite database
"""

import requests
from bs4 import BeautifulSoup
import time
import re
from datetime import datetime
from urllib.parse import urljoin
import sys
import os
from database.database import CyclingDatabase


class CyclingScraperDB:
    def __init__(self, db_path='database/cycling_data.db'):
        self.base_url = "https://paysdelaloirecyclisme.fr"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Initialize database
        self.db = CyclingDatabase(db_path)
        print(f"Database initialized at: {db_path}")
        
        # Scraping statistics
        self.stats = {
            'new_races': 0,
            'skipped_races': 0,
            'new_cyclists': 0,
            'new_results': 0,
            'errors': 0
        }
    
    def clean_club_name(self, club_raw):
        """Remove leading numbers from club names"""
        if not club_raw:
            return None
        # Remove leading numbers and spaces
        cleaned = re.sub(r'^\d+\s*', '', club_raw.strip())
        return cleaned if cleaned else club_raw
    
    def generate_race_id(self, race_name, race_date):
        """Generate a unique race ID based on name and date"""
        # Create a short hash-like ID from name and date
        import hashlib
        content = f"{race_name}_{race_date}".encode('utf-8')
        hash_short = hashlib.md5(content).hexdigest()[:8]
        return f"race_{hash_short}"
    
    def get_page(self, url, retries=3):
        """Get page content with retry logic"""
        for attempt in range(retries):
            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                print(f"Attempt {attempt + 1} failed for {url}: {e}")
                if attempt < retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    self.stats['errors'] += 1
                    return None
    
    def extract_race_date(self, soup):
        """Extract race date from various possible locations"""
        # Try different selectors for date
        date_selectors = [
            '.race-date',
            '.date',
            '[class*="date"]',
            'time',
            '.event-date'
        ]
        
        for selector in date_selectors:
            date_elem = soup.select_one(selector)
            if date_elem:
                date_text = date_elem.get_text().strip()
                # Try to parse various date formats
                date_patterns = [
                    r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
                    r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
                    r'(\d{1,2}\s+\w+\s+\d{4})'
                ]
                for pattern in date_patterns:
                    match = re.search(pattern, date_text)
                    if match:
                        return match.group(1)
        
        return "Date inconnue"
    
    def scrape_race_details(self, race_url):
        """Scrape individual race details and save to database"""
        print(f"Checking race: {race_url}")
        response = self.get_page(race_url)
        if not response:
            return False
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract race information
        race_title = soup.find('h1')
        race_name = race_title.get_text().strip() if race_title else "Unknown Race"
        
        # Extract race date
        race_date = self.extract_race_date(soup)
        
        # Generate race ID
        race_id = self.generate_race_id(race_name, race_date)
        
        # Check if this race already exists in database
        if self.db.race_exists(race_id):
            print(f"⏭️  Skipping already scraped race: {race_name} ({race_date})")
            self.stats['skipped_races'] += 1
            return False
        
        print(f"🆕 Scraping new race: {race_name} ({race_date})")
        
        # Find leaderboard/results table
        results_table = None
        table_selectors = [
            'table.results',
            'table.leaderboard',
            'table[class*="result"]',
            'table[class*="classement"]',
            '.results-table table',
            'table'
        ]
        
        for selector in table_selectors:
            results_table = soup.select_one(selector)
            if results_table:
                break
        
        if not results_table:
            print(f"No results table found for {race_url}")
            self.stats['errors'] += 1
            return False
        
        try:
            # Add race to database
            self.db.add_or_update_race(race_id, race_date, race_name)
            self.stats['new_races'] += 1
            
            # Extract participants and rankings
            rows = results_table.find_all('tr')
            participants_added = 0
            
            for row in rows[1:]:  # Skip header row
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    try:
                        # Extract basic info
                        rank_text = cells[0].get_text().strip()
                        
                        # Clean up rank (remove non-numeric characters except for numbers)
                        rank_match = re.search(r'\d+', rank_text)
                        rank = int(rank_match.group()) if rank_match else participants_added + 1
                        
                        # Extract raw data
                        raw_data = [cell.get_text().strip() for cell in cells]
                        
                        # Skip if not enough data
                        if len(raw_data) < 4:
                            continue
                        
                        # Extract cyclist information from raw_data
                        # Typical format: [rank, uci_id, last_name, first_name, region, club, ...]
                        uci_id = raw_data[1] if len(raw_data) > 1 else f"unknown_{participants_added}"
                        last_name = raw_data[2] if len(raw_data) > 2 else ''
                        first_name = raw_data[3] if len(raw_data) > 3 else ''
                        region = raw_data[4] if len(raw_data) > 4 else ''
                        club_raw = raw_data[5] if len(raw_data) > 5 else ''
                        club_clean = self.clean_club_name(club_raw)
                        
                        # Skip if essential data is missing
                        if not uci_id or (not last_name and not first_name):
                            continue
                        
                        # Clean up names
                        first_name = re.sub(r'\s+', ' ', first_name).strip()
                        last_name = re.sub(r'\s+', ' ', last_name).strip()
                        
                        # Skip header-like entries
                        if (first_name.lower() in ['nom', 'name', 'coureur', 'rider', 'prenom'] or
                            last_name.lower() in ['nom', 'name', 'coureur', 'rider', 'prenom']):
                            continue
                        
                        # Add or update cyclist in database
                        self.db.add_or_update_cyclist(
                            uci_id=uci_id,
                            first_name=first_name,
                            last_name=last_name,
                            region=region,
                            club=club_clean,
                            club_raw=club_raw
                        )
                        
                        # Add race result
                        self.db.add_race_result(
                            race_id=race_id,
                            uci_id=uci_id,
                            rank=rank,
                            raw_data=raw_data
                        )
                        
                        participants_added += 1
                        self.stats['new_results'] += 1
                        
                    except Exception as e:
                        print(f"Error processing participant row: {e}")
                        self.stats['errors'] += 1
                        continue
            
            print(f"✅ Added {participants_added} participants to race {race_id}")
            return True
            
        except Exception as e:
            print(f"Error saving race {race_id}: {e}")
            self.stats['errors'] += 1
            return False
    
    def scrape_race_list_page(self, page_num):
        """Scrape a single page of race listings"""
        url = f"https://paysdelaloirecyclisme.fr/resultats/?_region=pays-de-la-loire&_discipline=route&_type_de_courses=regional&_licence=access-1&_pagination={page_num}"
        
        print(f"Scraping page {page_num}: {url}")
        response = self.get_page(url)
        if not response:
            return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find race links
        race_links = []
        link_selectors = [
            'a[class*="card-result"]'
        ]
        
        for selector in link_selectors:
            links = soup.select(selector)
            for link in links:
                href = link.get('href')
                if href and '/resultats/' in href:
                    full_url = urljoin(self.base_url, href)
                    if full_url not in race_links:
                        race_links.append(full_url)
        
        return race_links
    
    def scrape_all_races(self):
        """Scrape all race pages with pagination"""
        page_num = 1
        all_race_links = []
        
        while True:
            print(f"\n--- Scraping page {page_num} ---")
            race_links = self.scrape_race_list_page(page_num)
            
            if not race_links:
                print(f"No more races found on page {page_num}. Stopping.")
                break
            
            all_race_links.extend(race_links)
            print(f"Found {len(race_links)} races on page {page_num}")
            
            page_num += 1
            time.sleep(1)  # Be respectful to the server
            
            # Safety limit to prevent infinite loops
            if page_num > 100:
                print("Reached page limit (100). Stopping.")
                break
        
        print(f"\nTotal races found: {len(all_race_links)}")
        
        # Remove duplicates
        unique_race_links = list(set(all_race_links))
        print(f"Unique races: {len(unique_race_links)}")
        
        # Scrape each race
        for i, race_url in enumerate(unique_race_links, 1):
            print(f"\n--- Race {i}/{len(unique_race_links)} ---")
            self.scrape_race_details(race_url)
            time.sleep(1)  # Be respectful to the server
        
        # Update scraping info
        db_stats = self.db.get_database_stats()
        self.db.update_scraping_info(
            total_races=db_stats['total_races'],
            total_racers=db_stats['total_cyclists']
        )
        
        self.print_summary()
    
    def print_summary(self):
        """Print scraping summary"""
        print(f"\n--- Scraping Summary ---")
        print(f"New races scraped: {self.stats['new_races']}")
        print(f"Races skipped (already exist): {self.stats['skipped_races']}")
        print(f"New race results: {self.stats['new_results']}")
        print(f"Errors encountered: {self.stats['errors']}")
        
        # Get final database stats
        db_stats = self.db.get_database_stats()
        print(f"\n--- Database Summary ---")
        print(f"Total races in database: {db_stats['total_races']}")
        print(f"Total cyclists in database: {db_stats['total_cyclists']}")
        print(f"Total race results: {db_stats['total_results']}")


def main():
    """Main function to run the database scraper"""
    db_path = sys.argv[1] if len(sys.argv) > 1 else 'database/cycling_data.db'
    scraper = CyclingScraperDB(db_path)
    
    try:
        print("Starting cycling results scraper (Database version)...")
        print("This may take a while depending on the number of races.\n")
        
        scraper.scrape_all_races()
        
        print("\nScraping completed successfully!")
        
    except KeyboardInterrupt:
        print("\nScraping interrupted by user.")
        scraper.print_summary()
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        scraper.print_summary()


if __name__ == "__main__":
    main()