// POST /api/submit-gap
// Accepts a store's two raw numbers, validates hard, computes the gap server-side,
// stores as 'pending'. Never trusts a client-sent percentage.

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS / content guard
  const cors = {
    "Access-Control-Allow-Origin": "https://stackarchitect.xyz",
    "Content-Type": "application/json",
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, cors);
  }

  const meta = Number(body.meta_reported);
  const orders = Number(body.actual_orders);
  const windowDays = Number(body.window_days);
  const note = (body.platform_note ?? "").toString().slice(0, 280);

  // Hard validation — reject anything that can't be a real measurement.
  if (!Number.isInteger(meta) || meta < 0) return json({ error: "meta_reported must be a non-negative integer" }, 400, cors);
  if (!Number.isInteger(orders) || orders <= 0) return json({ error: "actual_orders must be a positive integer" }, 400, cors);
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 365) return json({ error: "window_days must be 1–365" }, 400, cors);
  if (meta > orders) return json({ error: "meta_reported cannot exceed actual_orders" }, 400, cors);
  // Sanity floor: tiny samples are noise, not data.
  if (orders < 20) return json({ error: "actual_orders must be at least 20 for a meaningful measurement" }, 422, cors);

  const gap = (orders - meta) / orders; // 0..1, computed here, never from client

  // Hash IP for dedupe/abuse only — never store raw.
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ipHash = ip ? await sha256(ip) : null;
  const ua = (request.headers.get("User-Agent") || "").slice(0, 200);

  try {
    await env.DB.prepare(
      `INSERT INTO submissions
       (meta_reported, actual_orders, window_days, gap_pct, platform_note, ip_hash, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(meta, orders, windowDays, gap, note || null, ipHash, ua).run();
  } catch (e) {
    return json({ error: "Could not store submission" }, 500, cors);
  }

  return json({ ok: true, message: "Submitted for review. Thank you for contributing real data." }, 200, cors);
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "https://stackarchitect.xyz",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function json(obj, status, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...extra } });
}

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
