
-- Target the correct gmail account
DO $$
DECLARE
  v_target uuid := '0265f864-5047-44f1-8af9-14114147f840'; -- hpulse001@gmail.com
BEGIN
  -- Reset password & confirm email
  UPDATE auth.users
    SET encrypted_password = crypt('lx19970612', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        banned_until = NULL,
        updated_at = now()
  WHERE id = v_target;

  -- Ensure profile
  INSERT INTO public.profiles (user_id, display_name, level, ai_uses_remaining, status)
  VALUES (v_target, 'hpulse', 'level_4', 9999, 'active')
  ON CONFLICT (user_id) DO UPDATE
    SET display_name = 'hpulse',
        level = 'level_4',
        ai_uses_remaining = 9999,
        status = 'active',
        updated_at = now();

  -- Remove super_admin from anyone else, downgrade them
  DELETE FROM public.user_roles WHERE role = 'super_admin' AND user_id <> v_target;
  UPDATE public.profiles
    SET level = 'level_3', ai_uses_remaining = 10, updated_at = now()
  WHERE level = 'level_4' AND user_id <> v_target;

  -- Grant super_admin role to target
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_target, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- Fix trigger to use correct email spelling
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.email IN ('hpulse001@gmail.com', 'hpulse001@gamil.com') THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;

        UPDATE public.profiles
        SET level = 'level_4', ai_uses_remaining = 9999, status = 'active'
        WHERE user_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$function$;
