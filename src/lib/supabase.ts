import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthUser = {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
};

export type TenantInfo = {
  tenant_id: string;
  role: 'owner' | 'admin' | 'staff';
  tenant_name: string;
};
