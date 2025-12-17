// Supabase Edge Function: create-order
// Public endpoint (no login) to create an order for a given tenant.
//
// Security model:
// - This function uses the Supabase ANON key (never service_role).
// - It calls a Postgres RPC (public.create_order_public) that:
//   - validates tenant existence (id or slug)
//   - validates that each product belongs to the tenant
//   - fetches authoritative prices from the DB
//   - calculates totals server-side
//   - inserts orders + order_items in a single transaction

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CreateOrderItemInput = {
  product_id: string;
  quantity: number;
};

type CreateOrderBody = {
  tenant_id?: string;
  tenant_slug?: string;
  items: CreateOrderItemInput[];
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// Limits to mitigate abuse / accidental large payloads
const MAX_ITEMS = 100;
const MAX_QUANTITY = 10000;
const MAX_PRODUCT_ID_LENGTH = 200;
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  // Ensure client sends JSON
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonResponse(415, { error: "Content-Type must be application/json" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(500, {
      error: "Server misconfigured: missing SUPABASE_URL or SUPABASE_ANON_KEY",
    });
  }

  let payload: CreateOrderBody;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const tenant_id = isNonEmptyString(payload?.tenant_id) ? payload.tenant_id.trim() : undefined;
  const tenant_slug = isNonEmptyString(payload?.tenant_slug) ? payload.tenant_slug.trim() : undefined;

  if (!tenant_id && !tenant_slug) {
    return jsonResponse(400, { error: "tenant_id or tenant_slug is required" });
  }

  if (!Array.isArray(payload?.items) || payload.items.length === 0) {
    return jsonResponse(400, { error: "items must be a non-empty array" });
  }

  if (payload.items.length > MAX_ITEMS) {
    return jsonResponse(413, { error: `Too many items; max ${MAX_ITEMS}` });
  }

  // Validate items shape early (DB will validate again).
  const items: CreateOrderItemInput[] = [];
  for (const item of payload.items) {
    const product_id = isNonEmptyString(item?.product_id) ? item.product_id.trim() : "";
    const quantity = Number(item?.quantity);

    if (!product_id) {
      return jsonResponse(400, { error: "Each item must have product_id" });
    }
    if (product_id.length > MAX_PRODUCT_ID_LENGTH) {
      return jsonResponse(400, { error: "product_id is too long" });
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      return jsonResponse(400, { error: "Each item.quantity must be a positive integer" });
    }
    if (quantity > MAX_QUANTITY) {
      return jsonResponse(400, { error: `item.quantity exceeds limit ${MAX_QUANTITY}` });
    }

    items.push({ product_id, quantity });
  }

  // Use anon client; no user session required.
  // Forwarding the caller's Authorization header is potentially sensitive —
  // make it opt-in via env `FORWARD_AUTH_HEADER=1`.
  const authHeader = req.headers.get("Authorization") ?? undefined;
  const forwardAuth = Deno.env.get("FORWARD_AUTH_HEADER") === "1";
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: forwardAuth && authHeader ? { Authorization: authHeader } : {},
    },
  });

  // Call RPC that performs tenant isolation + authoritative pricing + transaction.
  let rpcResponse;
  try {
    rpcResponse = await supabase.rpc("create_order_public", {
      p_tenant_id: tenant_id ?? null,
      p_tenant_slug: tenant_slug ?? null,
      p_items: items,
    });
  } catch (e) {
    console.error("RPC invocation failed:", e);
    return jsonResponse(502, { error: "Upstream service error" });
  }

  const { data, error } = rpcResponse;
  if (error) {
    // Log internal error but return generic message to the caller.
    console.error("create_order_public error:", error);
    return jsonResponse(400, { error: "Could not create order" });
  }

  // Supabase RPC returns an array for SETOF/TABLE returns.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.order_id || row?.total === undefined || row?.total === null) {
    return jsonResponse(500, { error: "Unexpected RPC response" });
  }

  return jsonResponse(200, {
    order_id: row.order_id,
    total: row.total,
  });
});
