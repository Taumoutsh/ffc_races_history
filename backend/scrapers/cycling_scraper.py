#!/usr/bin/env python3
"""
Cycling Results Scraper for Pays de la Loire
Scrapes race results and creates racer history from paysdelaloirecyclisme.fr
"""

import requests
from bs4 import BeautifulSoup
import yaml
import time
import re
from datetime import datetime
from urllib.parse import urljoin, urlparse
import sys
import os
from collections import defaultdict

class CyclingScraper:
    def __init__(self, existing_data_file='public/data.yaml'):
        self.base_url = "https://paysdelaloirecyclisme.fr"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.races_data = {}
        self.racers_history = defaultdict(list)
        self.existing_data_file = existing_data_file
        self.existing_races = set()
        self.existing_race_urls = set()
        
        # Load existing data if available
        self.load_existing_data()
    
    def load_existing_data(self):
        """Load existing races from data.yaml to avoid duplicate scraping"""
        if os.path.exists(self.existing_data_file):
            try:
                print(f"Loading existing data from {self.existing_data_file}...")
                with open(self.existing_data_file, 'r', encoding='utf-8') as file:
                    existing_data = yaml.safe_load(file)
                
                if existing_data and 'races' in existing_data:
                    # Load existing races data
                    self.races_data = existing_data['races'].copy()
                    
                    # Create sets for quick lookup
                    for race_id, race_info in existing_data['races'].items():
                        race_key = self.generate_race_key(race_info.get('name', ''), race_info.get('date', ''))
                        self.existing_races.add(race_key)
                        
                        if 'url' in race_info:
                            self.existing_race_urls.add(race_info['url'])
                
                if existing_data and 'racers_history' in existing_data:
                    # Load existing racer history
                    for racer_id, history in existing_data['racers_history'].items():
                        self.racers_history[racer_id] = history.copy()
                
                print(f"Loaded {len(self.races_data)} existing races and {len(self.racers_history)} racer histories")
                
            except Exception as e:
                print(f"Error loading existing data: {e}")
                print("Starting with fresh data...")
        else:
            print(f"No existing data file found at {self.existing_data_file}. Starting fresh.")
    
    def generate_race_key(self, name, date):
        """Generate a unique key for race identification"""
        # Normalize name and date for comparison
        normalized_name = re.sub(r'\s+', ' ', name.strip().upper()) if name else ''
        normalized_date = date.strip() if date else ''
        return f"{normalized_name}|{normalized_date}"
    
    def is_race_already_scraped(self, race_name, race_date, race_url=None):
        """Check if a race has already been scraped"""
        race_key = self.generate_race_key(race_name, race_date)
        
        # Check by name and date
        if race_key in self.existing_races:
            return True
        
        # Check by URL if available
        if race_url and race_url in self.existing_race_urls:
            return True
        
        return False
        
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
        
        return None
    
    def scrape_race_details(self, race_url):
        """Scrape individual race details and leaderboard"""
        print(f"Checking race: {race_url}")
        response = self.get_page(race_url)
        if not response:
            return None
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract race information
        race_title = soup.find('h1')
        race_name = race_title.get_text().strip() if race_title else "Unknown Race"
        
        # Extract race date
        race_date = self.extract_race_date(soup)
        
        # Check if this race has already been scraped
        if self.is_race_already_scraped(race_name, race_date, race_url):
            print(f"⏭️  Skipping already scraped race: {race_name} ({race_date})")
            return None
        
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
            return None
        
        # Extract participants and rankings
        participants = []
        rows = results_table.find_all('tr')
        
        for row in rows[1:]:  # Skip header row
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 2:
                # Try to extract rank and name
                rank_text = cells[0].get_text().strip()
                name_text = cells[1].get_text().strip()
                
                # Clean up rank (remove non-numeric characters except for numbers)
                rank_match = re.search(r'\d+', rank_text)
                rank = int(rank_match.group()) if rank_match else len(participants) + 1
                
                # Clean up name
                name = re.sub(r'\s+', ' ', name_text).strip()
                
                if name and name.lower() not in ['nom', 'name', 'coureur', 'rider']:
                    participant = {
                        'rank': rank,
                        'name': name,
                        'raw_data': [cell.get_text().strip() for cell in cells]
                    }
                    participants.append(participant)
        
        race_data = {
            'name': race_name,
            'date': race_date,
            'url': race_url,
            'participants': participants
        }
        
        return race_data
    
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
        new_races_count = 0
        skipped_races_count = 0
        
        for i, race_url in enumerate(unique_race_links, 1):
            print(f"\n--- Race {i}/{len(unique_race_links)} ---")
            race_data = self.scrape_race_details(race_url)
            
            if race_data:
                # Generate new race ID based on current total races
                current_race_count = len(self.races_data) + 1
                race_id = f"race_{current_race_count:03d}"
                
                # Make sure race_id is unique
                while race_id in self.races_data:
                    current_race_count += 1
                    race_id = f"race_{current_race_count:03d}"
                
                self.races_data[race_id] = race_data
                new_races_count += 1
                
                # Build racer history using participant raw_data for cyclist IDs
                for participant in race_data['participants']:
                    # Use the cyclist ID from raw_data[1] if available, otherwise fall back to name
                    if len(participant['raw_data']) > 1 and participant['raw_data'][1]:
                        racer_id = participant['raw_data'][1]
                    else:
                        racer_id = participant['name']
                    
                    race_entry = {
                        'race_id': race_id,
                        'race_name': race_data['name'],
                        'date': race_data['date'],
                        'rank': participant['rank']
                    }
                    self.racers_history[racer_id].append(race_entry)
                    
                # Add race key to existing races set
                race_key = self.generate_race_key(race_data['name'], race_data['date'])
                self.existing_races.add(race_key)
                self.existing_race_urls.add(race_url)
                
            else:
                skipped_races_count += 1
            
            time.sleep(1)  # Be respectful to the server
        
        print(f"\n--- Scraping Summary ---")
        print(f"New races scraped: {new_races_count}")
        print(f"Races skipped (already exist): {skipped_races_count}")
        print(f"Total races in database: {len(self.races_data)}")
    
    def save_to_yaml(self, filename=None):
        """Save all collected data to YAML file"""
        if filename is None:
            filename = self.existing_data_file
            
        # Sort racer history by date where possible
        for racer in self.racers_history:
            # Remove duplicates first
            seen_races = set()
            unique_history = []
            for race_entry in self.racers_history[racer]:
                race_key = f"{race_entry.get('race_id', '')}_{race_entry.get('date', '')}"
                if race_key not in seen_races:
                    seen_races.add(race_key)
                    unique_history.append(race_entry)
            
            # Sort by date (newest first)
            unique_history.sort(
                key=lambda x: x.get('date', ''), 
                reverse=True
            )
            self.racers_history[racer] = unique_history
        
        output_data = {
            'scraping_info': {
                'timestamp': datetime.now().isoformat(),
                'total_races': len(self.races_data),
                'total_racers': len(self.racers_history)
            },
            'races': dict(self.races_data),
            'racers_history': dict(self.racers_history)
        }
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        with open(filename, 'w', encoding='utf-8') as file:
            yaml.dump(output_data, file, default_flow_style=False, 
                     allow_unicode=True, sort_keys=True)
        
        print(f"\nData saved to {filename}")
        print(f"Total races: {len(self.races_data)}")
        print(f"Total racers: {len(self.racers_history)}")

def main():
    """Main function to run the scraper"""
    scraper = CyclingScraper()
    
    try:
        print("Starting cycling results scraper...")
        print("This may take a while depending on the number of races.\n")
        
        scraper.scrape_all_races()
        scraper.save_to_yaml()  # Will save to public/data.yaml by default
        
        print("\nScraping completed successfully!")
        
    except KeyboardInterrupt:
        print("\nScraping interrupted by user.")
        if scraper.races_data:
            print("Saving partial data...")
            scraper.save_to_yaml()  # Will save to public/data.yaml by default
    except Exception as e:
        print(f"\nAn error occurred: {e}")
        if scraper.races_data:
            print("Saving partial data...")
            scraper.save_to_yaml()  # Will save to public/data.yaml by default

if __name__ == "__main__":
    main()