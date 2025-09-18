"""
Utility functions for web scraping and data processing
Shared utilities used across different scraper implementations
"""

import re
import time
import hashlib
import logging
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import requests

from backend.config.constants import (
    FRENCH_DATE_PATTERNS, GENERIC_DATE_PATTERNS, DEFAULT_DATE,
    CLUB_NUMBER_PATTERN, HEADER_KEYWORDS, MIN_PARTICIPANT_CELLS,
    REQUEST_TIMEOUT, MAX_RETRIES, RETRY_BACKOFF_FACTOR,
    DATE_SELECTORS, RACE_ID_PREFIX, RACE_ID_HASH_LENGTH,
    ERROR_MESSAGES
)

# Set up logging
logger = logging.getLogger(__name__)


class ScrapingError(Exception):
    """Custom exception for scraping-related errors"""
    pass


def clean_club_name(club_raw: str) -> Optional[str]:
    """
    Remove leading numbers from club names
    
    Args:
        club_raw: Raw club name (e.g., "5244197 VC ST SEBASTIEN")
        
    Returns:
        Cleaned club name (e.g., "VC ST SEBASTIEN") or None if empty
    """
    if not club_raw:
        return None
    
    # Remove leading numbers and spaces
    cleaned = re.sub(CLUB_NUMBER_PATTERN, '', club_raw.strip())
    return cleaned if cleaned else club_raw


def normalize_text(text: str) -> str:
    """
    Normalize text by removing extra whitespace
    
    Args:
        text: Input text to normalize
        
    Returns:
        Normalized text with single spaces
    """
    if not text:
        return ""
    
    return re.sub(r'\s+', ' ', text).strip()


def is_header_entry(first_name: str, last_name: str) -> bool:
    """
    Check if entry appears to be a table header
    
    Args:
        first_name: First name to check
        last_name: Last name to check
        
    Returns:
        True if this appears to be a header entry
    """
    first_lower = first_name.lower() if first_name else ""
    last_lower = last_name.lower() if last_name else ""
    
    return (first_lower in HEADER_KEYWORDS or 
            last_lower in HEADER_KEYWORDS)


def convert_abbreviated_months_to_french(date_text: str) -> str:
    """
    Convert abbreviated French month names to full French month names

    Args:
        date_text: Date text that may contain abbreviated French months (e.g. "Sep")

    Returns:
        Date text with French full month names (e.g. "septembre")
    """
    french_abbreviated_to_full = {
        'jan': 'janvier',
        'fév': 'février',
        'fev': 'février',  # Handle without accent
        'mar': 'mars',
        'avr': 'avril',
        'mai': 'mai',
        'jun': 'juin',
        'juin': 'juin',
        'jui': 'juillet',
        'jul': 'juillet',  # Alternative abbreviation
        'juil': 'juillet',  # Alternative abbreviation
        'aoû': 'août',
        'aou': 'août',     # Handle without accent
        'août': 'août',     # Handle without accent
        'sep': 'septembre',
        'sept': 'septembre',
        'oct': 'octobre',
        'nov': 'novembre',
        'déc': 'décembre',
        'dec': 'décembre'  # Handle without accent
    }

    # Convert the date text
    converted_text = date_text
    for fr_abbrev, fr_full in french_abbreviated_to_full.items():
        # Case-insensitive replacement
        converted_text = re.sub(r'\b' + re.escape(fr_abbrev) + r'\b', fr_full, converted_text, flags=re.IGNORECASE)

    return converted_text


def extract_race_date(soup: BeautifulSoup) -> str:
    """
    Extract race date from HTML soup using header-race__date div only
    
    Args:
        soup: BeautifulSoup object of the race page
        
    Returns:
        Extracted date string or default fallback
    """
    # Only look for date in header-race__date div
    date_elem = soup.select_one('.header-race__date')
    
    if date_elem:
        date_text = date_elem.get_text().strip()
        logger.debug(f"Found date element: {date_text}")

        # Convert abbreviated English months to French if present
        date_text = convert_abbreviated_months_to_french(date_text)
        logger.debug(f"Date after month conversion: {date_text}")

        # Try French date patterns first
        for pattern in FRENCH_DATE_PATTERNS:
            match = re.search(pattern, date_text, re.IGNORECASE)
            if match:
                logger.debug(f"Found French date: {match.group(1)}")
                return match.group(1)

        # Try generic date patterns
        for pattern in GENERIC_DATE_PATTERNS:
            match = re.search(pattern, date_text)
            if match:
                logger.debug(f"Found date: {match.group(1)}")
                return match.group(1)

        # If no pattern matches, return the raw text as fallback
        if date_text:
            logger.debug(f"Using raw date text: {date_text}")
            return date_text
    
    logger.warning("No date found in header-race__date div, using default")
    return DEFAULT_DATE


def generate_race_id(race_name: str, race_date: str, race_url: str) -> str:
    """
    Generate a unique race ID based on URL, name, and date

    Args:
        race_name: Name of the race
        race_date: Date of the race
        race_url: URL of the race page

    Returns:
        Unique race ID string
    """
    # Extract unique identifier from URL (preferred method)
    parsed_url = urlparse(race_url)
    url_path = parsed_url.path

    if url_path and '/resultats/' in url_path:
        # Extract race ID from URL (e.g., /resultats/race-name-slug)
        path_parts = url_path.strip('/').split('/')
        if len(path_parts) >= 2:
            url_id = path_parts[-1]  # Last part of URL

            # Include fragment (hash) if present for multi-stage races
            if parsed_url.fragment:
                url_id = f"{url_id}_{parsed_url.fragment}"

            race_id = f"{RACE_ID_PREFIX}{url_id}"
            logger.debug(f"Generated URL-based race ID: {race_id}")
            return race_id

    # Fallback: hash name and date (include URL for uniqueness)
    content = f"{race_name}_{race_date}_{race_url}".encode('utf-8')
    hash_short = hashlib.md5(content).hexdigest()[:RACE_ID_HASH_LENGTH]
    race_id = f"{RACE_ID_PREFIX}{hash_short}"
    logger.debug(f"Generated hash-based race ID: {race_id}")
    return race_id


def extract_rank(rank_text: str, fallback_rank: int = 0) -> int:
    """
    Extract numeric rank from text
    
    Args:
        rank_text: Text containing rank information
        fallback_rank: Fallback rank if parsing fails
        
    Returns:
        Numeric rank
    """
    if not rank_text:
        return fallback_rank
    
    # Clean up rank (extract first number found)
    rank_match = re.search(r'\d+', rank_text.strip())
    return int(rank_match.group()) if rank_match else fallback_rank


def get_page_with_retry(session: requests.Session, url: str, 
                       retries: int = MAX_RETRIES) -> Optional[requests.Response]:
    """
    Get page content with retry logic and exponential backoff
    
    Args:
        session: Requests session to use
        url: URL to fetch
        retries: Maximum number of retry attempts
        
    Returns:
        Response object or None if all retries failed
    """
    for attempt in range(retries):
        try:
            logger.debug(f"Fetching {url} (attempt {attempt + 1}/{retries})")
            response = session.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            return response
            
        except requests.RequestException as e:
            logger.warning(f"Attempt {attempt + 1} failed for {url}: {e}")
            
            if attempt < retries - 1:
                # Exponential backoff
                sleep_time = RETRY_BACKOFF_FACTOR ** attempt
                logger.debug(f"Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
            else:
                logger.error(f"All {retries} attempts failed for {url}")
                return None


def find_results_table(soup: BeautifulSoup, 
                      selectors: List[str]) -> Optional[BeautifulSoup]:
    """
    Find the results table using multiple selectors
    
    Args:
        soup: BeautifulSoup object to search in
        selectors: List of CSS selectors to try
        
    Returns:
        Results table element or None if not found
    """
    for selector in selectors:
        table = soup.select_one(selector)
        if table:
            logger.debug(f"Found results table with selector: {selector}")
            return table
    
    logger.warning("No results table found with any selector")
    return None


def extract_participant_data(row) -> Optional[Dict[str, Any]]:
    """
    Extract participant data from a table row
    
    Args:
        row: BeautifulSoup table row element
        
    Returns:
        Dictionary with participant data or None if invalid
    """
    cells = row.find_all(['td', 'th'])
    
    if len(cells) < MIN_PARTICIPANT_CELLS:
        return None
    
    # Extract raw data from all cells
    raw_data = [cell.get_text().strip() for cell in cells]
    
    # Skip if not enough data
    if len(raw_data) < 4:
        return None
    
    # Extract basic information
    # Typical format: [rank, uci_id, last_name, first_name, region, club, ...]
    rank_text = raw_data[0]
    uci_id = raw_data[1] if len(raw_data) > 1 else ""
    last_name = raw_data[2] if len(raw_data) > 2 else ""
    first_name = raw_data[3] if len(raw_data) > 3 else ""
    region = raw_data[4] if len(raw_data) > 4 else ""
    club_raw = raw_data[5] if len(raw_data) > 5 else ""
    
    # Validate essential data
    if not uci_id or (not last_name and not first_name):
        return None
    
    # Clean up names
    first_name = normalize_text(first_name)
    last_name = normalize_text(last_name)
    
    # Skip header-like entries
    if is_header_entry(first_name, last_name):
        return None
    
    # Extract rank
    rank = extract_rank(rank_text, len(raw_data))
    
    return {
        'uci_id': uci_id,
        'first_name': first_name,
        'last_name': last_name,
        'region': region,
        'club_raw': club_raw,
        'club_clean': clean_club_name(club_raw),
        'rank': rank,
        'raw_data': raw_data
    }


def create_session(user_agent: str) -> requests.Session:
    """
    Create a configured requests session
    
    Args:
        user_agent: User agent string to use
        
    Returns:
        Configured requests session
    """
    session = requests.Session()
    session.headers.update({
        'User-Agent': user_agent
    })
    return session


def build_search_url(base_url: str, params: Dict[str, str], page: int = 1) -> str:
    """
    Build search URL with pagination
    
    Args:
        base_url: Base URL for search
        params: Query parameters
        page: Page number
        
    Returns:
        Complete search URL
    """
    # Add pagination parameter
    params = params.copy()
    params['_pagination'] = str(page)
    
    # Build query string
    query_parts = [f"{k}={v}" for k, v in params.items()]
    query_string = "&".join(query_parts)
    
    return f"{base_url}?{query_string}"


def validate_race_data(race_data: Dict[str, Any]) -> bool:
    """
    Validate race data completeness
    
    Args:
        race_data: Race data dictionary to validate
        
    Returns:
        True if data is valid, False otherwise
    """
    required_fields = ['name', 'date']
    
    for field in required_fields:
        if not race_data.get(field):
            logger.warning(f"Missing required field: {field}")
            return False
    
    return True


def log_scraping_progress(current: int, total: int, race_name: str = "") -> None:
    """
    Log scraping progress
    
    Args:
        current: Current item number
        total: Total items to process
        race_name: Optional race name for context
    """
    percentage = (current / total * 100) if total > 0 else 0
    race_info = f" - {race_name}" if race_name else ""
    logger.info(f"Progress: {current}/{total} ({percentage:.1f}%){race_info}")