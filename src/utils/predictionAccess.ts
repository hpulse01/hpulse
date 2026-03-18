import type { UserProfile } from '@/hooks/useAuth';

export function isSuperAdminProfile(profile: UserProfile | null | undefined): boolean {
  return profile?.level === 'level_4';
}

export function assertSuperAdminAccess(profile: UserProfile | null | undefined): void {
  if (!isSuperAdminProfile(profile)) {
    throw new Error('Super admin access required for orchestration payload');
  }
}
