-- Add weekly reset tracking for level_3 users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_week_start timestamp with time zone DEFAULT now();

-- Update consume_ai_use to handle weekly limits for level_3
CREATE OR REPLACE FUNCTION public.consume_ai_use(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_level user_level;
  v_remaining INTEGER;
  v_week_start timestamp with time zone;
  v_now timestamp with time zone := now();
BEGIN
  SELECT level, ai_uses_remaining, ai_week_start 
  INTO v_level, v_remaining, v_week_start
  FROM public.profiles WHERE user_id = p_user_id;
  
  -- level_4 (super admin) has unlimited access
  IF v_level = 'level_4' THEN
    RETURN true;
  END IF;
  
  -- level_3: 10 uses per week, auto-reset weekly
  IF v_level = 'level_3' THEN
    -- Check if a week has passed since last reset
    IF v_week_start IS NULL OR (v_now - v_week_start) >= interval '7 days' THEN
      -- Reset weekly counter
      UPDATE public.profiles 
      SET ai_uses_remaining = 9, -- Use 1, so set to 9
          ai_week_start = v_now,
          updated_at = v_now
      WHERE user_id = p_user_id;
      RETURN true;
    ELSIF v_remaining > 0 THEN
      -- Consume one use
      UPDATE public.profiles 
      SET ai_uses_remaining = ai_uses_remaining - 1,
          updated_at = v_now
      WHERE user_id = p_user_id;
      RETURN true;
    ELSE
      -- No uses remaining this week
      RETURN false;
    END IF;
  END IF;
  
  -- level_2: limited uses (current behavior)
  IF v_level = 'level_2' AND v_remaining > 0 THEN
    UPDATE public.profiles 
    SET ai_uses_remaining = ai_uses_remaining - 1,
        updated_at = v_now
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;
  
  -- level_1 or no uses remaining
  RETURN false;
END;
$function$;

-- Update can_use_ai to handle weekly limits for level_3
CREATE OR REPLACE FUNCTION public.can_use_ai(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_level user_level;
  v_remaining INTEGER;
  v_week_start timestamp with time zone;
  v_now timestamp with time zone := now();
BEGIN
  SELECT level, ai_uses_remaining, ai_week_start 
  INTO v_level, v_remaining, v_week_start
  FROM public.profiles WHERE user_id = p_user_id;
  
  -- level_4 always can use AI
  IF v_level = 'level_4' THEN
    RETURN true;
  END IF;
  
  -- level_3: check weekly limit
  IF v_level = 'level_3' THEN
    -- If week has passed, they can use (will reset on consume)
    IF v_week_start IS NULL OR (v_now - v_week_start) >= interval '7 days' THEN
      RETURN true;
    END IF;
    -- Otherwise check remaining
    RETURN v_remaining > 0;
  END IF;
  
  -- level_2: check remaining uses
  IF v_level = 'level_2' AND v_remaining > 0 THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Update admin_update_user_level to set 10 weekly uses for level_3
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
    
    -- CRITICAL: Super admins cannot be modified by anyone
    IF public.is_super_admin(p_target_user_id) THEN
        RAISE EXCEPTION 'Permission denied: Cannot modify super admin';
    END IF;
    
    -- level_4 is reserved for super_admin only
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
        -- Set 10 weekly uses and reset week start
        UPDATE public.profiles 
        SET ai_uses_remaining = 10,
            ai_week_start = now()
        WHERE user_id = p_target_user_id;
    END IF;
    
    RETURN true;
END;
$function$;

-- Initialize level_3 users with 10 weekly uses
UPDATE public.profiles 
SET ai_uses_remaining = 10, ai_week_start = now()
WHERE level = 'level_3';