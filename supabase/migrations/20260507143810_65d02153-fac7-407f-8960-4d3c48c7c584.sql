
-- Set hpulse001@gamil.com as the unique super admin
-- 1. Update password
UPDATE auth.users
SET encrypted_password = crypt('lx19970612', gen_salt('bf')),
    updated_at = now()
WHERE email = 'hpulse001@gamil.com';

-- 2. Remove super_admin role from any other user
DELETE FROM public.user_roles
WHERE role = 'super_admin'
  AND user_id <> (SELECT id FROM auth.users WHERE email = 'hpulse001@gamil.com');

-- 3. Downgrade previously level_4 users (except target) to level_3
UPDATE public.profiles
SET level = 'level_3', ai_uses_remaining = 10, updated_at = now()
WHERE level = 'level_4'
  AND user_id <> (SELECT id FROM auth.users WHERE email = 'hpulse001@gamil.com');

-- 4. Grant super_admin role to target
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users WHERE email = 'hpulse001@gamil.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Upgrade target profile to level_4
UPDATE public.profiles
SET level = 'level_4', ai_uses_remaining = 9999, status = 'active', updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'hpulse001@gamil.com');

-- 6. Update auto-assign trigger to use the new email
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.email = 'hpulse001@gamil.com' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;

        UPDATE public.profiles
        SET level = 'level_4', ai_uses_remaining = 9999
        WHERE user_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$function$;
