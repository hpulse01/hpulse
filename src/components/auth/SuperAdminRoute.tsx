import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAccess } from '@/hooks/useAdminAccess';

interface Props {
  children: ReactNode;
}

export function SuperAdminRoute({ children }: Props) {
  const { isLoading, isAuthenticated, isSuperAdmin } = useAdminAccess();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">验证权限中...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
