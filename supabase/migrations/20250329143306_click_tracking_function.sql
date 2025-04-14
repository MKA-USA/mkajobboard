-- Migration: Click Tracking Function
-- Description: Creates a function to track job application clicks and update click count

-- Drop functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS track_job_click(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.track_job_application_click(UUID);

-- Function to track job application clicks
CREATE OR REPLACE FUNCTION track_job_click(
    job_id UUID,
    user_agent_param TEXT DEFAULT NULL,
    ip_address_param TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    job_exists BOOLEAN;
BEGIN
    -- Check if job exists first
    SELECT EXISTS (SELECT 1 FROM job_postings WHERE id = job_id) INTO job_exists;
    
    IF NOT job_exists THEN
        RAISE EXCEPTION 'Job posting with ID % does not exist', job_id;
    END IF;

    -- Insert into analytics table
    INSERT INTO click_analytics (
        job_posting_id,
        user_agent,
        ip_address
    ) VALUES (
        job_id,
        user_agent_param,
        ip_address_param
    );
    
    -- Update the click counter on the job posting
    UPDATE job_postings
    SET click_count = click_count + 1
    WHERE id = job_id;
    
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Job posting with ID % does not exist', job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure API for tracking clicks
CREATE OR REPLACE FUNCTION public.track_job_application_click(job_id UUID)
RETURNS void AS $$
DECLARE
    user_agent_header TEXT;
    ip_address_header TEXT;
BEGIN
    -- Safely extract headers with error handling
    BEGIN
        user_agent_header := current_setting('request.headers', true)::json->>'user-agent';
        ip_address_header := current_setting('request.headers', true)::json->>'x-real-ip';
    EXCEPTION 
        WHEN others THEN
            -- If headers can't be extracted, continue without them
            user_agent_header := NULL;
            ip_address_header := NULL;
    END;

    PERFORM track_job_click(
        job_id,
        user_agent_header,
        ip_address_header
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

COMMENT ON FUNCTION public.track_job_application_click(UUID) IS 'Tracks when a user clicks on a job application link and increments the click counter'; 