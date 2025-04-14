-- Migration: Site Configuration Functions
-- Description: Creates functions to manage site configuration settings

-- Drop functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS update_site_config(TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS get_site_config();
DROP FUNCTION IF EXISTS toggle_job_submissions(BOOLEAN);
DROP FUNCTION IF EXISTS public.admin_update_site_config(TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS public.admin_toggle_submissions(BOOLEAN);

-- Function to update site configuration
CREATE OR REPLACE FUNCTION update_site_config(
    logo_url_param TEXT DEFAULT NULL,
    theme_color_param TEXT DEFAULT NULL,
    header_font_param TEXT DEFAULT NULL,
    body_font_param TEXT DEFAULT NULL,
    allow_submissions_param BOOLEAN DEFAULT NULL
)
RETURNS SETOF site_config AS $$
DECLARE
    config_id UUID;
    config_count INTEGER;
BEGIN
    -- Count existing configs
    SELECT COUNT(*) INTO config_count FROM site_config;
    
    -- Get the config ID (there should only be one row)
    SELECT id INTO config_id FROM site_config LIMIT 1;
    
    IF config_count = 0 THEN
        -- Insert default if not exists
        INSERT INTO site_config (
            logo_url, 
            theme_color, 
            header_font, 
            body_font, 
            allow_submissions
        ) VALUES (
            COALESCE(logo_url_param, '/logo.png'),
            COALESCE(theme_color_param, '#1E40AF'),
            COALESCE(header_font_param, 'Inter'),
            COALESCE(body_font_param, 'Inter'),
            COALESCE(allow_submissions_param, true)
        ) RETURNING id INTO config_id;
    ELSE
        -- Update existing configuration
        UPDATE site_config
        SET 
            logo_url = COALESCE(logo_url_param, logo_url),
            theme_color = COALESCE(theme_color_param, theme_color),
            header_font = COALESCE(header_font_param, header_font),
            body_font = COALESCE(body_font_param, body_font),
            allow_submissions = COALESCE(allow_submissions_param, allow_submissions)
        WHERE id = config_id;
    END IF;
    
    RETURN QUERY SELECT * FROM site_config WHERE id = config_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error updating site configuration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current site configuration
CREATE OR REPLACE FUNCTION get_site_config()
RETURNS SETOF site_config AS $$
DECLARE 
    config_count INTEGER;
BEGIN
    -- Check if config exists
    SELECT COUNT(*) INTO config_count FROM site_config;
    
    -- If no config exists, create default
    IF config_count = 0 THEN
        INSERT INTO site_config (
            logo_url, 
            theme_color, 
            header_font, 
            body_font, 
            allow_submissions
        ) VALUES (
            '/logo.png',
            '#1E40AF',
            'Inter',
            'Inter',
            true
        );
    END IF;
    
    RETURN QUERY SELECT * FROM site_config LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Function to toggle job submissions
CREATE OR REPLACE FUNCTION toggle_job_submissions(enable BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
    result BOOLEAN;
    config_count INTEGER;
BEGIN
    -- Check if config exists
    SELECT COUNT(*) INTO config_count FROM site_config;
    
    -- If no config exists, create default
    IF config_count = 0 THEN
        INSERT INTO site_config (
            logo_url, 
            theme_color, 
            header_font, 
            body_font, 
            allow_submissions
        ) VALUES (
            '/logo.png',
            '#1E40AF',
            'Inter',
            'Inter',
            enable
        ) RETURNING allow_submissions INTO result;
    ELSE
        -- Update existing configuration
        UPDATE site_config
        SET allow_submissions = enable
        WHERE id = (SELECT id FROM site_config LIMIT 1)
        RETURNING allow_submissions INTO result;
    END IF;
    
    RETURN result;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error toggling job submissions: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create secure API functions for the admin dashboard
CREATE OR REPLACE FUNCTION public.admin_update_site_config(
    logo_url TEXT DEFAULT NULL,
    theme_color TEXT DEFAULT NULL,
    header_font TEXT DEFAULT NULL,
    body_font TEXT DEFAULT NULL,
    allow_submissions BOOLEAN DEFAULT NULL
)
RETURNS SETOF site_config AS $$
BEGIN
    -- Check if user is an admin
    IF auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true' THEN
        RETURN QUERY SELECT * FROM update_site_config(
            logo_url,
            theme_color,
            header_font,
            body_font,
            allow_submissions
        );
    ELSE
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error updating site configuration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.admin_toggle_submissions(enable BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is an admin
    IF auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true' THEN
        RETURN toggle_job_submissions(enable);
    ELSE
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error toggling job submissions: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Add comments to functions
COMMENT ON FUNCTION public.get_site_config() IS 'Gets the current site configuration settings';
COMMENT ON FUNCTION public.admin_update_site_config(TEXT, TEXT, TEXT, TEXT, BOOLEAN) IS 'Updates site configuration settings (admin only)';
COMMENT ON FUNCTION public.admin_toggle_submissions(BOOLEAN) IS 'Enables or disables job submissions (admin only)'; 