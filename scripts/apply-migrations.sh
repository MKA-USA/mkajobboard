#!/bin/bash

# Script to apply Supabase migrations

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first."
    echo "Visit https://supabase.com/docs/guides/cli for installation instructions."
    exit 1
fi

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="$PROJECT_DIR/supabase/migrations"

echo "Applying migrations from $MIGRATIONS_DIR"

# Check if the migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "Migrations directory does not exist: $MIGRATIONS_DIR"
    exit 1
fi

# Count migration files
MIGRATION_COUNT=$(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo "No migration files found in $MIGRATIONS_DIR"
    exit 1
fi

echo "Found $MIGRATION_COUNT migration files"

# Apply migrations using Supabase CLI
# This will use the current Supabase project linked to this directory
echo "Applying migrations to Supabase project..."

# Check if this is a local or remote project
if supabase status &> /dev/null; then
    # Local project
    echo "Applying to local Supabase project..."
    supabase db reset
    echo "Migrations applied successfully to local project"
else
    # Remote project
    echo "Applying to remote Supabase project..."
    echo "Please make sure you're logged in to Supabase CLI and have linked this project"
    
    # Prompt for confirmation before applying to remote project
    read -p "Are you sure you want to apply migrations to the remote Supabase project? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Migration aborted"
        exit 1
    fi
    
    supabase db push
    echo "Migrations applied successfully to remote project"
fi

echo "Setting up admin JWT claim..."
echo "Please go to Supabase Dashboard > Authentication > JWT Templates"
echo "Add the following custom claim:"
echo "  \"is_admin\": \"(select value::text from (select is_admin_claim() as value) as x)\""

echo "Migration process completed successfully!" 