-- Migration: Admin Users
-- Description: Sets up admin user roles and profiles

-- Create an admin_profiles table to store additional admin information
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_profiles
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS admin_profiles_select ON admin_profiles;
DROP POLICY IF EXISTS admin_profiles_update ON admin_profiles;

-- Policy for admins to view all admin profiles
CREATE POLICY admin_profiles_select ON admin_profiles
    FOR SELECT
    USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true');

-- Policy for admins to update their own profile
CREATE POLICY admin_profiles_update ON admin_profiles
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' 
        AND auth.jwt() ->> 'is_admin' = 'true'
        AND id = auth.uid()
    );

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM admin_profiles
        WHERE id = user_id
    ) INTO admin_exists;
    
    RETURN admin_exists;
EXCEPTION
    WHEN others THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create an admin user
CREATE OR REPLACE FUNCTION create_admin(
    email TEXT,
    name TEXT DEFAULT NULL,
    avatar_url TEXT DEFAULT NULL,
    is_super_admin BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Check if calling user is a super admin
    IF NOT (
        auth.role() = 'authenticated' 
        AND auth.jwt() ->> 'is_admin' = 'true'
        AND EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    ) THEN
        RAISE EXCEPTION 'Only super admins can create new admin users';
    END IF;

    -- Check if user with this email already exists
    SELECT id INTO user_id FROM auth.users WHERE email = create_admin.email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % does not exist in auth system', email;
    END IF;
    
    -- Check if user is already an admin
    IF EXISTS (SELECT 1 FROM admin_profiles WHERE id = user_id) THEN
        RAISE EXCEPTION 'User is already an admin';
    END IF;
    
    -- Create admin profile
    INSERT INTO admin_profiles (
        id,
        email,
        name,
        avatar_url,
        is_super_admin
    ) VALUES (
        user_id,
        create_admin.email,
        create_admin.name,
        create_admin.avatar_url,
        create_admin.is_super_admin
    );
    
    RETURN user_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error creating admin user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin privileges
CREATE OR REPLACE FUNCTION remove_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if calling user is a super admin
    IF NOT (
        auth.role() = 'authenticated' 
        AND auth.jwt() ->> 'is_admin' = 'true'
        AND EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    ) THEN
        RAISE EXCEPTION 'Only super admins can remove admin users';
    END IF;
    
    -- Cannot remove yourself
    IF user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot remove your own admin privileges';
    END IF;
    
    -- Remove admin profile
    DELETE FROM admin_profiles
    WHERE id = user_id;
    
    RETURN FOUND;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error removing admin user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure function to create the first super admin (can be called once)
CREATE OR REPLACE FUNCTION bootstrap_first_admin(
    email TEXT,
    name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    admin_count INTEGER;
BEGIN
    -- Check if any admins already exist
    SELECT COUNT(*) INTO admin_count FROM admin_profiles;
    
    IF admin_count > 0 THEN
        RAISE EXCEPTION 'Admins already exist, cannot bootstrap first admin';
    END IF;
    
    -- Check if user with this email exists
    SELECT id INTO user_id FROM auth.users WHERE email = bootstrap_first_admin.email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % does not exist in auth system', email;
    END IF;
    
    -- Create the super admin
    INSERT INTO admin_profiles (
        id,
        email,
        name,
        is_super_admin
    ) VALUES (
        user_id,
        bootstrap_first_admin.email,
        bootstrap_first_admin.name,
        true
    );
    
    RETURN user_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error bootstrapping first admin: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get all admin users (for super admins)
CREATE OR REPLACE FUNCTION get_all_admins()
RETURNS SETOF admin_profiles AS $$
BEGIN
    -- Check if calling user is a super admin
    IF NOT (
        auth.role() = 'authenticated' 
        AND auth.jwt() ->> 'is_admin' = 'true'
        AND EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    ) THEN
        RAISE EXCEPTION 'Only super admins can view all admin users';
    END IF;
    
    RETURN QUERY
    SELECT * FROM admin_profiles
    ORDER BY created_at DESC;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Error retrieving admin users: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function for the JWT claim
-- This function will be used in Supabase JWT custom claims
CREATE OR REPLACE FUNCTION is_admin_claim()
RETURNS jsonb AS $$
BEGIN
    IF is_admin() THEN
        RETURN jsonb_build_object('is_admin', 'true');
    ELSE
        RETURN jsonb_build_object('is_admin', 'false');
    END IF;
EXCEPTION
    WHEN others THEN
        RETURN jsonb_build_object('is_admin', 'false');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to functions
COMMENT ON FUNCTION is_admin(UUID) IS 'Checks if a user is an admin';
COMMENT ON FUNCTION create_admin(TEXT, TEXT, TEXT, BOOLEAN) IS 'Creates a new admin user (super admin only)';
COMMENT ON FUNCTION remove_admin(UUID) IS 'Removes admin privileges from a user (super admin only)';
COMMENT ON FUNCTION bootstrap_first_admin(TEXT, TEXT) IS 'Creates the first super admin (can only be used once)';
COMMENT ON FUNCTION get_all_admins() IS 'Gets all admin users (super admin only)';
COMMENT ON FUNCTION is_admin_claim() IS 'Function for JWT claim to identify admins'; 