-- Migration: Admin Dashboard Views
-- Description: Creates database views for admin dashboard analytics

-- Drop views if they exist to avoid conflicts
DROP VIEW IF EXISTS job_posting_analytics;
DROP VIEW IF EXISTS active_jobs_analytics;
DROP VIEW IF EXISTS expiring_jobs;
DROP VIEW IF EXISTS click_analytics_daily;
DROP VIEW IF EXISTS pending_approvals_stats;
DROP VIEW IF EXISTS admin_dashboard_summary;

-- Drop functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS public.get_admin_dashboard_summary();

-- Create a view for job posting analytics
CREATE OR REPLACE VIEW job_posting_analytics AS
SELECT 
    status,
    COUNT(*) as count,
    MIN(submission_date) as oldest_submission,
    MAX(submission_date) as newest_submission
FROM job_postings
GROUP BY status
ORDER BY status;

-- Create a view for active jobs analytics
CREATE OR REPLACE VIEW active_jobs_analytics AS
SELECT 
    COUNT(*) as total_active_jobs,
    MIN(expiration_date) as next_expiring,
    MAX(submission_date) as most_recent_activation,
    AVG(click_count) as average_clicks,
    SUM(click_count) as total_clicks
FROM job_postings
WHERE status = 'approved' AND (expiration_date IS NULL OR expiration_date > NOW());

-- Create a view for expiring jobs
CREATE OR REPLACE VIEW expiring_jobs AS
SELECT 
    id,
    title,
    company_name,
    expiration_date,
    EXTRACT(DAY FROM expiration_date - CURRENT_DATE)::INTEGER as days_remaining,
    click_count
FROM job_postings
WHERE 
    status = 'approved' 
    AND expiration_date IS NOT NULL
    AND expiration_date > NOW()
    AND expiration_date <= NOW() + INTERVAL '7 days'
ORDER BY expiration_date ASC;

-- Create a view for click analytics over time
CREATE OR REPLACE VIEW click_analytics_daily AS
SELECT 
    DATE_TRUNC('day', clicked_at) as day,
    COUNT(*) as click_count
FROM click_analytics
GROUP BY DATE_TRUNC('day', clicked_at)
ORDER BY day DESC;

-- Create a view for pending approvals count
CREATE OR REPLACE VIEW pending_approvals_stats AS
SELECT 
    COUNT(*) as pending_count,
    MIN(submission_date) as oldest_pending,
    MAX(submission_date) as newest_pending
FROM job_postings
WHERE status = 'pending';

-- Create a view for admin dashboard summary
CREATE OR REPLACE VIEW admin_dashboard_summary AS
SELECT 
    COALESCE((SELECT count(*) FROM job_postings WHERE status = 'approved' AND (expiration_date IS NULL OR expiration_date > NOW())), 0) as active_jobs,
    COALESCE((SELECT count(*) FROM job_postings WHERE status = 'pending'), 0) as pending_approvals,
    COALESCE((SELECT count(*) FROM job_postings WHERE status = 'expired'), 0) as expired_jobs,
    COALESCE((SELECT count(*) FROM job_postings WHERE status = 'rejected'), 0) as rejected_jobs,
    COALESCE((SELECT sum(click_count) FROM job_postings), 0) as total_clicks,
    COALESCE((SELECT count(*) FROM job_postings), 0) as total_job_postings,
    COALESCE((SELECT count(*) FROM email_notifications WHERE status = 'pending'), 0) as pending_emails,
    COALESCE((SELECT allow_submissions FROM site_config LIMIT 1), true) as submissions_enabled;

-- Create a secure API function to get the dashboard summary
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_summary()
RETURNS SETOF admin_dashboard_summary AS $$
BEGIN
    -- Check if user is an admin
    IF auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true' THEN
        RETURN QUERY SELECT * FROM admin_dashboard_summary;
    ELSE
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error retrieving admin dashboard summary: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Add comments to functions and views
COMMENT ON FUNCTION public.get_admin_dashboard_summary() IS 'Gets summary statistics for the admin dashboard (admin only)';
COMMENT ON VIEW job_posting_analytics IS 'Analytics of job postings by status';
COMMENT ON VIEW active_jobs_analytics IS 'Analytics of currently active job postings';
COMMENT ON VIEW expiring_jobs IS 'Job postings expiring within the next 7 days';
COMMENT ON VIEW click_analytics_daily IS 'Daily click analytics for job postings';
COMMENT ON VIEW pending_approvals_stats IS 'Statistics about pending job posting approvals';
COMMENT ON VIEW admin_dashboard_summary IS 'Summary statistics for the admin dashboard'; 