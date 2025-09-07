"""
Configuration constants for Race Cycling History App
Centralized configuration management for scrapers, database, and API
"""

import os
from typing import List, Dict

# =============================================================================
# WEB SCRAPING CONFIGURATION
# =============================================================================

# Base URLs
BASE_URL = "https://paysdelaloirecyclisme.fr"
RESULTS_BASE_URL = f"{BASE_URL}/resultats/"

# Query parameters for race search
RACE_SEARCH_PARAMS = {
    "_region": "pays-de-la-loire",
    "_discipline": "route", 
    "_type_de_courses": "regional",
    "_licence": "access-1"
}

# HTTP Configuration
REQUEST_TIMEOUT = 10  # seconds
MAX_RETRIES = 3
RETRY_BACKOFF_FACTOR = 2  # exponential backoff: 2^attempt seconds
RATE_LIMIT_DELAY = 1  # seconds between requests

# User agent for requests
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Safety limits
MAX_PAGES = 100  # prevent infinite loops in pagination
MAX_RACES_PER_SESSION = 1000  # reasonable limit for scraping

# =============================================================================
# HTML SELECTORS AND PATTERNS
# =============================================================================

# Race listing page selectors
RACE_LINK_SELECTORS = [
    'a[class*="card-result"]'
]

# Race detail page selectors
RACE_TITLE_SELECTORS = ['h1']

DATE_SELECTORS = [
    '.race-date',
    '.date', 
    '[class*="date"]',
    'time',
    '.event-date',
    'h1', 'h2', 'h3',  # Sometimes date is in title
    '.card-title',
    '.card-body'
]

RESULTS_TABLE_SELECTORS = [
    'table.results',
    'table.leaderboard', 
    'table[class*="result"]',
    'table[class*="classement"]',
    '.results-table table',
    'table'
]

# =============================================================================
# DATE PATTERNS AND PARSING
# =============================================================================

# French date patterns (most common format)
FRENCH_DATE_PATTERNS = [
    r'(\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4})',
    r'(\d{1,2}\s+(?:jan|fév|mar|avr|mai|juin|juil|août|sept|oct|nov|déc)\s+\d{4})',
]

# Generic date patterns (fallback)
GENERIC_DATE_PATTERNS = [
    r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
    r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
    r'(\d{1,2}\s+\w+\s+\d{4})'
]

# Default fallback date
DEFAULT_DATE = "Date inconnue"

# =============================================================================
# DATA VALIDATION AND FILTERING
# =============================================================================

# Minimum required data for valid participant
MIN_PARTICIPANT_CELLS = 4
MIN_RAW_DATA_LENGTH = 4

# Header-like entries to skip
HEADER_KEYWORDS = ['nom', 'name', 'coureur', 'rider', 'prenom']

# Club name cleaning pattern
CLUB_NUMBER_PATTERN = r'^\d+\s*'

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# Default database path
DEFAULT_DB_PATH = "backend/database/cycling_data.db"

# Database connection settings
DB_TIMEOUT = 30  # seconds
DB_ISOLATION_LEVEL = None  # autocommit mode

# Schema file
SCHEMA_FILE = "backend/database/schema.sql"

# =============================================================================
# API CONFIGURATION  
# =============================================================================

# Default API settings
DEFAULT_API_PORT = 3001
DEFAULT_API_HOST = "0.0.0.0"
API_DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# Search limits
MAX_SEARCH_RESULTS = 50
MAX_CYCLIST_HISTORY = 1000

# =============================================================================
# FILE PATHS AND DIRECTORIES
# =============================================================================

# Default YAML file (legacy support)
DEFAULT_YAML_FILE = "public/data.yaml"

# Directory paths
DATABASE_DIR = "backend/database"
CONFIG_DIR = "backend/config"
API_DIR = "backend/api"

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

# Log levels
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

# Log format
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

# =============================================================================
# RACE ID GENERATION
# =============================================================================

# Race ID prefix
RACE_ID_PREFIX = "race_"

# Hash length for fallback race IDs
RACE_ID_HASH_LENGTH = 8

# =============================================================================
# ERROR MESSAGES
# =============================================================================

ERROR_MESSAGES = {
    'no_results_table': "No results table found",
    'no_race_title': "No race title found", 
    'request_failed': "HTTP request failed",
    'parse_error': "Failed to parse race data",
    'database_error': "Database operation failed",
    'invalid_data': "Invalid or incomplete data"
}

# =============================================================================
# SUCCESS MESSAGES
# =============================================================================

SUCCESS_MESSAGES = {
    'race_scraped': "Added {count} participants to race {race_id}",
    'race_skipped': "Skipping already scraped race: {name} ({date})",
    'scraping_complete': "Scraping completed successfully!",
    'database_ready': "Database initialized successfully"
}

# =============================================================================
# ENVIRONMENT VARIABLES
# =============================================================================

def get_env_var(key: str, default=None, var_type=str):
    """Get environment variable with type conversion"""
    value = os.environ.get(key, default)
    if value is None:
        return default
    
    if var_type == bool:
        if isinstance(value, bool):
            return value
        return str(value).lower() in ('true', '1', 'yes', 'on')
    elif var_type == int:
        return int(value)
    elif var_type == float:
        return float(value)
    else:
        return str(value)

# Runtime configuration from environment
DB_PATH = get_env_var('DB_PATH', DEFAULT_DB_PATH, str)
API_PORT = get_env_var('PORT', DEFAULT_API_PORT, int)
DEBUG_MODE = get_env_var('DEBUG', False, bool)