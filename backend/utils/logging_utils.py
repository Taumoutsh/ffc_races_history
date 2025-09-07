"""
Logging configuration and utilities
Centralized logging setup for the Race Cycling History App
"""

import logging
import sys
from typing import Optional
from pathlib import Path

from backend.config.constants import LOG_LEVEL, LOG_FORMAT, LOG_DATE_FORMAT


def setup_logging(
    name: str = 'race_cycling',
    level: Optional[str] = None,
    log_file: Optional[str] = None,
    console: bool = True
) -> logging.Logger:
    """
    Set up logging configuration
    
    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional log file path
        console: Whether to log to console
        
    Returns:
        Configured logger instance
    """
    # Get logger
    logger = logging.getLogger(name)
    
    # Prevent duplicate handlers
    if logger.handlers:
        return logger
    
    # Set level
    log_level = getattr(logging, (level or LOG_LEVEL).upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # Create formatter
    formatter = logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT)
    
    # Console handler
    if console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        console_handler.setLevel(log_level)
        logger.addHandler(console_handler)
    
    # File handler
    if log_file:
        # Create log directory if needed
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        file_handler.setLevel(log_level)
        logger.addHandler(file_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with default configuration
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Configured logger instance
    """
    return setup_logging(name)


class ScrapingProgressLogger:
    """Context manager for logging scraping progress"""
    
    def __init__(self, logger: logging.Logger, operation: str, total: int):
        self.logger = logger
        self.operation = operation
        self.total = total
        self.current = 0
        self.success_count = 0
        self.error_count = 0
    
    def __enter__(self):
        self.logger.info(f"Starting {self.operation} - {self.total} items to process")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.logger.info(
                f"Completed {self.operation} - "
                f"Success: {self.success_count}, "
                f"Errors: {self.error_count}, "
                f"Total: {self.current}/{self.total}"
            )
        else:
            self.logger.error(
                f"Failed {self.operation} - "
                f"Error: {exc_val}"
            )
    
    def log_item(self, item_name: str, success: bool = True):
        """Log progress for a single item"""
        self.current += 1
        
        if success:
            self.success_count += 1
            self.logger.debug(f"{item_name} ({self.current}/{self.total})")
        else:
            self.error_count += 1
            self.logger.warning(f"{item_name} ({self.current}/{self.total})")
        
        # Log milestone progress
        if self.current % 10 == 0 or self.current == self.total:
            percentage = (self.current / self.total * 100) if self.total > 0 else 0
            self.logger.info(
                f"Progress: {self.current}/{self.total} ({percentage:.1f}%) - "
                f"Success: {self.success_count}, Errors: {self.error_count}"
            )
    
    def log_skip(self, item_name: str, reason: str = ""):
        """Log skipped item"""
        self.current += 1
        skip_msg = f"⏭️  Skipped {item_name}"
        if reason:
            skip_msg += f" ({reason})"
        skip_msg += f" ({self.current}/{self.total})"
        self.logger.debug(skip_msg)


def log_summary(logger: logging.Logger, stats: dict, operation: str = "Operation"):
    """
    Log a summary of scraping statistics
    
    Args:
        logger: Logger to use
        stats: Statistics dictionary
        operation: Operation name for logging
    """
    logger.info(f"\n--- {operation} Summary ---")
    
    for key, value in stats.items():
        # Format key for display
        display_key = key.replace('_', ' ').title()
        logger.info(f"{display_key}: {value}")


def log_database_stats(logger: logging.Logger, stats: dict):
    """
    Log database statistics
    
    Args:
        logger: Logger to use
        stats: Database statistics dictionary
    """
    logger.info("\n--- Database Statistics ---")
    logger.info(f"Total races: {stats.get('total_races', 0)}")
    logger.info(f"Total cyclists: {stats.get('total_cyclists', 0)}")
    logger.info(f"Total results: {stats.get('total_results', 0)}")
    
    if 'latest_race' in stats:
        latest = stats['latest_race']
        logger.info(f"Latest race: {latest.get('name', 'Unknown')} ({latest.get('date', 'Unknown')})")


def configure_requests_logging(level: str = 'WARNING'):
    """
    Configure logging for requests library to reduce noise
    
    Args:
        level: Log level for requests
    """
    logging.getLogger('requests').setLevel(getattr(logging, level.upper()))
    logging.getLogger('urllib3').setLevel(getattr(logging, level.upper()))


# Pre-configured loggers for common use cases
def get_scraper_logger() -> logging.Logger:
    """Get logger configured for scraping operations"""
    configure_requests_logging()  # Reduce requests noise
    return setup_logging('scraper', console=True, log_file='logs/scraper.log')


def get_database_logger() -> logging.Logger:
    """Get logger configured for database operations"""
    return setup_logging('database', console=True, log_file='logs/database.log')


def get_api_logger() -> logging.Logger:
    """Get logger configured for API operations"""
    return setup_logging('api', console=True, log_file='logs/api.log')