-- Migration: Job Approval Functions
-- Description: Creates functions for job approval workflow and email notifications

-- Drop functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS approve_job(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS reject_job(UUID, TEXT);
DROP FUNCTION IF EXISTS extend_job_expiration(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.admin_approve_job(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.admin_reject_job(UUID, TEXT);
DROP FUNCTION IF EXISTS public.admin_extend_job(UUID, INTEGER);

-- Function to approve a job posting
CREATE OR REPLACE FUNCTION approve_job(
    job_id UUID,
    days_active INTEGER DEFAULT 30,
    admin_notes_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    job_record job_postings%ROWTYPE;
    email_id UUID;
BEGIN
    -- Get job details
    SELECT * INTO job_record
    FROM job_postings
    WHERE id = job_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job posting not found or not in pending status';
    END IF;
    
    -- Update job status
    UPDATE job_postings
    SET 
        status = 'approved',
        approval_date = NOW(),
        expiration_date = NOW() + (days_active || ' days')::INTERVAL,
        admin_notes = COALESCE(admin_notes_param, admin_notes)
    WHERE id = job_id;
    
    -- Create email notification
    INSERT INTO email_notifications (
        job_posting_id,
        recipient_email,
        subject,
        body,
        status
    ) VALUES (
        job_id,
        job_record.submitter_email,
        'Your job posting has been approved',
        'Congratulations! Your job posting "' || job_record.title || '" has been approved and is now live on the job board. It will remain active for ' || days_active || ' days.',
        'pending'
    ) RETURNING id INTO email_id;
    
    RETURN email_id;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Error creating email notification';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a job posting
CREATE OR REPLACE FUNCTION reject_job(
    job_id UUID,
    rejection_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    job_record job_postings%ROWTYPE;
    email_id UUID;
BEGIN
    -- Get job details
    SELECT * INTO job_record
    FROM job_postings
    WHERE id = job_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job posting not found or not in pending status';
    END IF;
    
    -- Update job status
    UPDATE job_postings
    SET 
        status = 'rejected',
        admin_notes = rejection_reason
    WHERE id = job_id;
    
    -- Create email notification
    INSERT INTO email_notifications (
        job_posting_id,
        recipient_email,
        subject,
        body,
        status
    ) VALUES (
        job_id,
        job_record.submitter_email,
        'Your job posting was not approved',
        'We regret to inform you that your job posting "' || job_record.title || '" was not approved.' || 
        CASE 
            WHEN rejection_reason IS NOT NULL THEN E'\n\nReason: ' || rejection_reason
            ELSE ''
        END ||
        E'\n\nIf you have any questions, please contact us.',
        'pending'
    ) RETURNING id INTO email_id;
    
    RETURN email_id;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Error creating email notification';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extend a job posting expiration
CREATE OR REPLACE FUNCTION extend_job_expiration(
    job_id UUID,
    additional_days INTEGER
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    new_expiration_date TIMESTAMP WITH TIME ZONE;
    job_exists BOOLEAN;
BEGIN
    -- Check if job exists
    SELECT EXISTS (SELECT 1 FROM job_postings WHERE id = job_id) INTO job_exists;
    
    IF NOT job_exists THEN
        RAISE EXCEPTION 'Job posting with ID % does not exist', job_id;
    END IF;
    
    -- Update job expiration
    UPDATE job_postings
    SET 
        expiration_date = CASE 
            WHEN expiration_date < NOW() THEN NOW() + (additional_days || ' days')::INTERVAL
            ELSE expiration_date + (additional_days || ' days')::INTERVAL
        END,
        status = CASE 
            WHEN status = 'expired' THEN 'approved'
            ELSE status
        END
    WHERE id = job_id
    RETURNING expiration_date INTO new_expiration_date;
    
    RETURN new_expiration_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure API functions for the admin dashboard
CREATE OR REPLACE FUNCTION public.admin_approve_job(job_id UUID, days_active INTEGER DEFAULT 30, admin_notes TEXT DEFAULT NULL)
RETURNS UUID AS $$
BEGIN
    -- Check if user is an admin
    IF auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true' THEN
        RETURN approve_job(job_id, days_active, admin_notes);
    ELSE
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error approving job: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.admin_reject_job(job_id UUID, rejection_reason TEXT DEFAULT NULL)
RETURNS UUID AS $$
BEGIN
    -- Check if user is an admin
    IF auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true' THEN
        RETURN reject_job(job_id, rejection_reason);
    ELSE
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error rejecting job: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.admin_extend_job(job_id UUID, additional_days INTEGER)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    -- Check if user is an admin
    IF auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true' THEN
        RETURN extend_job_expiration(job_id, additional_days);
    ELSE
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error extending job expiration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Add comments to functions
COMMENT ON FUNCTION public.admin_approve_job(UUID, INTEGER, TEXT) IS 'Approves a pending job posting (admin only)';
COMMENT ON FUNCTION public.admin_reject_job(UUID, TEXT) IS 'Rejects a pending job posting (admin only)';
COMMENT ON FUNCTION public.admin_extend_job(UUID, INTEGER) IS 'Extends the expiration date of a job posting (admin only)'; 