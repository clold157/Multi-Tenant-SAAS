import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import { ProtectedRoute } from './ProtectedRoute';

function AdminPanel() {
  const { user } = useAuth();
  const { tenant, isOwner } = useTenant();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Panel</h2>
      <p className="text-gray-700 mb-4">
        Tenant Owner: <strong>{user?.email}</strong>
      </p>
      <p className="text-gray-700">
        Managing tenant: <strong>{tenant?.tenant_name}</strong>
      </p>
      {isOwner && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-900 font-semibold">You have owner privileges</p>
          <p className="text-blue-800 text-sm mt-2">Can invite users, manage billing, and configure tenant settings</p>
        </div>
      )}
    </div>
  );
}

function ProductManagement() {
  const { canManageProducts } = useTenant();

  if (!canManageProducts) {
    return <div className="p-4 bg-yellow-50 text-yellow-800 rounded">You do not have permission to manage products</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Product Management</h2>
      <p className="text-gray-700">Products would be listed here</p>
    </div>
  );
}

function OrderTracking() {
  const { canViewOrders } = useTenant();

  if (!canViewOrders) {
    return <div className="p-4 bg-yellow-50 text-yellow-800 rounded">You do not have permission to view orders</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Tracking</h2>
      <p className="text-gray-700">Orders would be listed here</p>
    </div>
  );
}

export function DashboardExample() {
  return (
    <div className="space-y-6">
      {/* Admin Panel - Owner only */}
      <ProtectedRoute requiredRole="owner">
        <AdminPanel />
      </ProtectedRoute>

      {/* Product Management - Admin and Owner */}
      <ProtectedRoute requiredRole="admin">
        <ProductManagement />
      </ProtectedRoute>

      {/* Order Tracking - All roles (staff, admin, owner) */}
      <ProtectedRoute requiredRole="staff">
        <OrderTracking />
      </ProtectedRoute>
    </div>
  );
}
