-- Create admin role enum if not exists
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing user_roles table and recreate with proper structure
DROP TABLE IF EXISTS public.user_roles CASCADE;

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is any kind of admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin')
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create function to update user level (for admin use)
CREATE OR REPLACE FUNCTION public.admin_update_user_level(
    p_admin_id uuid,
    p_target_user_id uuid,
    p_new_level user_level
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if admin has permission
    IF NOT public.is_admin(p_admin_id) THEN
        RAISE EXCEPTION 'Permission denied: Not an admin';
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
$$;

-- Create function to get all users (for admin)
CREATE OR REPLACE FUNCTION public.admin_get_all_users(p_admin_id uuid)
RETURNS TABLE(
    user_id uuid,
    email text,
    display_name text,
    level user_level,
    ai_uses_remaining integer,
    total_calculations integer,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        p.ai_uses_remaining,
        p.total_calculations,
        p.created_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    ORDER BY p.created_at DESC;
END;
$$;

-- Create trigger to auto-assign super_admin role for specific email
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Auto-assign super_admin role for the designated email
    IF NEW.email = 'hpulse001@gmail.com' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Also upgrade to level_3
        UPDATE public.profiles 
        SET level = 'level_3', ai_uses_remaining = 999
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users for auto admin assignment
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin_role();