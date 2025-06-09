-- Race Cycling Database Schema
-- SQLite database for race results and cyclist performance tracking

-- Scraping metadata table
CREATE TABLE IF NOT EXISTS scraping_info (
    id INTEGER PRIMARY KEY,
    timestamp TEXT NOT NULL,
    total_races INTEGER NOT NULL,
    total_racers INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Races table
CREATE TABLE IF NOT EXISTS races (
    id TEXT PRIMARY KEY,  -- race_001, race_002, etc.
    date TEXT NOT NULL,   -- French format: "24 mai 2025"
    name TEXT NOT NULL,
    participant_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cyclists table (normalized from participants)
CREATE TABLE IF NOT EXISTS cyclists (
    uci_id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    region TEXT,
    club TEXT,
    club_raw TEXT,  -- Original club name with numbers
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Race participants/results
CREATE TABLE IF NOT EXISTS race_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    race_id TEXT NOT NULL,
    uci_id TEXT NOT NULL,
    rank INTEGER NOT NULL,
    raw_data_json TEXT,  -- Store original raw_data array as JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
    FOREIGN KEY (uci_id) REFERENCES cyclists(uci_id) ON DELETE CASCADE,
    UNIQUE(race_id, uci_id)  -- Prevent duplicate entries
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_race_results_race_id ON race_results(race_id);
CREATE INDEX IF NOT EXISTS idx_race_results_uci_id ON race_results(uci_id);
CREATE INDEX IF NOT EXISTS idx_race_results_rank ON race_results(rank);
CREATE INDEX IF NOT EXISTS idx_cyclists_name ON cyclists(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_races_date ON races(date);

-- Triggers to update participant counts
DROP TRIGGER IF EXISTS update_race_participant_count;
CREATE TRIGGER update_race_participant_count 
AFTER INSERT ON race_results
BEGIN
    UPDATE races 
    SET participant_count = (
        SELECT COUNT(*) FROM race_results WHERE race_id = NEW.race_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.race_id;
END;

DROP TRIGGER IF EXISTS update_race_participant_count_delete;
CREATE TRIGGER update_race_participant_count_delete
AFTER DELETE ON race_results
BEGIN
    UPDATE races 
    SET participant_count = (
        SELECT COUNT(*) FROM race_results WHERE race_id = OLD.race_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.race_id;
END;

-- Trigger to update cyclist updated_at
DROP TRIGGER IF EXISTS update_cyclist_timestamp;
CREATE TRIGGER update_cyclist_timestamp
AFTER UPDATE ON cyclists
BEGIN
    UPDATE cyclists SET updated_at = CURRENT_TIMESTAMP WHERE uci_id = NEW.uci_id;
END;