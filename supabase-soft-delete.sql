-- Soft Delete Setup for Profiles

-- 1. Add deleted_at column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- 3. Update all policies to exclude soft-deleted users
-- No need to change policies, just filter in queries
