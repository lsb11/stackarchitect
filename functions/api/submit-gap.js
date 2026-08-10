// POST /api/submit-gap
// Accepts a store's two raw numbers, validates hard, computes the gap server-side,
// stores as 'pending'. Never trusts a client-sent percentage.

// Rolling per-network dedupe window. See the block above the SELECT below for
// why 30 days and why this is enforced in the application rather than by a
// UNIQUE index.
const DEDUPE_WINDOW_DAYS = 30;

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

  // The body must be a plain JSON object before any field is read. Previously
  // a JSON `null` body threw a TypeError on body.meta_reported — the try/catch
  // above wraps only request.json() — which the runtime surfaced as an opaque
  // 500. It failed closed, but a malformed payload deserves the same explicit
  // 400 as every other one.
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "Body must be a JSON object" }, 400, cors);
  }

  // Strict integer parsing — see readIntegerField. The previous version called
  // Number() first, which coerced null, false, "", [] and "  " to 0. Because 0
  // is a legitimate meta_reported ("Meta attributed nothing"), those all passed
  // the guard and were stored as gap 1.0 — the maximum possible value, and the
  // exact headline figure this dataset publishes. A submission that merely
  // omitted the field skewed the benchmark.
  const metaField = readIntegerField(body, "meta_reported");
  if (!metaField.ok) return json({ error: "meta_reported must be a non-negative integer" }, 400, cors);
  const ordersField = readIntegerField(body, "actual_orders");
  if (!ordersField.ok) return json({ error: "actual_orders must be a positive integer" }, 400, cors);
  const windowField = readIntegerField(body, "window_days");
  if (!windowField.ok) return json({ error: "window_days must be 1–365" }, 400, cors);

  const meta = metaField.value;
  const orders = ordersField.value;
  const windowDays = windowField.value;

  // platform_note is optional, but if supplied it must actually be a string —
  // an object used to stringify to "[object Object]" and get stored.
  if (body.platform_note !== undefined && body.platform_note !== null && typeof body.platform_note !== "string") {
    return json({ error: "platform_note must be a string" }, 400, cors);
  }
  const note = (body.platform_note ?? "").slice(0, 280);

  // Range validation — reject anything that can't be a real measurement.
  if (meta < 0) return json({ error: "meta_reported must be a non-negative integer" }, 400, cors);
  if (orders <= 0) return json({ error: "actual_orders must be a positive integer" }, 400, cors);
  if (windowDays < 1 || windowDays > 365) return json({ error: "window_days must be 1–365" }, 400, cors);
  if (meta > orders) return json({ error: "meta_reported cannot exceed actual_orders" }, 400, cors);
  // Sanity floor: tiny samples are noise, not data.
  if (orders < 20) return json({ error: "actual_orders must be at least 20 for a meaningful measurement" }, 422, cors);

  const gap = (orders - meta) / orders; // 0..1, computed here, never from client

  // Hash IP for dedupe/abuse only — never store raw.
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ipHash = ip ? await sha256(ip) : null;
  const ua = (request.headers.get("User-Agent") || "").slice(0, 200);

  // ── Dedupe ────────────────────────────────────────────────────────────────
  // ip_hash was written but never read back, and schema.sql has no UNIQUE
  // constraint, so an identical replay (double-click, refresh, retry) inserted
  // a second row and counted twice in the published median.
  //
  // WINDOW: 30 days, rolling, per ip_hash. Chosen to match the modal
  // window_days — two submissions inside one measurement period are
  // necessarily the same measurement, so they cannot be independent data
  // points. After 30 days a store has a genuinely new period and should be
  // able to contribute again; the dataset wants that repeat measurement.
  //
  // Enforced here rather than by a UNIQUE index because
  // `CREATE UNIQUE INDEX` against the live D1 fails outright if duplicate
  // rows already exist. An application check works regardless of existing
  // data. schema.sql carries idx_ip_recent to keep this lookup cheap.
  //
  // Known trade-off: shared egress IPs (agencies, offices, NAT) collapse to
  // one hash, so a second genuine store behind the same IP is refused within
  // the window. That direction is the correct one to err in for a published
  // dataset — a refusal is visible to the submitter and returns 409 with a
  // reason, whereas a double-count is invisible and silently skews the median.
  if (ipHash) {
    try {
      const recent = await env.DB.prepare(
        `SELECT id FROM submissions
          WHERE ip_hash = ?
            AND created_at > datetime('now', ?)
          LIMIT 1`
      ).bind(ipHash, `-${DEDUPE_WINDOW_DAYS} days`).first();

      if (recent) {
        return json({
          error: "A submission from this network was already recorded in the last " +
                 `${DEDUPE_WINDOW_DAYS} days. Each store counts once per measurement period.`,
        }, 409, cors);
      }
    } catch (e) {
      // Fail CLOSED. If we cannot prove this is not a duplicate, do not write.
      return json({ error: "Could not verify submission" }, 500, cors);
    }
  }

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

// Strict integer reader for untrusted input.
//
// The field must be PRESENT as an own property, and must be either a real
// number or a plain decimal string. Type is checked BEFORE any coercion, which
// is the whole point: Number(null), Number(false), Number(""), Number([]) and
// Number("  ") are all 0, and 0 is a legitimate value for meta_reported, so
// coercing first made "field missing" indistinguishable from "Meta attributed
// nothing". Booleans are rejected for the same reason (Number(true) === 1).
//
// Strings are restricted to /^-?\d+$/ so the loose forms Number() accepts —
// hex ("0x10" -> 16) and exponent ("1e2" -> 100) — are refused, while ordinary
// form input ("60") still works. Surrounding whitespace is tolerated;
// whitespace-only is not, because it trims to "" and fails the pattern.
function readIntegerField(body, key) {
  if (!Object.prototype.hasOwnProperty.call(body, key)) return { ok: false };

  const raw = body[key];

  if (typeof raw === "number") {
    return Number.isSafeInteger(raw) ? { ok: true, value: raw } : { ok: false };
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!/^-?\d+$/.test(trimmed)) return { ok: false };
    const n = Number(trimmed);
    return Number.isSafeInteger(n) ? { ok: true, value: n } : { ok: false };
  }

  // boolean, null, undefined, array, object, symbol, bigint
  return { ok: false };
}

function json(obj, status, extra = {}) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...extra } });
}

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
