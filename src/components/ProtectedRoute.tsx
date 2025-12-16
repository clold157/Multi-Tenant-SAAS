import React, { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';

export type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: 'owner' | 'admin' | 'staff';
  fallback?: ReactNode;
};

export function ProtectedRoute({
  children,
  requiredRole = 'staff',
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { role } = useTenant();

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!user) {
    return fallback || <div className="p-4 text-red-600">You must be logged in</div>;
  }

  if (!role) {
    return fallback || <div className="p-4 text-red-600">You do not have access to any tenant</div>;
  }

  // Check role hierarchy
  const roleHierarchy: Record<string, number> = {
    owner: 3,
    admin: 2,
    staff: 1,
  };

  const hasRequiredRole = roleHierarchy[role] >= roleHierarchy[requiredRole];

  if (!hasRequiredRole) {
    return (
      fallback || (
        <div className="p-4 text-red-600">
          You do not have permission to access this page. Required role: {requiredRole}
        </div>
      )
    );
  }

  return <>{children}</>;
}
