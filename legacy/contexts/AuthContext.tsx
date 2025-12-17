import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, AuthUser, TenantInfo } from '../lib/supabase';

export type AuthContextType = {
  session: Session | null;
  user: AuthUser | null;
  tenants: TenantInfo[];
  currentTenant: TenantInfo | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);

        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            user_metadata: data.session.user.user_metadata,
          });

          // Load user's tenants
          await loadUserTenants(data.session.user.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata,
        });

        if (event === 'SIGNED_IN') {
          // Small delay to allow trigger to complete
          setTimeout(() => loadUserTenants(session.user.id), 500);
        }
      } else {
        setUser(null);
        setTenants([]);
        setCurrentTenant(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loadUserTenants = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_tenant_and_role', { user_id: userId });

      if (error) throw error;

      const tenantsList = (data as TenantInfo[]) || [];
      setTenants(tenantsList);

      // Set first tenant as current
      if (tenantsList.length > 0) {
        setCurrentTenant(tenantsList[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenants');
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      setError(null);
      const tenant = tenants.find((t) => t.tenant_id === tenantId);

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Verify user has access to this tenant
      const { data, error } = await supabase.rpc('user_can_switch_tenant', {
        user_id: session!.user.id,
        target_tenant_id: tenantId,
      });

      if (error || !data) {
        throw new Error('You do not have access to this tenant');
      }

      setCurrentTenant(tenant);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to switch tenant';
      setError(message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        tenants,
        currentTenant,
        loading,
        error,
        signUp,
        signIn,
        signOut,
        switchTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
