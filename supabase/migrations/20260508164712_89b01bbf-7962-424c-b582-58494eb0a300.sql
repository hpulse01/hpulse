-- SECURITY TOMBSTONE
-- Signup-time privileged-role assignment is forbidden. Provision privileged
-- roles only through an audited, out-of-band administrative process.
BEGIN;
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP FUNCTION IF EXISTS public.auto_assign_admin_role();
COMMIT;

