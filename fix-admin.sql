-- 1. Add deleted_at column if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Restore your admin account (remove soft-delete if any)
UPDATE profiles 
SET deleted_at = NULL 
WHERE email = 'enfield.sw.law@pccw.com';

-- 3. Verify
SELECT id, name, email, role, deleted_at 
FROM profiles 
WHERE email = 'enfield.sw.law@pccw.com';
