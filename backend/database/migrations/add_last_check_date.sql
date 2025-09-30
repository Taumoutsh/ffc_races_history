-- Migration: Add last_check_date column to followed_cyclists table
-- Date: 2025-09-30
-- Description: Track when users last viewed a followed cyclist's profile

-- Add the last_check_date column if it doesn't exist
-- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we need to check first
-- This will fail silently if the column already exists

ALTER TABLE followed_cyclists ADD COLUMN last_check_date DATETIME;
