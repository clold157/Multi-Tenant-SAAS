-- Migration: create trigger to auto-create tenant when a user is created
-- Run in Supabase: creates a SECURITY DEFINER function in `auth` schema

-- Notes:
-- - Idempotency: if an entry in `tenant_users` already exists for the new user, the function does nothing.
-- - The function generates a reasonably-unique slug using a sanitized base + UUID suffix to avoid conflicts.
-- - Any error during tenant creation is caught and logged via RAISE NOTICE; the auth.user creation will not be blocked.

CREATE OR REPLACE FUNCTION auth.create_tenant_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  tenant_name text;
  slug_base text;
  candidate_slug text;
  created_tenant_id uuid;
  max_attempts int := 5;
  attempt int := 0;
BEGIN
  -- Basic guard: ensure we have a user id
  IF NEW.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- If the user is already associated to any tenant, do nothing (idempotency)
  IF EXISTS (SELECT 1 FROM public.tenant_users WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Build tenant display name (prefer metadata.name, fallback to email local part)
  tenant_name := COALESCE(
    (NEW.user_metadata ->> 'full_name'),
    (NEW.user_metadata ->> 'name'),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'Tenant'
  );

  -- Base slug: sanitize and lowercase. Keep only [a-z0-9] and dashes.
  slug_base := lower(regexp_replace(tenant_name, '[^a-z0-9]+', '-', 'g'));
  IF slug_base = '' THEN
    slug_base := substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  END IF;

  -- Try to insert a tenant with a unique slug. Add a short uuid suffix to guarantee uniqueness.
  LOOP
    attempt := attempt + 1;
    candidate_slug := left(slug_base, 50) || '-' || substr(gen_random_uuid()::text, 1, 8);

    INSERT INTO public.tenants (name, slug)
    VALUES (tenant_name, candidate_slug)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO created_tenant_id;

    IF created_tenant_id IS NOT NULL THEN
      -- Associate user as owner/admin in tenant_users (idempotent with ON CONFLICT DO NOTHING)
      INSERT INTO public.tenant_users (tenant_id, user_id, role)
      VALUES (created_tenant_id, NEW.id, 'owner')
      ON CONFLICT (tenant_id, user_id) DO NOTHING;

      RETURN NEW;
    END IF;

    IF attempt >= max_attempts THEN
      -- Could not create a unique slug after several attempts; bail out but do not block user creation.
      RAISE NOTICE 'create_tenant_for_new_user: could not create unique tenant slug for user % after % attempts', NEW.id, attempt;
      RETURN NEW;
    END IF;
  END LOOP;

EXCEPTION WHEN OTHERS THEN
  -- Log and do not stop user registration. Admins can reconcile later.
  RAISE NOTICE 'create_tenant_for_new_user: unexpected error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users to run after insert
DROP TRIGGER IF EXISTS create_tenant_after_user_insert ON auth.users;
CREATE TRIGGER create_tenant_after_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.create_tenant_for_new_user();
