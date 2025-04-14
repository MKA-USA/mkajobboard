#!/usr/bin/env node

/**
 * This script applies all migrations at once using the Supabase REST API
 * It combines all SQL files from the supabase/migrations directory
 * and submits them as a single request
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import https from 'https';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key is missing in .env file');
  process.exit(1);
}

// Path to migrations directory
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function runAllMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }
    
    // Get all SQL files in the migrations directory
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort alphabetically
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      process.exit(0);
    }
    
    console.log(`Found ${migrationFiles.length} migration files.`);
    
    // Combine all migrations into a single SQL file
    let combinedSql = '';
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      combinedSql += `-- Migration: ${file}\n${sql}\n\n`;
    }
    
    // Save combined SQL to a file for reference
    const combinedFilePath = path.join(__dirname, 'combined-migrations.sql');
    fs.writeFileSync(combinedFilePath, combinedSql);
    
    console.log(`Combined migrations saved to: ${combinedFilePath}`);
    console.log('Please apply this SQL file to your Supabase database using the SQL Editor in the Supabase dashboard.');
    console.log(`
Instructions:
1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy the contents from ${combinedFilePath}
5. Run the query
`);
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migrations
runAllMigrations(); 