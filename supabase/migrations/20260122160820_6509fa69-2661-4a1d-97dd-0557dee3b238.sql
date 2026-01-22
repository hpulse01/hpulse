-- Drop the old function first (signature changed)
DROP FUNCTION IF EXISTS public.admin_get_all_users(uuid);

-- Recreate with new return type
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
SET search_path TO 'public'
AS $function$
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
        p.status,
        p.ai_uses_remaining,
        p.total_calculations,
        p.created_at,
        public.is_super_admin(p.user_id) as is_protected
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    ORDER BY p.created_at DESC;
END;
$function$;