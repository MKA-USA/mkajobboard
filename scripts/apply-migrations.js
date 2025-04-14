#!/usr/bin/env node

/**
 * This script applies Supabase migrations to your database
 * It reads all SQL files from the supabase/migrations directory 
 * and executes them in alphanumeric order
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Note: In production, use service_role key

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key is missing in .env file');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to migrations directory
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

async function runMigrations() {
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
    
    // Execute each migration file sequentially
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Applying migration: ${file}`);
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error);
        process.exit(1);
      }
      
      console.log(`Successfully applied migration: ${file}`);
    }
    
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations(); 