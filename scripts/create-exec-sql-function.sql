-- Function to execute arbitrary SQL (admin only)
-- WARNING: This is a powerful function that should only be accessible to admins!

CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  -- Check if user is authenticated and an admin
  IF auth.role() = 'authenticated' AND (
    SELECT EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE id = auth.uid()
    )
  ) THEN
    EXECUTE sql;
  ELSE
    RAISE EXCEPTION 'Permission denied: only admins can execute arbitrary SQL';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 