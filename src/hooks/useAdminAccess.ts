import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isSuperAdminProfile } from '@/utils/predictionAccess';

export function useAdminAccess() {
  const { profile, isAuthenticated, isLoading } = useAuth();

  return useMemo(() => ({
    isAuthenticated,
    isLoading,
    isSuperAdmin: isSuperAdminProfile(profile),
    level: profile?.level ?? null,
  }), [isAuthenticated, isLoading, profile]);
}
