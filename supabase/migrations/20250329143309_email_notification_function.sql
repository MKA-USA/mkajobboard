-- Migration: Email Notification Function
-- Description: Creates a function for handling email notifications

-- Note: This function would be called by an external email service or Edge Function
-- For actual implementation, you would need a service to process the email queue

-- Drop functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS mark_email_sent(UUID);
DROP FUNCTION IF EXISTS mark_email_failed(UUID, TEXT);
DROP FUNCTION IF EXISTS get_pending_emails(INTEGER);
DROP FUNCTION IF EXISTS public.admin_get_pending_emails(INTEGER);

-- Function to mark an email as sent
CREATE OR REPLACE FUNCTION mark_email_sent(email_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    email_exists BOOLEAN;
BEGIN
    -- Check if email exists
    SELECT EXISTS (SELECT 1 FROM email_notifications WHERE id = email_id) INTO email_exists;
    
    IF NOT email_exists THEN
        RAISE EXCEPTION 'Email notification with ID % does not exist', email_id;
    END IF;

    -- Update the email status
    UPDATE email_notifications
    SET 
        status = 'sent',
        sent_at = NOW()
    WHERE id = email_id AND status = 'pending';
    
    RETURN FOUND;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error marking email as sent: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark an email as failed
CREATE OR REPLACE FUNCTION mark_email_failed(email_id UUID, error_message TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    email_exists BOOLEAN;
BEGIN
    -- Check if email exists
    SELECT EXISTS (SELECT 1 FROM email_notifications WHERE id = email_id) INTO email_exists;
    
    IF NOT email_exists THEN
        RAISE EXCEPTION 'Email notification with ID % does not exist', email_id;
    END IF;

    -- Update the email status
    UPDATE email_notifications
    SET 
        status = 'failed',
        body = body || E'\n\nError: ' || COALESCE(error_message, 'Unknown error')
    WHERE id = email_id AND status = 'pending';
    
    RETURN FOUND;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error marking email as failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending email notifications
CREATE OR REPLACE FUNCTION get_pending_emails(limit_param INTEGER DEFAULT 10)
RETURNS SETOF email_notifications AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM email_notifications
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT limit_param;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error retrieving pending emails: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a secure API for handling emails
CREATE OR REPLACE FUNCTION public.admin_get_pending_emails(limit_param INTEGER DEFAULT 10)
RETURNS SETOF email_notifications AS $$
BEGIN
    -- Check if user is an admin
    IF auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true' THEN
        RETURN QUERY SELECT * FROM get_pending_emails(limit_param);
    ELSE
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error retrieving pending emails: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Create a view for email analytics
DROP VIEW IF EXISTS email_notification_stats;
CREATE OR REPLACE VIEW email_notification_stats AS
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM email_notifications
GROUP BY status
ORDER BY status;

-- Add comments to functions
COMMENT ON FUNCTION public.admin_get_pending_emails(INTEGER) IS 'Gets pending email notifications for processing (admin only)';
COMMENT ON FUNCTION mark_email_sent(UUID) IS 'Marks an email notification as sent';
COMMENT ON FUNCTION mark_email_failed(UUID, TEXT) IS 'Marks an email notification as failed with an error message'; 