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
    BASE_URL, DEFAULT_DATE, RACE_SEARCH_PARAMS, RATE_LIMIT_DELAY, MAX_PAGES,
    RACE_LINK_SELECTORS, RESULTS_TABLE_SELECTORS, USER_AGENT,
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
    
    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        """Initialize the scraper with database connection and logging"""
        self.logger = get_scraper_logger()
        self.db_path = db_path
        
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
    
    def scrape_race_list_page(self, page_num: int) -> List[str]:
        """
        Scrape race links from a single listing page
        
        Args:
            page_num: Page number to scrape
            
        Returns:
            List of race URLs found on the page
        """
        url = build_search_url(BASE_URL + "/resultats/", RACE_SEARCH_PARAMS, page_num)
        
        self.logger.debug(f"Scraping page {page_num}: {url}")
        
        response = get_page_with_retry(self.session, url)
        if not response:
            self.logger.error(f"Failed to fetch page {page_num}")
            self.stats['errors'] += 1
            return []
        
        soup = BeautifulSoup(response.content, 'html.parser')
        race_links = []
        
        # Find race links using configured selectors
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
            
            # Extract race information
            race_title = soup.find('h1')
            race_name = race_title.get_text().strip() if race_title else "Unknown Race"
            race_date = extract_race_date(soup)

            if race_date != DEFAULT_DATE:
                # Generate race ID
                race_id = generate_race_id(race_name, race_date, race_url)
                
                # Check if race already exists in database
                if self.db.race_exists(race_id):
                    self.logger.debug(f"Race already exists: {race_name} ({race_date})")
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
                self.db.add_or_update_race(race_id, race_date, race_name)
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
                
                # Add race result
                self.db.add_race_result(
                    race_id=race_id,
                    uci_id=participant_data['uci_id'],
                    rank=participant_data['rank'],
                    raw_data=participant_data['raw_data']
                )
                
                participants_added += 1
                self.stats['new_results'] += 1
                
            except Exception as e:
                self.logger.warning(f"Error processing participant: {e}")
                self.stats['errors'] += 1
                continue
        
        return participants_added
    
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
    # Parse command line arguments
    db_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DB_PATH
    
    # Initialize logging
    logger = get_scraper_logger()
    
    try:
        logger.info("Starting optimized cycling results scraper (Database version)")
        logger.info("This may take a while depending on the number of races")
        
        # Use context manager for proper cleanup
        with OptimizedCyclingScraperDB(db_path) as scraper:
            scraper.scrape_all_races()
        
        logger.info("Scraping completed successfully!")
        
    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()