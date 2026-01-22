-- 1. Add missing 'status' column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- 2. Create is_super_admin function (check if user is specifically super_admin)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- 3. Create admin_update_user_status function
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  p_admin_id uuid,
  p_target_user_id uuid,
  p_new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    
    -- Validate status value
    IF p_new_status NOT IN ('active', 'banned', 'disabled') THEN
        RAISE EXCEPTION 'Invalid status value';
    END IF;
    
    -- Update the user's status
    UPDATE public.profiles 
    SET status = p_new_status, updated_at = now()
    WHERE user_id = p_target_user_id;
    
    RETURN true;
END;
$$;

-- 4. Create admin_delete_user function (only for super_admin)
CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_admin_id uuid,
  p_target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Only super_admin can delete users
    IF NOT public.is_super_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Permission denied: Only super admin can delete users';
    END IF;
    
    -- CRITICAL: Super admins cannot be deleted
    IF public.is_super_admin(p_target_user_id) THEN
        RAISE EXCEPTION 'Permission denied: Cannot delete super admin';
    END IF;
    
    -- Delete from profiles (cascade will handle related data)
    DELETE FROM public.profiles WHERE user_id = p_target_user_id;
    
    -- Note: auth.users deletion requires service role key
    -- For now, we just remove the profile which effectively disables the user
    
    RETURN true;
END;
$$;

-- 5. Fix admin_get_all_users to include status column properly
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
    is_protected boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Check if admin has permission
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
        public.is_super_admin(p.user_id) as is_protected
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    ORDER BY p.created_at DESC;
END;
$$;

-- 6. Enable realtime for profiles table (for admin dashboard sync)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;