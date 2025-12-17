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
// - CORS is restricted to specific allowed origins (mitigates abuse)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// ALLOWED ORIGINS - Configure these for your deployment
// ============================================================================
// These origins are allowed to make requests to this function.
// 1. Development: http://localhost:3000
// 2. Production: Your actual domain (e.g., https://meusite.com)
// 
// Environment variable ALLOWED_ORIGINS (comma-separated) overrides defaults:
// ALLOWED_ORIGINS=http://localhost:3000,https://meusite.com
// ============================================================================

function getAllowedOrigins(): string[] {
  // Get from environment variable (can be overridden in Supabase dashboard)
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");
  if (envOrigins) {
    return envOrigins.split(",").map(o => o.trim()).filter(o => o.length > 0);
  }

  // Fallback defaults
  return [
    "http://localhost:3000",
    "http://localhost:3001",
    // Add your production domain here
    // "https://meusite.com",
  ];
}

/**
 * Validates if the incoming request origin is allowed.
 * Mitigates CORS abuse by restricting which origins can call this function.
 *
 * @param origin - The Origin header from the request
 * @returns true if origin is allowed, false otherwise
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    // Some clients don't send Origin header (e.g., server-to-server, curl)
    // We allow these for legitimate use cases (but they won't have CORS headers)
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.some(allowed => origin === allowed);
}

/**
 * Builds CORS headers based on the request origin.
 * Only echoes the origin back if it's in the allowed list.
 *
 * @param requestOrigin - The Origin header from the request
 * @returns CORS headers object
 */
function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400", // 24 hours
  };

  // Only add Origin to response if it's allowed
  if (requestOrigin && isOriginAllowed(requestOrigin)) {
    headers["Access-Control-Allow-Origin"] = requestOrigin;
    headers["Access-Control-Allow-Credentials"] = "false";
  }

  return headers;
}

type CreateOrderItemInput = {
  product_id: string;
  quantity: number;
};

type CreateOrderBody = {
  tenant_id?: string;
  tenant_slug?: string;
  items: CreateOrderItemInput[];
};

function jsonResponse(status: number, body: unknown, corsHeaders: Record<string, string>) {
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
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(requestOrigin);

  // ============================================================================
  // CORS PREFLIGHT - Handle OPTIONS requests
  // ============================================================================
  if (req.method === "OPTIONS") {
    // If origin is not allowed, still respond with 200 but without Access-Control headers
    if (requestOrigin && !isOriginAllowed(requestOrigin)) {
      console.warn(`CORS preflight rejected for origin: ${requestOrigin}`);
      return new Response("", { status: 200 });
    }

    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  // ============================================================================
  // CORS ENFORCEMENT - Validate origin for actual requests
  // ============================================================================
  if (requestOrigin && !isOriginAllowed(requestOrigin)) {
    console.warn(`Request rejected: disallowed origin "${requestOrigin}"`);
    return jsonResponse(403, {
      error: "Origin not allowed. This endpoint only accepts requests from configured origins.",
    }, corsHeaders);
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, corsHeaders);
  }

  // Ensure client sends JSON
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return jsonResponse(415, { error: "Content-Type must be application/json" }, corsHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(500, {
      error: "Server misconfigured: missing SUPABASE_URL or SUPABASE_ANON_KEY",
    }, corsHeaders);
  }

  let payload: CreateOrderBody;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" }, corsHeaders);
  }

  const tenant_id = isNonEmptyString(payload?.tenant_id) ? payload.tenant_id.trim() : undefined;
  const tenant_slug = isNonEmptyString(payload?.tenant_slug) ? payload.tenant_slug.trim() : undefined;

  if (!tenant_id && !tenant_slug) {
    return jsonResponse(400, { error: "tenant_id or tenant_slug is required" }, corsHeaders);
  }

  if (!Array.isArray(payload?.items) || payload.items.length === 0) {
    return jsonResponse(400, { error: "items must be a non-empty array" }, corsHeaders);
  }

  if (payload.items.length > MAX_ITEMS) {
    return jsonResponse(413, { error: `Too many items; max ${MAX_ITEMS}` }, corsHeaders);
  }

  // Validate items shape early (DB will validate again).
  const items: CreateOrderItemInput[] = [];
  for (const item of payload.items) {
    const product_id = isNonEmptyString(item?.product_id) ? item.product_id.trim() : "";
    const quantity = Number(item?.quantity);

    if (!product_id) {
      return jsonResponse(400, { error: "Each item must have product_id" }, corsHeaders);
    }
    if (product_id.length > MAX_PRODUCT_ID_LENGTH) {
      return jsonResponse(400, { error: "product_id is too long" }, corsHeaders);
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      return jsonResponse(400, { error: "Each item.quantity must be a positive integer" }, corsHeaders);
    }
    if (quantity > MAX_QUANTITY) {
      return jsonResponse(400, { error: `item.quantity exceeds limit ${MAX_QUANTITY}` }, corsHeaders);
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
    return jsonResponse(502, { error: "Upstream service error" }, corsHeaders);
  }

  const { data, error } = rpcResponse;
  if (error) {
    // Log internal error but return generic message to the caller.
    console.error("create_order_public error:", error);
    return jsonResponse(400, { error: "Could not create order" }, corsHeaders);
  }

  // Supabase RPC returns an array for SETOF/TABLE returns.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.order_id || row?.total === undefined || row?.total === null) {
    return jsonResponse(500, { error: "Unexpected RPC response" }, corsHeaders);
  }

  return jsonResponse(200, {
    order_id: row.order_id,
    total: row.total,
  }, corsHeaders);
});
