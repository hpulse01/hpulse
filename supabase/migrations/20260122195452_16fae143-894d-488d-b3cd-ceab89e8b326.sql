
-- 1) Add temporary AI fields to profiles (used for 3-day temporary grants)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS temp_ai_uses integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS temp_ai_expires_at timestamp with time zone;

-- 2) Ensure realtime publication includes profiles (for admin realtime sync)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
  END IF;
END;
$$;

-- 3) Super admin grants temporary AI uses (valid for 3 days)
CREATE OR REPLACE FUNCTION public.admin_grant_temp_ai_uses(
  p_admin_id uuid,
  p_target_user_id uuid,
  p_uses integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_uses IS NULL OR p_uses <= 0 THEN
    RAISE EXCEPTION 'Invalid uses amount';
  END IF;

  -- Only super_admin can grant
  IF NOT public.is_super_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Permission denied: Only super admin can grant temporary AI uses';
  END IF;

  -- Cannot modify super admin accounts
  IF public.is_super_admin(p_target_user_id) THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify super admin';
  END IF;

  UPDATE public.profiles
  SET temp_ai_uses = temp_ai_uses + p_uses,
      temp_ai_expires_at = CASE
        WHEN temp_ai_expires_at IS NULL OR temp_ai_expires_at <= now()
          THEN now() + interval '3 days'
        ELSE temp_ai_expires_at
      END,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  RETURN true;
END;
$$;

-- 4) can_use_ai: allow if temp uses exist and not expired (level_4 still unlimited)
CREATE OR REPLACE FUNCTION public.can_use_ai(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_level user_level;
  v_remaining integer;
  v_week_start timestamp with time zone;
  v_temp_uses integer;
  v_temp_expires timestamp with time zone;
  v_now timestamp with time zone := now();
BEGIN
  SELECT level, ai_uses_remaining, ai_week_start, temp_ai_uses, temp_ai_expires_at
    INTO v_level, v_remaining, v_week_start, v_temp_uses, v_temp_expires
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_level = 'level_4' THEN
    RETURN true;
  END IF;

  IF COALESCE(v_temp_uses, 0) > 0 AND v_temp_expires IS NOT NULL AND v_temp_expires > v_now THEN
    RETURN true;
  END IF;

  IF v_level = 'level_3' THEN
    IF v_week_start IS NULL OR (v_now - v_week_start) >= interval '7 days' THEN
      RETURN true;
    END IF;
    RETURN COALESCE(v_remaining, 0) > 0;
  END IF;

  IF v_level = 'level_2' AND COALESCE(v_remaining, 0) > 0 THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 5) consume_ai_use: consume temp uses first; clear expired temp uses
CREATE OR REPLACE FUNCTION public.consume_ai_use(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_level user_level;
  v_remaining integer;
  v_week_start timestamp with time zone;
  v_temp_uses integer;
  v_temp_expires timestamp with time zone;
  v_now timestamp with time zone := now();
BEGIN
  SELECT level, ai_uses_remaining, ai_week_start, temp_ai_uses, temp_ai_expires_at
    INTO v_level, v_remaining, v_week_start, v_temp_uses, v_temp_expires
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_level = 'level_4' THEN
    RETURN true;
  END IF;

  -- Clear expired temp uses
  IF v_temp_expires IS NOT NULL AND v_temp_expires <= v_now THEN
    UPDATE public.profiles
      SET temp_ai_uses = 0,
          temp_ai_expires_at = NULL,
          updated_at = v_now
    WHERE user_id = p_user_id;
    v_temp_uses := 0;
    v_temp_expires := NULL;
  END IF;

  -- Consume temp uses first
  IF COALESCE(v_temp_uses, 0) > 0 AND v_temp_expires IS NOT NULL AND v_temp_expires > v_now THEN
    UPDATE public.profiles
      SET temp_ai_uses = temp_ai_uses - 1,
          updated_at = v_now
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;

  -- level_3: 10 uses per week
  IF v_level = 'level_3' THEN
    IF v_week_start IS NULL OR (v_now - v_week_start) >= interval '7 days' THEN
      UPDATE public.profiles
        SET ai_uses_remaining = 9,
            ai_week_start = v_now,
            updated_at = v_now
      WHERE user_id = p_user_id;
      RETURN true;
    ELSIF COALESCE(v_remaining, 0) > 0 THEN
      UPDATE public.profiles
        SET ai_uses_remaining = ai_uses_remaining - 1,
            updated_at = v_now
      WHERE user_id = p_user_id;
      RETURN true;
    ELSE
      RETURN false;
    END IF;
  END IF;

  -- level_2: limited uses
  IF v_level = 'level_2' AND COALESCE(v_remaining, 0) > 0 THEN
    UPDATE public.profiles
      SET ai_uses_remaining = ai_uses_remaining - 1,
          updated_at = v_now
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
