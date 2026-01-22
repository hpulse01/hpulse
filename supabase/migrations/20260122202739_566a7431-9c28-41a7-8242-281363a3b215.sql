-- 1) Add missing column used by admin_get_all_users
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS registration_ip text;

-- 2) Recreate admin_get_all_users (include registration_ip + prevent parameter spoofing)
CREATE OR REPLACE FUNCTION public.admin_get_all_users(p_admin_id uuid)
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  level user_level,
  status text,
  ai_uses_remaining integer,
  total_calculations integer,
  created_at timestamp with time zone,
  is_protected boolean,
  temp_ai_uses integer,
  temp_ai_expires_at timestamp with time zone,
  registration_ip text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent spoofing p_admin_id
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION 'Permission denied: invalid caller';
  END IF;

  IF NOT public.is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Permission denied: Not an admin';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::text,
    p.display_name,
    p.level,
    COALESCE(p.status, 'active')::text,
    p.ai_uses_remaining,
    p.total_calculations,
    p.created_at,
    public.is_super_admin(p.user_id) AS is_protected,
    CASE
      WHEN p.temp_ai_expires_at IS NOT NULL AND p.temp_ai_expires_at > now()
        THEN p.temp_ai_uses
      ELSE 0
    END AS temp_ai_uses,
    CASE
      WHEN p.temp_ai_expires_at IS NOT NULL AND p.temp_ai_expires_at > now()
        THEN p.temp_ai_expires_at
      ELSE NULL
    END AS temp_ai_expires_at,
    p.registration_ip
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- 3) Save registration IP to profile (service-role only; called from backend function)
CREATE OR REPLACE FUNCTION public.save_registration_ip(p_user_id uuid, p_ip text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow service role to set IPs (prevents client-side abuse)
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  UPDATE public.profiles
  SET registration_ip = p_ip,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- 4) Batch operations (super admin only + prevent parameter spoofing)
CREATE OR REPLACE FUNCTION public.admin_batch_update_level(
  p_admin_id uuid,
  p_user_ids uuid[],
  p_new_level user_level
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
  v_user_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION 'Permission denied: invalid caller';
  END IF;

  IF NOT public.is_super_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Permission denied: Only super admin can perform batch operations';
  END IF;

  IF p_new_level = 'level_4' THEN
    RAISE EXCEPTION 'Permission denied: level_4 is reserved for super admin';
  END IF;

  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    -- Skip protected users
    IF NOT public.is_super_admin(v_user_id) THEN
      IF p_new_level = 'level_3' THEN
        UPDATE public.profiles
        SET level = p_new_level,
            ai_uses_remaining = 10,
            ai_week_start = now(),
            updated_at = now()
        WHERE user_id = v_user_id;
      ELSIF p_new_level = 'level_2' THEN
        UPDATE public.profiles
        SET level = p_new_level,
            ai_uses_remaining = 1,
            ai_week_start = NULL,
            updated_at = now()
        WHERE user_id = v_user_id;
      ELSE
        UPDATE public.profiles
        SET level = p_new_level,
            ai_uses_remaining = 0,
            ai_week_start = NULL,
            updated_at = now()
        WHERE user_id = v_user_id;
      END IF;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_batch_update_status(
  p_admin_id uuid,
  p_user_ids uuid[],
  p_new_status text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
  v_user_id uuid;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION 'Permission denied: invalid caller';
  END IF;

  IF NOT public.is_super_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Permission denied: Only super admin can perform batch operations';
  END IF;

  IF p_new_status NOT IN ('active', 'banned', 'disabled') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    IF NOT public.is_super_admin(v_user_id) THEN
      UPDATE public.profiles
      SET status = p_new_status,
          updated_at = now()
      WHERE user_id = v_user_id;

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;
