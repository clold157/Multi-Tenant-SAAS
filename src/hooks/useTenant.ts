import { useAuth } from './useAuth';
import { TenantInfo } from '../lib/supabase';

export type UseTenantReturn = {
  tenant: TenantInfo | null;
  tenantId: string | null;
  role: 'owner' | 'admin' | 'staff' | null;
  isOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  canManageUsers: boolean;
  canManageProducts: boolean;
  canViewOrders: boolean;
};

export function useTenant(): UseTenantReturn {
  const { currentTenant } = useAuth();

  const isOwner = currentTenant?.role === 'owner';
  const isAdmin = currentTenant?.role === 'admin' || isOwner;
  const isStaff = !!currentTenant?.role;

  return {
    tenant: currentTenant,
    tenantId: currentTenant?.tenant_id || null,
    role: currentTenant?.role || null,
    isOwner,
    isAdmin,
    isStaff,
    canManageUsers: isOwner,
    canManageProducts: isAdmin,
    canViewOrders: isStaff,
  };
}
