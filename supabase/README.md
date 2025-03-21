# Supabase Schema Setup

This directory contains the necessary SQL files to set up a new Supabase instance for RoboMovie.

## Files

- `schema.sql`: Main database schema including tables, relationships, constraints, RLS policies, and triggers
- `storage.sql`: Storage bucket configuration and policies

## Schema Overview

### Core Tables
- `users`: Extended user profiles linked to auth.users
- `movie_settings`: Movie configuration and settings
- `scripts`: Script content and metadata
- `scenes`: Scene breakdowns
- `movies`: Final assembled movies
- `settings`: User preferences and API keys
- `files`: File tracking system
- `script_files`: Script file metadata

### Storage Buckets
- `scripts`: For storing script files
- `movies`: For storing movie files
- `metadata`: For storing metadata files
- `screenplays`: For storing screenplay files

## Setup Instructions

1. Create a new Supabase project

2. Run the schema setup:
   ```sql
   -- Connect to your Supabase database and run:
   \i schema.sql
   ```

3. Run the storage setup:
   ```sql
   -- After schema setup, run:
   \i storage.sql
   ```

## Security Features

- Row Level Security (RLS) enabled on all tables
- User-specific policies for data access
- Secure storage bucket access
- Data validation constraints
- Automated timestamp management

## Table Relationships

- `users` ← `movie_settings`: User's movie configurations
- `users` ← `scripts`: User's scripts
- `scripts` ← `scenes`: Script's scene breakdowns
- `scripts` ← `movies`: Movies generated from scripts
- `users` ← `settings`: User's preferences and API keys
- `users` ← `files`: User's uploaded/generated files

## Maintenance

When making schema changes:
1. Create a new migration file in the migrations directory
2. Update schema.sql to reflect the latest state
3. Test changes locally before deploying

## Notes

- All tables have RLS enabled by default
- All tables include created_at and updated_at timestamps
- Storage buckets are private by default
- File size limits and content type restrictions are enforced
