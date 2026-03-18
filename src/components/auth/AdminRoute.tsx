import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleAccess } from '@/hooks/useRoleAccess';

interface Props {
  children: ReactNode;
}

export function AdminRoute({ children }: Props) {
  const { isLoading, isAuthenticated, isAdmin } = useRoleAccess();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">验证权限中...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
