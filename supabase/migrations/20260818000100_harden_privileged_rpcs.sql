-- Commercial security hardening for SECURITY DEFINER RPCs.
-- Never trust a caller-supplied user/admin UUID without binding it to auth.uid().

BEGIN;

CREATE OR REPLACE FUNCTION public.admin_update_user_level(
  p_admin_id uuid,
  p_target_user_id uuid,
  p_new_level public.user_level
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION 'Permission denied: invalid caller';
  END IF;
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Not an admin';
  END IF;
  IF public.is_super_admin(p_target_user_id) THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify super admin';
  END IF;
  IF p_new_level = 'level_4' THEN
    RAISE EXCEPTION 'Permission denied: level_4 is reserved for super admin';
  END IF;

  UPDATE public.profiles
  SET level = p_new_level,
      ai_uses_remaining = CASE
        WHEN p_new_level = 'level_3' THEN 10
        WHEN p_new_level = 'level_2' THEN 1
        ELSE 0
      END,
      ai_week_start = CASE WHEN p_new_level = 'level_3' THEN now() ELSE NULL END,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  p_admin_id uuid,
  p_target_user_id uuid,
  p_new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION 'Permission denied: invalid caller';
  END IF;
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Not an admin';
  END IF;
  IF public.is_super_admin(p_target_user_id) THEN
    RAISE EXCEPTION 'Permission denied: Cannot modify super admin';
  END IF;
  IF p_new_status NOT IN ('active', 'banned', 'disabled') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  UPDATE public.profiles
  SET status = p_new_status, updated_at = now()
  WHERE user_id = p_target_user_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_admin_id uuid,
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION 'Permission denied: invalid caller';
  END IF;
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Only super admin can delete users';
  END IF;
  IF public.is_super_admin(p_target_user_id) THEN
    RAISE EXCEPTION 'Permission denied: Cannot delete super admin';
  END IF;

  DELETE FROM public.profiles WHERE user_id = p_target_user_id;
  RETURN FOUND;
END;
$$;

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
  IF auth.uid() IS NULL OR auth.uid() <> p_admin_id THEN
    RAISE EXCEPTION 'Permission denied: invalid caller';
  END IF;
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: Only super admin can grant temporary AI uses';
  END IF;
  IF p_uses IS NULL OR p_uses <= 0 OR p_uses > 1000 THEN
    RAISE EXCEPTION 'Invalid uses amount';
  END IF;
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

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_use_ai(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_level public.user_level;
  v_remaining integer;
  v_week_start timestamptz;
  v_temp_uses integer;
  v_temp_expires timestamptz;
  v_now timestamptz := now();
BEGIN
  IF auth.role() <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'Permission denied: invalid caller';
  END IF;

  SELECT level, ai_uses_remaining, ai_week_start, temp_ai_uses, temp_ai_expires_at
  INTO v_level, v_remaining, v_week_start, v_temp_uses, v_temp_expires
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN RETURN false; END IF;
  IF v_level = 'level_4' THEN RETURN true; END IF;
  IF COALESCE(v_temp_uses, 0) > 0 AND v_temp_expires > v_now THEN RETURN true; END IF;
  IF v_level = 'level_3' THEN
    RETURN v_week_start IS NULL
      OR (v_now - v_week_start) >= interval '7 days'
      OR COALESCE(v_remaining, 0) > 0;
  END IF;
  RETURN v_level = 'level_2' AND COALESCE(v_remaining, 0) > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_use(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_level public.user_level;
  v_remaining integer;
  v_week_start timestamptz;
  v_temp_uses integer;
  v_temp_expires timestamptz;
  v_now timestamptz := now();
BEGIN
  IF auth.role() <> 'service_role'
     AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'Permission denied: invalid caller';
  END IF;

  SELECT level, ai_uses_remaining, ai_week_start, temp_ai_uses, temp_ai_expires_at
  INTO v_level, v_remaining, v_week_start, v_temp_uses, v_temp_expires
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN false; END IF;
  IF v_level = 'level_4' THEN RETURN true; END IF;

  IF v_temp_expires IS NOT NULL AND v_temp_expires <= v_now THEN
    UPDATE public.profiles
    SET temp_ai_uses = 0, temp_ai_expires_at = NULL, updated_at = v_now
    WHERE user_id = p_user_id;
    v_temp_uses := 0;
    v_temp_expires := NULL;
  END IF;

  IF COALESCE(v_temp_uses, 0) > 0 AND v_temp_expires > v_now THEN
    UPDATE public.profiles
    SET temp_ai_uses = temp_ai_uses - 1, updated_at = v_now
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;

  IF v_level = 'level_3' THEN
    IF v_week_start IS NULL OR (v_now - v_week_start) >= interval '7 days' THEN
      UPDATE public.profiles
      SET ai_uses_remaining = 9, ai_week_start = v_now, updated_at = v_now
      WHERE user_id = p_user_id;
      RETURN true;
    ELSIF COALESCE(v_remaining, 0) > 0 THEN
      UPDATE public.profiles
      SET ai_uses_remaining = ai_uses_remaining - 1, updated_at = v_now
      WHERE user_id = p_user_id;
      RETURN true;
    END IF;
    RETURN false;
  END IF;

  IF v_level = 'level_2' AND COALESCE(v_remaining, 0) > 0 THEN
    UPDATE public.profiles
    SET ai_uses_remaining = ai_uses_remaining - 1, updated_at = v_now
    WHERE user_id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user_level(uuid, uuid, public.user_level) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_update_user_status(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_grant_temp_ai_uses(uuid, uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_all_users(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_batch_update_level(uuid, uuid[], public.user_level) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_batch_update_status(uuid, uuid[], text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_use_ai(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_ai_use(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_update_user_level(uuid, uuid, public.user_level) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_user_status(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_grant_temp_ai_uses(uuid, uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_batch_update_level(uuid, uuid[], public.user_level) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_batch_update_status(uuid, uuid[], text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_use_ai(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_ai_use(uuid) TO authenticated, service_role;

COMMIT;
