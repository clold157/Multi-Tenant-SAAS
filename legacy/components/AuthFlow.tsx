import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';

export function AuthFlow() {
  const { session, user, tenants, currentTenant, loading, error, signUp, signIn, signOut, switchTenant } = useAuth();
  const { isOwner, isAdmin } = useTenant();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setEmail('');
        setPassword('');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to sign out');
    }
  };

  const handleSwitchTenant = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to switch tenant');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50">Loading authentication...</div>;
  }

  // Not authenticated
  if (!session || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {authError && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{authError}</div>}
            {error && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
            >
              {submitting ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError(null);
              }}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="text-gray-900 font-medium text-sm">{user.id}</p>
            </div>
          </div>
        </div>

        {/* Current Tenant */}
        {currentTenant && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Tenant</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tenant Name</p>
                <p className="text-gray-900 font-medium">{currentTenant.tenant_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tenant ID</p>
                <p className="text-gray-900 font-medium text-sm">{currentTenant.tenant_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-gray-900 font-medium capitalize">{currentTenant.role}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isOwner}
                  disabled
                  className="rounded"
                  id="owner"
                />
                <label htmlFor="owner" className="text-sm text-gray-700">
                  Is Owner
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  disabled
                  className="rounded"
                  id="admin"
                />
                <label htmlFor="admin" className="text-sm text-gray-700">
                  Is Admin
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tenant Switcher */}
        {tenants.length > 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Switch Tenant</h2>
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <button
                  key={tenant.tenant_id}
                  onClick={() => handleSwitchTenant(tenant.tenant_id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    currentTenant?.tenant_id === tenant.tenant_id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <p className="font-medium text-gray-900">{tenant.tenant_name}</p>
                  <p className="text-xs text-gray-500 capitalize">Role: {tenant.role}</p>
                </button>
              ))}
            </div>
            {authError && <div className="mt-3 p-3 bg-red-50 text-red-700 rounded text-sm">{authError}</div>}
          </div>
        )}
      </main>
    </div>
  );
}
