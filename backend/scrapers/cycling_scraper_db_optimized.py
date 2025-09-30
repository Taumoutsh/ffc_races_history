#!/usr/bin/env python3
"""
Optimized Cycling Results Scraper for Pays de la Loire - Database Version
Enhanced version with proper logging, error handling, and code organization
"""

import sys
import time
from typing import List, Dict, Optional, Set
from urllib.parse import urljoin
from bs4 import BeautifulSoup

# Add project root to path for backend imports
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import configuration and utilities
from backend.config.constants import (
    BASE_URL, RESULTS_BASE_URL, DEFAULT_DATE, get_race_search_params, DEFAULT_REGION, AVAILABLE_REGIONS,
    RATE_LIMIT_DELAY, MAX_PAGES, RACE_LINK_SELECTORS, RESULTS_TABLE_SELECTORS, USER_AGENT,
    DEFAULT_DB_PATH, SUCCESS_MESSAGES, ERROR_MESSAGES
)
from backend.utils.scraper_utils import (
    create_session, get_page_with_retry, extract_race_date,
    generate_race_id, find_results_table, extract_participant_data,
    build_search_url, validate_race_data, ScrapingError
)
from backend.utils.logging_utils import (
    get_scraper_logger, ScrapingProgressLogger, log_summary, log_database_stats
)
from backend.database.models import CyclingDatabase


class OptimizedCyclingScraperDB:
    """
    Optimized database scraper with improved error handling and logging
    """
    
    def __init__(self, db_path: str = DEFAULT_DB_PATH, region: str = DEFAULT_REGION):
        """Initialize the scraper with database connection and logging"""
        self.logger = get_scraper_logger()
        self.db_path = db_path
        self.region = region
        
        # Validate region
        if region not in AVAILABLE_REGIONS:
            raise ValueError(f"Invalid region: {region}. Available regions: {list(AVAILABLE_REGIONS.keys())}")
        
        self.logger.info(f"Initializing scraper for region: {AVAILABLE_REGIONS[region]} ({region})")
        
        # Initialize database
        try:
            self.db = CyclingDatabase(db_path)
            self.logger.info(f"Database initialized at: {db_path}")
        except Exception as e:
            self.logger.error(f"Failed to initialize database: {e}")
            raise ScrapingError(f"Database initialization failed: {e}")
        
        # Initialize HTTP session
        self.session = create_session(USER_AGENT)
        
        # Statistics tracking
        self.stats = {
            'new_races': 0,
            'skipped_races': 0,
            'new_cyclists': 0,
            'new_results': 0,
            'errors': 0,
            'pages_scraped': 0
        }
        
        # Track processed URLs to avoid duplicates
        self.processed_urls: Set[str] = set()
        
        # Track card metadata as primary data source
        self.card_metadata: Dict[str, Dict[str, str]] = {}
    
    def scrape_race_list_page(self, page_num: int) -> List[str]:
        """
        Scrape race links from a single listing page
        
        Args:
            page_num: Page number to scrape
            
        Returns:
            List of race URLs found on the page
        """
        race_search_params = get_race_search_params(self.region)
        url = build_search_url(RESULTS_BASE_URL, race_search_params, page_num)
        
        self.logger.debug(f"Scraping page {page_num}: {url}")
        
        response = get_page_with_retry(self.session, url)
        if not response:
            self.logger.error(f"Failed to fetch page {page_num}")
            self.stats['errors'] += 1
            return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        race_links = []
        
        # Find race cards and extract metadata - now primary data source
        race_cards = soup.select('a.card-result[href*="/resultats/"]')

        for card in race_cards:
            href = card.get('href')
            if href and '/resultats/' in href:
                full_url = urljoin(BASE_URL, href)
                if full_url not in race_links:
                    race_links.append(full_url)

                    # Extract comprehensive metadata from card
                    try:
                        # Extract race name from h3 element
                        name_elem = card.select_one('h3')
                        card_name = name_elem.get_text().strip() if name_elem else ""

                        # Extract date from time element with class card-result__date
                        date_elem = card.select_one('time.card-result__date')
                        raw_date = date_elem.get_text().strip() if date_elem else ""

                        # Process multi-day dates and convert months
                        card_date = self._process_card_date(raw_date)

                        # Extract location from card-result__place
                        place_elem = card.select_one('.card-result__place')
                        card_location = place_elem.get_text().strip() if place_elem else ""

                        # Extract categories from card-result__licences
                        licences_elem = card.select_one('.card-result__licences')
                        card_categories = licences_elem.get_text().strip() if licences_elem else ""

                        # Store comprehensive metadata for this URL
                        self.card_metadata[full_url] = {
                            'name': card_name,
                            'date': card_date,
                            'location': card_location,
                            'categories': card_categories
                        }
                        self.logger.debug(f"Stored card metadata for {full_url}: name='{card_name}', date='{card_date}', location='{card_location}', categories='{card_categories}'")

                    except Exception as e:
                        self.logger.warning(f"Failed to extract card metadata for {full_url}: {e}")
        
        # Fallback: use original selectors if no cards found
        if not race_links:
            for selector in RACE_LINK_SELECTORS:
                links = soup.select(selector)
                for link in links:
                    href = link.get('href')
                    if href and '/resultats/' in href:
                        full_url = urljoin(BASE_URL, href)
                        if full_url not in race_links:
                            race_links.append(full_url)
        
        self.stats['pages_scraped'] += 1
        self.logger.debug(f"Found {len(race_links)} race links on page {page_num}")
        
        return race_links
    
    def scrape_race_details(self, race_url: str) -> bool:
        """
        Scrape individual race details and save to database

        Args:
            race_url: URL of the race page to scrape

        Returns:
            True if race was successfully scraped, False otherwise
        """
        # Skip if already processed in this session
        if race_url in self.processed_urls:
            self.logger.debug(f"Already processed in session: {race_url}")
            self.stats['skipped_races'] += 1
            return False

        self.logger.debug(f"Scraping race: {race_url}")

        # Fetch page content
        response = get_page_with_retry(self.session, race_url)
        if not response:
            self.logger.error(f"Failed to fetch race page: {race_url}")
            self.stats['errors'] += 1
            return False

        try:
            soup = BeautifulSoup(response.content, 'html.parser')

            # Use ONLY card metadata - no page data extraction
            if race_url in self.card_metadata:
                card_data = self.card_metadata[race_url]
                base_race_name = card_data.get('name', 'Unknown Race')
                race_date = card_data.get('date', DEFAULT_DATE)

                self.logger.debug(f"Using card data only: name='{base_race_name}', date='{race_date}'")
            else:
                # No card metadata available - skip this race
                self.logger.warning(f"No card metadata available for {race_url}, skipping race")
                self.stats['errors'] += 1
                return False

            if race_date != DEFAULT_DATE:
                # Check for multi-stage races with etapes
                etape_stages = self._find_etape_stages(soup)

                if etape_stages:
                    # Process each etape as a separate race
                    self.logger.info(f"Found {len(etape_stages)} etapes for race: {base_race_name}")
                    races_processed = 0

                    for i, etape_info in enumerate(etape_stages):
                        try:
                            self.logger.info(f"Starting etape {i+1}/{len(etape_stages)}: {etape_info['etape_name']}")
                            etape_name = f"{base_race_name} - {etape_info['etape_name']}"
                            race_id = generate_race_id(etape_name, race_date, race_url + f"#{etape_info['payload']}")

                            self.logger.debug(f"Processing etape: {etape_name} with race_id: {race_id}")

                            # Check if this etape already exists
                            if self.db.race_exists(race_id):
                                self.logger.info(f"Etape already exists, skipping: {etape_name}")
                                continue

                            # Find results table for this etape
                            self.logger.debug(f"Looking for results table with payload: {etape_info['payload']}")
                            results_table = self._find_etape_results_table(soup, etape_info['payload'])
                            if not results_table:
                                self.logger.warning(f"No results table found for etape: {etape_info['etape_name']}")
                                continue

                            self.logger.debug(f"Found results table for etape: {etape_info['etape_name']}")

                            # Add etape race to database
                            self.db.add_or_update_race(race_id, race_date, etape_name)
                            self.stats['new_races'] += 1
                            self.logger.debug(f"Added etape race to database: {etape_name}")

                            # Process participants for this etape
                            participants_added = self._process_race_participants(results_table, race_id)

                            self.logger.info(f"Etape processed successfully: {etape_name} with {participants_added} participants")
                            races_processed += 1
                        except Exception as e:
                            self.logger.error(f"Error processing etape {i+1} ({etape_info['etape_name']}): {str(e)}")
                            self.stats['errors'] += 1
                            import traceback
                            self.logger.debug(f"Traceback: {traceback.format_exc()}")
                            continue  # Continue with next etape instead of failing entirely

                    self.processed_urls.add(race_url)
                    return races_processed > 0

                else:
                    # Standard single race processing
                    race_id = generate_race_id(base_race_name, race_date, race_url)

                    # Check if race already exists in database
                    if self.db.race_exists(race_id):
                        self.logger.debug(f"Race already exists: {base_race_name} ({race_date})")
                        self.stats['skipped_races'] += 1
                        self.processed_urls.add(race_url)
                        return False

                    # Find results table
                    results_table = find_results_table(soup, RESULTS_TABLE_SELECTORS)
                    if not results_table:
                        self.logger.warning(f"No results table found: {race_url}")
                        self.stats['errors'] += 1
                        return False

                    # Add race to database
                    self.db.add_or_update_race(race_id, race_date, base_race_name)
                    self.stats['new_races'] += 1

                    # Process participants
                    participants_added = self._process_race_participants(
                        results_table, race_id
                    )

                    self.logger.info(
                        SUCCESS_MESSAGES['race_scraped'].format(
                            count=participants_added, race_id=race_id
                        )
                    )

                    self.processed_urls.add(race_url)
                    return True
            else:
                return False

        except Exception as e:
            self.logger.error(f"Error processing race {race_url}: {e}")
            self.stats['errors'] += 1
            return False
    
    def _process_race_participants(self, results_table, race_id: str) -> int:
        """
        Process participants from results table

        Args:
            results_table: BeautifulSoup table element
            race_id: Race ID for database storage

        Returns:
            Number of participants successfully added
        """
        rows = results_table.find_all('tr')
        participants_added = 0

        # Count total participants (excluding header row)
        total_participants = len(rows) - 1 if len(rows) > 1 else 0

        for row in rows[1:]:  # Skip header row
            try:
                participant_data = extract_participant_data(row)
                if not participant_data:
                    continue

                # Add cyclist to database
                self.db.add_or_update_cyclist(
                    uci_id=participant_data['uci_id'],
                    first_name=participant_data['first_name'],
                    last_name=participant_data['last_name'],
                    region=participant_data['region'],
                    club=participant_data['club_clean'],
                    club_raw=participant_data['club_raw']
                )

                # Add race result with participant count
                self.db.add_race_result(
                    race_id=race_id,
                    uci_id=participant_data['uci_id'],
                    rank=participant_data['rank'],
                    race_participant_count=total_participants,
                    raw_data=participant_data['raw_data']
                )

                participants_added += 1
                self.stats['new_results'] += 1

            except Exception as e:
                self.logger.warning(f"Error processing participant: {e}")
                self.stats['errors'] += 1
                continue

        return participants_added

    def _find_etape_stages(self, soup) -> List[Dict[str, str]]:
        """
        Find etape stages and category-based leaderboards in multi-stage races

        Args:
            soup: BeautifulSoup object of the race page

        Returns:
            List of dictionaries with etape/category information
        """
        import re

        etape_stages = []

        # Pattern to match category leaderboards anywhere in text:
        # - Access categories: A1, A2, A3, A4, A1-A2, A1A2, A3-A4, A3A4, ACCESS 1 2, ACCESS 3 4, ACCESS 1-2, ACCESS 3-4, Access 1.2, Access 3.4, ACCESS 1 & 2, ACCESS 3 & 4
        # - Youth categories: U7, U9, U11, U13, U15, U17, U-7, U-9, U-11, U-13, U-15, U-17, U 7, U 9, U 11, U 13, U 15, U 17
        category_pattern = r'\b(A[1-4](-?A[1-4])?|A[1-4]-[1-4]|A(cces|cces)s?\s*[1-4](\s*[2-4]|-[2-4]|\.?[2-4]|\s*&\s*[2-4])?|U-?\s*[7-9]|U-?\s*1[1357])\b'

        def is_category_or_etape(text: str) -> bool:
            """Check if text contains etape or matches category pattern"""
            # Check for etape
            if any(etape_word in text for etape_word in ['Etape', 'etape', 'Étape']):
                return True
            # Check for category pattern anywhere in text (using search instead of match)
            if re.search(category_pattern, text, re.IGNORECASE):
                return True
            return False

        def extract_category_name(text: str) -> str:
            """Extract the category name from text (e.g., 'A1-A2' from 'Classement: A1-A2')"""
            # First check for etape
            for etape_word in ['Etape', 'etape', 'Étape']:
                if etape_word in text:
                    # Extract the etape part
                    match = re.search(r'(Étape|Etape|etape)\s*\d+', text, re.IGNORECASE)
                    if match:
                        return match.group(0)
                    return text  # Return full text if no match

            # Extract category pattern
            match = re.search(category_pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)

            return text  # Fallback to full text

        # First try: Look for <li> elements with select2-results__option class (original approach)
        li_elements = soup.find_all('li', class_='select2-results__option')

        for li in li_elements:
            # Get the text content to check for etape or category
            li_text = li.get_text().strip()

            # Check if this li contains "Etape" or matches category pattern
            if is_category_or_etape(li_text):
                # Extract payload from id attribute
                li_id = li.get('id', '')

                # Parse id like "select2-resultCategory-result-29be-ranking1" to extract "ranking1"
                if li_id and '-' in li_id:
                    payload = li_id.split('-')[-1]  # Get last part after final dash

                    if payload:
                        category_name = extract_category_name(li_text)
                        etape_stages.append({
                            'etape_name': category_name,
                            'payload': payload
                        })
                        self.logger.debug(f"Found etape/category (li method): {category_name} with payload: {payload}")

        # Second try: Look for <select> elements with <option> children (new approach)
        if not etape_stages:
            select_elements = soup.find_all('select')

            for select in select_elements:
                options = select.find_all('option')

                for option in options:
                    option_text = option.get_text().strip()
                    option_value = option.get('value', '')

                    # Check if this option contains "Etape" or matches category pattern
                    if is_category_or_etape(option_text):
                        if option_value:
                            category_name = extract_category_name(option_text)
                            etape_stages.append({
                                'etape_name': category_name,
                                'payload': option_value
                            })
                            self.logger.debug(f"Found etape/category (select method): {category_name} with payload: {option_value}")

        return etape_stages

    def _find_etape_results_table(self, soup, payload: str):
        """
        Find the results table for a specific etape payload

        Args:
            soup: BeautifulSoup object of the race page
            payload: The payload identifier (e.g., "ranking1")

        Returns:
            BeautifulSoup table element or None
        """
        # Look for a div with id or class containing the payload
        target_div = None

        # Try to find div with id containing payload
        target_div = soup.find('div', id=payload)

        # If not found by id, try to find by class or data attributes
        if not target_div:
            target_div = soup.find('div', class_=payload)

        # If still not found, try data attributes or other selectors
        if not target_div:
            target_div = soup.find('div', attrs={'data-category': payload})

        # If still not found, search for divs containing the payload in any attribute
        if not target_div:
            for div in soup.find_all('div'):
                div_attrs = div.attrs
                for attr_name, attr_value in div_attrs.items():
                    if isinstance(attr_value, str) and payload in attr_value:
                        target_div = div
                        break
                    elif isinstance(attr_value, list) and any(payload in val for val in attr_value):
                        target_div = div
                        break
                if target_div:
                    break

        if target_div:
            self.logger.debug(f"Found target div for payload: {payload}")

            # Look for results table within this div using existing selectors
            from backend.config.constants import RESULTS_TABLE_SELECTORS

            for selector in RESULTS_TABLE_SELECTORS:
                table = target_div.select_one(selector)
                if table:
                    self.logger.debug(f"Found results table with selector: {selector}")
                    return table

            # If no table found with standard selectors, try generic table search
            table = target_div.find('table')
            if table:
                self.logger.debug("Found results table with generic table selector")
                return table

        self.logger.warning(f"No results table found for payload: {payload}")
        return None

    def _process_card_date(self, raw_date: str) -> str:
        """
        Process card date text to handle multi-day formats and convert months

        Examples:
        - "u 25 Maiau 26 Mai2024" -> "25 mai 2024"
        - "31 mai 2025" -> "31 mai 2025"

        Args:
            raw_date: Raw date text from card

        Returns:
            Processed date string with first day only and converted months
        """
        if not raw_date:
            return ""

        import re

        # Handle multi-day format without proper spacing: "u 25 Maiau 26 Mai2024"
        # Look for pattern: optional "u " + day + month + "au" + day + month + year
        multi_day_no_space_pattern = r'u?\s*(\d{1,2}\s+\w+?)au\s*\d{1,2}\s+\w+?(\d{4})'
        match = re.search(multi_day_no_space_pattern, raw_date, re.IGNORECASE)

        if match:
            first_day_month = match.group(1).strip()
            year = match.group(2).strip()
            processed_date = f"{first_day_month} {year}"
            self.logger.debug(f"Extracted first day from multi-day race (no-space): '{raw_date}' -> '{processed_date}'")
        else:
            # Handle standard multi-day format: "Du 25 Mai au 26 Mai 2024" (with spaces)
            multi_day_pattern = r'Du\s+(\d{1,2}\s+\w+).*?(\d{4})'
            match = re.search(multi_day_pattern, raw_date, re.IGNORECASE)

            if match:
                first_day = match.group(1).strip()
                year = match.group(2).strip()
                processed_date = f"{first_day} {year}"
                self.logger.debug(f"Extracted first day from multi-day race: '{raw_date}' -> '{processed_date}'")
            else:
                # Single day format, just clean up
                processed_date = raw_date.strip()
                # Remove extra spaces
                processed_date = re.sub(r'\s+', ' ', processed_date)

        # Import and use the convert function
        from backend.utils.scraper_utils import convert_abbreviated_months_to_french
        final_date = convert_abbreviated_months_to_french(processed_date)

        self.logger.debug(f"Final processed date: '{raw_date}' -> '{final_date}'")
        return final_date

    def discover_all_races(self) -> List[str]:
        """
        Discover all race URLs by paginating through the results
        
        Returns:
            List of unique race URLs
        """
        self.logger.info("Starting race discovery...")
        
        page_num = 1
        all_race_links = []
        
        with ScrapingProgressLogger(self.logger, "race discovery", MAX_PAGES) as progress:
            while page_num <= MAX_PAGES:
                race_links = self.scrape_race_list_page(page_num)
                
                if not race_links:
                    self.logger.info(f"No more races found on page {page_num}")
                    break
                
                all_race_links.extend(race_links)
                progress.log_item(f"page {page_num} ({len(race_links)} races)", True)
                
                page_num += 1
                time.sleep(RATE_LIMIT_DELAY)
        
        # Remove duplicates while preserving order
        unique_race_links = list(dict.fromkeys(all_race_links))
        
        self.logger.info(f"Discovery complete: {len(unique_race_links)} unique races found")
        return unique_race_links
    
    def scrape_all_races(self) -> None:
        """Main method to scrape all races with progress tracking"""
        try:
            # Discover all race URLs
            race_urls = self.discover_all_races()
            
            if not race_urls:
                self.logger.warning("No races found to scrape")
                return
            
            # Scrape each race
            self.logger.info(f"Starting to scrape {len(race_urls)} races...")
            
            with ScrapingProgressLogger(self.logger, "race scraping", len(race_urls)) as progress:
                for i, race_url in enumerate(race_urls, 1):
                    success = self.scrape_race_details(race_url)
                    
                    # Log progress based on success
                    if success:
                        progress.log_item(f"race {i}", True)
                    else:
                        if race_url in self.processed_urls:
                            progress.log_skip(f"race {i}", "already exists")
                        else:
                            progress.log_item(f"race {i}", False)
                    
                    # Rate limiting
                    time.sleep(RATE_LIMIT_DELAY)
            
            # Update scraping metadata
            self._update_scraping_metadata()
            
            # Print final summary
            self.print_summary()
            
        except KeyboardInterrupt:
            self.logger.info("Scraping interrupted by user")
            self.print_summary()
            raise
        except Exception as e:
            self.logger.error(f"Scraping failed: {e}")
            self.print_summary()
            raise
    
    def _update_scraping_metadata(self) -> None:
        """Update scraping metadata in database"""
        try:
            db_stats = self.db.get_database_stats()
            self.db.update_scraping_info(
                total_races=db_stats['total_races'],
                total_racers=db_stats['total_cyclists']
            )
            self.logger.debug("Scraping metadata updated")
        except Exception as e:
            self.logger.error(f"Failed to update scraping metadata: {e}")
    
    def print_summary(self) -> None:
        """Print comprehensive scraping summary"""
        # Log scraping statistics
        log_summary(self.logger, self.stats, "Scraping")
        
        # Log database statistics
        try:
            db_stats = self.db.get_database_stats()
            log_database_stats(self.logger, db_stats)
        except Exception as e:
            self.logger.error(f"Failed to get database stats: {e}")
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - cleanup resources"""
        if self.session:
            self.session.close()
        
        if exc_type is not None:
            self.logger.error(f"Scraper exiting due to exception: {exc_val}")


def main():
    """Main function to run the optimized database scraper"""
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Optimized cycling results scraper with region support')
    parser.add_argument('--region', '-r', 
                       choices=list(AVAILABLE_REGIONS.keys()),
                       default=DEFAULT_REGION,
                       help=f'Region to scrape (default: {DEFAULT_REGION})')
    parser.add_argument('--db-path', '-d',
                       default=DEFAULT_DB_PATH,
                       help=f'Database path (default: {DEFAULT_DB_PATH})')
    
    # Support legacy usage: python script.py [db_path] [region]
    if len(sys.argv) > 1 and not sys.argv[1].startswith('-'):
        # Legacy mode: first arg is db_path, second is region
        db_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DB_PATH
        region = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_REGION
        
        # Validate region
        if region not in AVAILABLE_REGIONS:
            print(f"Invalid region: {region}")
            print(f"Available regions: {', '.join(AVAILABLE_REGIONS.keys())}")
            sys.exit(1)
    else:
        # New argument parsing mode
        args = parser.parse_args()
        db_path = args.db_path
        region = args.region
    
    # Initialize logging
    logger = get_scraper_logger()
    
    try:
        logger.info("Starting optimized cycling results scraper (Database version)")
        logger.info(f"Target region: {AVAILABLE_REGIONS[region]} ({region})")
        logger.info("This may take a while depending on the number of races")
        
        # Use context manager for proper cleanup
        with OptimizedCyclingScraperDB(db_path, region) as scraper:
            scraper.scrape_all_races()
        
        logger.info("Scraping completed successfully!")
        
    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()