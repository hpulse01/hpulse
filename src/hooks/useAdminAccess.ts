import { useMemo } from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';

export function useAdminAccess() {
  const { isAuthenticated, isLoading, isSuperAdmin, level } = useRoleAccess();

  return useMemo(() => ({
    isAuthenticated,
    isLoading,
    isSuperAdmin,
    level,
  }), [isAuthenticated, isLoading, isSuperAdmin, level]);
}
