-- Commercial security hardening: privileged roles must never be granted from
-- a matching email address during signup. Existing approved role rows remain
-- unchanged; future grants must use an audited out-of-band admin procedure.

BEGIN;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP FUNCTION IF EXISTS public.auto_assign_admin_role();

COMMIT;
