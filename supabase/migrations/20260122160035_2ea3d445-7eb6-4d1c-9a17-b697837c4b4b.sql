-- Step 2: Update functions to support level_4

-- Update the auto_assign_admin_role function to set level_4
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Auto-assign super_admin role and level_4 ONLY for the designated email
    IF NEW.email = 'hpulse001@gmail.com' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Upgrade to level_4 (super admin exclusive)
        UPDATE public.profiles 
        SET level = 'level_4', ai_uses_remaining = 9999
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Update can_use_ai function to include level_4
CREATE OR REPLACE FUNCTION public.can_use_ai(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN (SELECT level FROM public.profiles WHERE user_id = p_user_id) IN ('level_3', 'level_4') THEN true
    WHEN (SELECT level FROM public.profiles WHERE user_id = p_user_id) = 'level_2' 
         AND (SELECT ai_uses_remaining FROM public.profiles WHERE user_id = p_user_id) > 0 THEN true
    ELSE false
  END;
$function$;

-- Update consume_ai_use function to include level_4
CREATE OR REPLACE FUNCTION public.consume_ai_use(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_level user_level;
  v_remaining INTEGER;
BEGIN
  SELECT level, ai_uses_remaining INTO v_level, v_remaining
  FROM public.profiles WHERE user_id = p_user_id;
  
  -- level_4 and level_3 have unlimited AI access
  IF v_level IN ('level_3', 'level_4') THEN
    RETURN true;
  ELSIF v_level = 'level_2' AND v_remaining > 0 THEN
    UPDATE public.profiles 
    SET ai_uses_remaining = ai_uses_remaining - 1,
        updated_at = now()
    WHERE user_id = p_user_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$function$;

-- Update admin_update_user_level to prevent setting level_4 for non-super-admins
CREATE OR REPLACE FUNCTION public.admin_update_user_level(p_admin_id uuid, p_target_user_id uuid, p_new_level user_level)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Check if admin has permission
    IF NOT public.is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Permission denied: Not an admin';
    END IF;
    
    -- level_4 is reserved for super_admin only (hpulse001@gmail.com)
    IF p_new_level = 'level_4' THEN
        RAISE EXCEPTION 'Permission denied: level_4 is reserved for super admin';
    END IF;
    
    -- Update the user's level
    UPDATE public.profiles 
    SET level = p_new_level, updated_at = now()
    WHERE user_id = p_target_user_id;
    
    -- Update AI uses based on level
    IF p_new_level = 'level_2' THEN
        UPDATE public.profiles 
        SET ai_uses_remaining = GREATEST(ai_uses_remaining, 1)
        WHERE user_id = p_target_user_id;
    ELSIF p_new_level = 'level_3' THEN
        UPDATE public.profiles 
        SET ai_uses_remaining = 999
        WHERE user_id = p_target_user_id;
    END IF;
    
    RETURN true;
END;
$function$;