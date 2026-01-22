-- Allow realtime/admin page to receive profile change events: super_admin can SELECT all profiles
-- This is required because Realtime changefeeds are filtered by RLS SELECT policies.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Super admins can view all profiles'
  ) THEN
    CREATE POLICY "Super admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (public.has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END $$;
