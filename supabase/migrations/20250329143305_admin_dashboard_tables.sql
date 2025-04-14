-- Migration: Admin Dashboard Tables
-- Description: Creates tables for admin dashboard functionality including job management, analytics, and site customization

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if pg_cron extension is available
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
    ) THEN
        CREATE EXTENSION IF NOT EXISTS "pg_cron";
    END IF;
END
$$;

-- Site Configuration Table
CREATE TABLE IF NOT EXISTS site_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logo_url TEXT,
    theme_color TEXT,
    header_font TEXT,
    body_font TEXT,
    allow_submissions BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default site configuration if table is empty
INSERT INTO site_config (logo_url, theme_color, header_font, body_font, allow_submissions)
SELECT '/logo.png', '#1E40AF', 'Inter', 'Inter', true
WHERE NOT EXISTS (SELECT 1 FROM site_config);

-- Job Postings Table
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    location TEXT,
    salary_range TEXT,
    application_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    click_count INTEGER DEFAULT 0,
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approval_date TIMESTAMP WITH TIME ZONE,
    expiration_date TIMESTAMP WITH TIME ZONE,
    submitter_email TEXT NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Click Analytics Table
CREATE TABLE IF NOT EXISTS click_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT
);

-- Email Notifications Table
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS job_postings_status_idx ON job_postings (status);
CREATE INDEX IF NOT EXISTS job_postings_submission_date_idx ON job_postings (submission_date);
CREATE INDEX IF NOT EXISTS job_postings_expiration_date_idx ON job_postings (expiration_date);
CREATE INDEX IF NOT EXISTS click_analytics_job_posting_id_idx ON click_analytics (job_posting_id);
CREATE INDEX IF NOT EXISTS email_notifications_job_posting_id_idx ON email_notifications (job_posting_id);
CREATE INDEX IF NOT EXISTS email_notifications_status_idx ON email_notifications (status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to job_postings table (drop if exists first to avoid conflicts)
DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON job_postings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Add trigger to site_config table (drop if exists first to avoid conflicts)
DROP TRIGGER IF EXISTS update_site_config_updated_at ON site_config;
CREATE TRIGGER update_site_config_updated_at
BEFORE UPDATE ON site_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create function for expiring jobs
CREATE OR REPLACE FUNCTION expire_old_jobs()
RETURNS void AS $$
BEGIN
  UPDATE job_postings
  SET status = 'expired'
  WHERE status = 'approved'
  AND expiration_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a job to automatically expire jobs (runs daily) - only if pg_cron is available
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        PERFORM cron.schedule(
          'expire-old-jobs',          -- job name
          '0 0 * * *',                -- daily at midnight
          $$SELECT expire_old_jobs()$$ -- SQL to execute
        );
    END IF;
END
$$;

-- Create RLS policies for job_postings

-- Enable RLS on job_postings
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS admin_select_job_postings ON job_postings;
DROP POLICY IF EXISTS admin_update_job_postings ON job_postings;
DROP POLICY IF EXISTS admin_delete_job_postings ON job_postings;
DROP POLICY IF EXISTS public_select_job_postings ON job_postings;
DROP POLICY IF EXISTS public_insert_job_postings ON job_postings;

-- Policy for admins to see all job postings
CREATE POLICY admin_select_job_postings ON job_postings
    FOR SELECT
    USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true');

-- Policy for admins to update job postings
CREATE POLICY admin_update_job_postings ON job_postings
    FOR UPDATE
    USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true');

-- Policy for admins to delete job postings
CREATE POLICY admin_delete_job_postings ON job_postings
    FOR DELETE
    USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true');

-- Policy for public to see approved, non-expired job postings
CREATE POLICY public_select_job_postings ON job_postings
    FOR SELECT
    USING (status = 'approved' AND (expiration_date IS NULL OR expiration_date > NOW()));

-- Policy for anyone to insert job postings (they start as pending)
CREATE POLICY public_insert_job_postings ON job_postings
    FOR INSERT
    WITH CHECK (true);

-- Create a view for active job listings that includes days until expiration
CREATE OR REPLACE VIEW active_job_listings AS
SELECT 
    id,
    title,
    company_name,
    location,
    status,
    submission_date,
    approval_date,
    expiration_date,
    click_count,
    CASE 
        WHEN expiration_date IS NULL THEN NULL 
        ELSE EXTRACT(DAY FROM expiration_date - CURRENT_DATE)::INTEGER
    END AS days_until_expiration
FROM job_postings
WHERE status = 'approved' AND (expiration_date IS NULL OR expiration_date > NOW())
ORDER BY 
    CASE WHEN expiration_date IS NULL THEN 1 ELSE 0 END,
    expiration_date ASC,
    submission_date DESC;

-- Create a view for pending job submissions
CREATE OR REPLACE VIEW pending_job_submissions AS
SELECT 
    id,
    title,
    company_name,
    description,
    requirements,
    location,
    salary_range,
    application_url,
    submission_date,
    submitter_email
FROM job_postings
WHERE status = 'pending'
ORDER BY submission_date ASC;

-- Enable RLS on other tables
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS admin_manage_site_config ON site_config;
DROP POLICY IF EXISTS public_select_site_config ON site_config;
DROP POLICY IF EXISTS admin_manage_click_analytics ON click_analytics;
DROP POLICY IF EXISTS public_insert_click_analytics ON click_analytics;
DROP POLICY IF EXISTS admin_manage_email_notifications ON email_notifications;

-- Policy for admins to manage site_config
CREATE POLICY admin_manage_site_config ON site_config
    FOR ALL
    USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true');

-- Policy for public to read site_config
CREATE POLICY public_select_site_config ON site_config
    FOR SELECT
    USING (true);

-- Policy for admins to manage click_analytics
CREATE POLICY admin_manage_click_analytics ON click_analytics
    FOR ALL
    USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true');

-- Policy for public to insert click_analytics (anonymous tracking)
CREATE POLICY public_insert_click_analytics ON click_analytics
    FOR INSERT
    WITH CHECK (true);

-- Policy for admins to manage email_notifications
CREATE POLICY admin_manage_email_notifications ON email_notifications
    FOR ALL
    USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true'); 