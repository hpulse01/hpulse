import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface RoleAccessState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  level: ReturnType<typeof useAuth>['profile']['level'] | null;
}

export function useRoleAccess(): RoleAccessState {
  const { user, profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkRoles() {
      if (!user?.id) {
        if (!cancelled) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsCheckingRoles(false);
        }
        return;
      }

      setIsCheckingRoles(true);
      try {
        const [adminResult, superAdminResult] = await Promise.all([
          supabase.rpc('is_admin', { _user_id: user.id }),
          supabase.rpc('is_super_admin', { _user_id: user.id }),
        ]);

        if (!cancelled) {
          setIsAdmin(adminResult.data === true);
          setIsSuperAdmin(superAdminResult.data === true);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingRoles(false);
        }
      }
    }

    if (!authLoading) {
      void checkRoles();
    }

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  return useMemo(() => ({
    isLoading: authLoading || isCheckingRoles,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    level: profile?.level ?? null,
  }), [authLoading, isCheckingRoles, isAuthenticated, isAdmin, isSuperAdmin, profile?.level]);
}
