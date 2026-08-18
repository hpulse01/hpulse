-- SECURITY TOMBSTONE
-- The original migration performed identity-specific super-admin mutation.
-- It is intentionally neutralized for fresh installations. Existing databases
-- are hardened by the later additive migration that removes the trigger.
BEGIN;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP FUNCTION IF EXISTS public.auto_assign_admin_role();
COMMIT;

