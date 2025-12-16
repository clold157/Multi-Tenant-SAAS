# Multi-Tenant Authentication Flow - Complete Documentation

## Overview

This SaaS implements a complete multi-tenant authentication system using Supabase Auth + PostgreSQL RLS. Every user starts with their own tenant, but can be invited to manage multiple restaurants.

---

## Architecture Diagram

```
User Signup/Login
      ↓
Supabase Auth (email/password)
      ↓
Trigger: handle_new_user()
      ├─ Creates: tenants table entry
      ├─ Creates: tenant_users with role='owner'
      └─ Creates: subscriptions (trial plan)
      ↓
Frontend: AuthProvider loads user tenants
      ↓
JWT includes tenant_id + role (via claims)
      ↓
RLS policies validate every query by tenant_id
```

---

## 1. Database Layer - Backend Security

### Auto-Tenant Creation (Trigger)

**File**: Database Migration `setup_auth_and_multi_tenancy`

When a new user signs up via Supabase Auth, the `handle_new_user()` trigger automatically:

1. Generates a unique slug from email
2. Creates a new `tenants` record
3. Adds user to `tenant_users` with role='owner'
4. Creates initial 'trial' subscription

```sql
-- Trigger fires on auth.users INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### Role Hierarchy

- **owner**: Full control (create users, manage billing, configure tenant)
- **admin**: Operational management (manage products, view all orders)
- **staff**: View and manage orders only

### RLS Policies

Every table has RLS enabled. Example from `products` table:

```sql
-- Staff can view products
CREATE POLICY "Users can view tenant products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = products.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

-- Only admins can create/update
CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = products.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = products.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('owner', 'admin')
    )
  );
```

### Key Helper Functions

```sql
-- Get all tenants user belongs to
get_user_tenant_and_role(user_id)
  → Returns: tenant_id, role, tenant_name

-- Switch to another tenant (validates access)
user_can_switch_tenant(user_id, target_tenant_id)
  → Returns: boolean

-- Check user role
is_tenant_owner(user_id, target_tenant_id)
is_tenant_admin(user_id, target_tenant_id)

-- Invite user to tenant
invite_user_to_tenant(target_tenant_id, target_email, target_role)
  → Returns: success, message, tenant_user_id
```

---

## 2. Frontend Layer - React Hooks

### Setup: AuthProvider

Wrap your app with `AuthProvider` to enable auth context:

```tsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}
```

### Hook: useAuth()

Access authentication state:

```tsx
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const {
    session,           // Supabase Session object
    user,              // { id, email, user_metadata }
    tenants,           // TenantInfo[] - all tenants user belongs to
    currentTenant,     // TenantInfo - currently active tenant
    loading,           // boolean
    error,             // string | null
    signUp,            // (email, password) => Promise
    signIn,            // (email, password) => Promise
    signOut,           // () => Promise
    switchTenant,      // (tenantId) => Promise
  } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!session) return <LoginForm />;

  return <div>Welcome {user?.email}</div>;
}
```

### Hook: useTenant()

Access current tenant and permissions:

```tsx
import { useTenant } from './hooks/useTenant';

function MyComponent() {
  const {
    tenant,           // TenantInfo | null
    tenantId,         // string | null
    role,             // 'owner' | 'admin' | 'staff' | null
    isOwner,          // boolean
    isAdmin,          // boolean
    isStaff,          // boolean
    canManageUsers,   // boolean (owner only)
    canManageProducts,// boolean (admin+)
    canViewOrders,    // boolean (all roles)
  } = useTenant();

  if (!isAdmin) return <div>Admin access required</div>;

  return <AdminPanel />;
}
```

### Component: ProtectedRoute

Gate components by role:

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

export function Dashboard() {
  return (
    <>
      {/* Owner only */}
      <ProtectedRoute requiredRole="owner">
        <BillingPanel />
      </ProtectedRoute>

      {/* Admin and owner */}
      <ProtectedRoute requiredRole="admin">
        <ProductManagement />
      </ProtectedRoute>

      {/* All authenticated users */}
      <ProtectedRoute requiredRole="staff">
        <OrderTracking />
      </ProtectedRoute>
    </>
  );
}
```

---

## 3. Security Flow - End-to-End

### Signup Flow

```
1. User enters email + password in UI
   ↓
2. Frontend: signUp(email, password)
   ↓
3. Supabase Auth validates and creates auth.users entry
   ↓
4. Trigger handle_new_user() fires:
   - Creates tenants record
   - Creates tenant_users (role='owner')
   - Creates subscriptions (trial)
   ↓
5. Frontend: useAuth loads tenants via rpc('get_user_tenant_and_role')
   ↓
6. User is now authenticated with tenant context
```

### Query Flow (Example: Fetch Products)

```
1. Frontend code: supabase.from('products').select()
   ↓
2. Supabase adds auth.uid() to JWT context
   ↓
3. PostgreSQL RLS policy evaluates:
   "Can auth.uid() access products.tenant_id?"
   ↓
4. RLS checks: Does tenant_users entry exist for:
   - user_id = auth.uid()
   - tenant_id = products.tenant_id
   - is_active = true
   ↓
5. If yes → data returned
   If no → ZERO rows returned (no error, silent)
   ↓
6. Frontend receives only authorized data
```

### Multi-Tenant Switch Flow

```
1. User has access to 2 tenants: Pizza Co + Burger Co
2. Frontend: switchTenant('pizza-co-id')
   ↓
3. Backend: user_can_switch_tenant() validates:
   - Does tenant_users entry exist?
   - Is is_active = true?
   ↓
4. If valid: currentTenant state updates
   ↓
5. All subsequent queries use new tenant context
   (RLS automatically filters by new tenant_id)
   ↓
6. User is now viewing Pizza Co's data
```

---

## 4. Security Principles

### Never Trust Frontend

❌ **BAD**: Send tenant_id from frontend
```tsx
// DO NOT DO THIS
const { data } = await supabase
  .from('products')
  .select()
  .eq('tenant_id', userProvidedTenantId);
```

✅ **GOOD**: Let RLS handle tenant filtering
```tsx
// Frontend sends nothing about tenant
const { data } = await supabase
  .from('products')
  .select();
// RLS automatically filters by auth.uid()
```

### Validation Layers

1. **Auth**: Supabase Auth (passwords hashed, JWT signed)
2. **RLS**: PostgreSQL policies validate tenant_id per query
3. **Business Logic**: Helper functions check roles
4. **Frontend**: useTenant hook shows UI conditionally

### Attack Prevention

| Attack | Prevention |
|--------|-----------|
| Access other tenant's data | RLS requires tenant_users entry |
| Escalate role (staff → admin) | role field immutable via RLS |
| Fake JWT claims | JWT signed by Supabase, client can't modify |
| Bypass auth | RLS requires auth.uid() check |
| SQL injection | Supabase client uses parameterized queries |

---

## 5. Implementation Checklist

### Backend Setup
- ✅ Database schema created (9 tables with RLS)
- ✅ Trigger for auto-tenant creation
- ✅ Helper functions for role checking
- ✅ RLS policies on all tables

### Frontend Setup
- ✅ Supabase client (`lib/supabase.ts`)
- ✅ AuthContext with state management
- ✅ useAuth hook for auth operations
- ✅ useTenant hook for permissions
- ✅ ProtectedRoute component for gating
- ✅ AuthFlow component for login UI

### Testing Checklist
- [ ] Create account → auto-tenant created
- [ ] Login with correct password → access granted
- [ ] Login with wrong password → access denied
- [ ] User sees only their tenant's data
- [ ] Owner can invite other users
- [ ] Staff cannot access admin features
- [ ] Switch tenant → data changes correctly
- [ ] Sign out → session cleared

---

## 6. Usage Examples

### Example 1: Protected Admin Component

```tsx
function ManageUsers() {
  const { isOwner } = useTenant();
  const { user, error: authError } = useAuth();

  if (!isOwner) {
    return <div>Owner access required</div>;
  }

  return (
    <ProtectedRoute requiredRole="owner">
      <div>
        <h2>Manage Team Members</h2>
        {/* Invite form would go here */}
      </div>
    </ProtectedRoute>
  );
}
```

### Example 2: Query with Tenant Context

```tsx
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';

function ProductList() {
  const { currentTenant } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!currentTenant) return;

    const loadProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select()
        .eq('tenant_id', currentTenant.tenant_id);

      setProducts(data || []);
    };

    loadProducts();
  }, [currentTenant?.tenant_id]);

  return <div>{/* Render products */}</div>;
}
```

### Example 3: Multi-Tenant Switcher

```tsx
function TenantSwitcher() {
  const { tenants, currentTenant, switchTenant } = useAuth();

  return (
    <select
      value={currentTenant?.tenant_id || ''}
      onChange={(e) => switchTenant(e.target.value)}
    >
      {tenants.map((tenant) => (
        <option key={tenant.tenant_id} value={tenant.tenant_id}>
          {tenant.tenant_name}
        </option>
      ))}
    </select>
  );
}
```

---

## 7. File Structure

```
src/
├── lib/
│   └── supabase.ts              # Supabase client setup
├── contexts/
│   └── AuthContext.tsx          # Auth state + provider
├── hooks/
│   ├── useAuth.ts               # Auth state hook
│   └── useTenant.ts             # Tenant permissions hook
├── components/
│   ├── AuthFlow.tsx             # Login/signup UI
│   ├── ProtectedRoute.tsx        # Role-based gate
│   └── DashboardExample.tsx      # Example components
└── App.tsx                       # Wrapped with AuthProvider
```

---

## 8. Scaling Considerations

### For 10,000+ Tenants

1. **Index Strategy**: Already implemented on tenant_id
   ```sql
   CREATE INDEX idx_products_tenant_id ON products(tenant_id);
   CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status);
   ```

2. **RLS Performance**: Policies use indexed lookups
   - `tenant_users` has (tenant_id, user_id) unique constraint
   - Queries are O(1) instead of O(n)

3. **JWT Claims**: Optional optimization
   - Store tenant_id in JWT claims to avoid RPC call
   - Use Supabase "Auth Hooks" (enterprise feature)
   - Frontend receives tenant_id in token payload

4. **Connection Pooling**: Use Supabase connection pooling
   - Already included in Supabase plan

---

## 9. Troubleshooting

### "User not found in tenant_users"
- Check if trigger executed after signup (wait 1-2 seconds)
- Verify auth.users entry was created
- Check RLS policies aren't blocking insert

### "RLS denies access"
- Verify tenant_users entry exists for user+tenant
- Check is_active = true
- Ensure role hierarchy is correct for operation

### "JWT token invalid"
- Supabase client automatically handles JWT refresh
- If persists, clear localStorage and re-login

### "Wrong tenant data showing"
- Verify currentTenant is set correctly
- Check all queries filter by tenant_id
- Ensure RLS isn't bypassed

---

## 10. Next Steps

1. Deploy migration to production database
2. Test signup flow end-to-end
3. Implement email verification (optional)
4. Add multi-factor authentication (optional)
5. Create admin dashboard for tenant management
6. Implement usage tracking and billing integration
