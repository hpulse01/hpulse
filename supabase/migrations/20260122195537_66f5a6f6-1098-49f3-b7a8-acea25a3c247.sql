
-- Drop and recreate admin_get_all_users with new temp AI fields
DROP FUNCTION IF EXISTS public.admin_get_all_users(uuid);

CREATE FUNCTION public.admin_get_all_users(p_admin_id uuid)
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
  temp_ai_expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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
    END AS temp_ai_expires_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;
