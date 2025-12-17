-- =====================================================
-- Public order creation (no login)
-- =====================================================

-- This RPC is the only public surface for order creation.
-- It runs in a single transaction, calculates prices server-side,
-- validates tenant + product ownership, and inserts into orders/order_items.

CREATE OR REPLACE FUNCTION public.create_order_public(
  p_items jsonb,
  p_tenant_id uuid DEFAULT NULL,
  p_tenant_slug text DEFAULT NULL
)
RETURNS TABLE (
  order_id uuid,
  total numeric(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_unit_price numeric(10,2);
  v_product_name text;
BEGIN
  -- Basic payload validation
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty array' USING ERRCODE = '22023';
  END IF;

  -- Resolve tenant (by id or slug)
  IF p_tenant_id IS NOT NULL THEN
    SELECT t.id
      INTO v_tenant_id
    FROM tenants t
    WHERE t.id = p_tenant_id
      AND t.is_active = true;
  ELSIF p_tenant_slug IS NOT NULL AND btrim(p_tenant_slug) <> '' THEN
    SELECT t.id
      INTO v_tenant_id
    FROM tenants t
    WHERE t.slug = p_tenant_slug
      AND t.is_active = true;
  ELSE
    RAISE EXCEPTION 'tenant_id or tenant_slug is required' USING ERRCODE = '22023';
  END IF;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant not found or inactive' USING ERRCODE = 'P0002';
  END IF;

  -- Create an order_number unique per tenant (simple, deterministic enough)
  v_order_number := to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6);

  -- Create order first (totals updated after computing items)
  INSERT INTO orders (
    tenant_id,
    order_number,
    customer_name,
    status,
    subtotal,
    tax,
    delivery_fee,
    total
  ) VALUES (
    v_tenant_id,
    v_order_number,
    'Cliente',
    'pending',
    0,
    0,
    0,
    0
  )
  RETURNING id INTO v_order_id;

  -- Insert items and compute totals server-side
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_product_id := NULLIF(v_item->>'product_id', '')::uuid;
    v_quantity := COALESCE(NULLIF(v_item->>'quantity', '')::int, 0);

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'item.product_id is required' USING ERRCODE = '22023';
    END IF;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'item.quantity must be > 0' USING ERRCODE = '22023';
    END IF;

    -- Fetch authoritative price + ensure product belongs to tenant and is available
    SELECT p.price, p.name
      INTO v_unit_price, v_product_name
    FROM products p
    WHERE p.id = v_product_id
      AND p.tenant_id = v_tenant_id
      AND p.is_available = true;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'product not found, unavailable, or not in tenant' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO order_items (
      tenant_id,
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_tenant_id,
      v_order_id,
      v_product_id,
      v_product_name,
      v_quantity,
      v_unit_price,
      (v_unit_price * v_quantity)
    );

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  END LOOP;

  v_total := v_subtotal;

  UPDATE orders
  SET subtotal = v_subtotal,
      total = v_total
  WHERE id = v_order_id;

  RETURN QUERY
  SELECT v_order_id, v_total;
END;
$$;

-- Allow public (anon) callers to execute the RPC.
-- Important: Postgres' default is to grant EXECUTE to PUBLIC, so we revoke first.
REVOKE EXECUTE ON FUNCTION public.create_order_public(jsonb, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_public(jsonb, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_order_public(jsonb, uuid, text) TO authenticated;

-- NOTE: We do NOT grant direct INSERT on orders/order_items to anon.
-- The only allowed write path is through the RPC above.
