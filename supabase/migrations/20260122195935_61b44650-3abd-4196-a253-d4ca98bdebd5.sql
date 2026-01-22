
-- Fix admin_update_user_level to properly set AI uses when changing levels
CREATE OR REPLACE FUNCTION public.admin_update_user_level(
  p_admin_id uuid, 
  p_target_user_id uuid, 
  p_new_level user_level
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Check if admin has permission
    IF NOT public.is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Permission denied: Not an admin';
    END IF;
    
    -- CRITICAL: Super admins cannot be modified by anyone
    IF public.is_super_admin(p_target_user_id) THEN
        RAISE EXCEPTION 'Permission denied: Cannot modify super admin';
    END IF;
    
    -- level_4 is reserved for super_admin only
    IF p_new_level = 'level_4' THEN
        RAISE EXCEPTION 'Permission denied: level_4 is reserved for super admin';
    END IF;
    
    -- Update based on new level
    IF p_new_level = 'level_3' THEN
        -- Level 3: 10 uses per week
        UPDATE public.profiles 
        SET level = p_new_level,
            ai_uses_remaining = 10,
            ai_week_start = now(),
            updated_at = now()
        WHERE user_id = p_target_user_id;
    ELSIF p_new_level = 'level_2' THEN
        -- Level 2: Give 1 use (lifetime)
        UPDATE public.profiles 
        SET level = p_new_level,
            ai_uses_remaining = 1,
            ai_week_start = NULL,
            updated_at = now()
        WHERE user_id = p_target_user_id;
    ELSE
        -- Level 1: No AI uses
        UPDATE public.profiles 
        SET level = p_new_level,
            ai_uses_remaining = 0,
            ai_week_start = NULL,
            updated_at = now()
        WHERE user_id = p_target_user_id;
    END IF;
    
    RETURN true;
END;
$$;
