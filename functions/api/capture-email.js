const SYSTEME_API_URL = "https://api.systeme.io/api/contacts";

const ALLOWED_TAGS = new Set([
  "guides-capture",
  "homepage-capture",
  "klaviyo-calculator",
  "scanner-plan",
  "stack-capture",
]);

export async function onRequestPost(context) {
  const { request, env } = context;

  const cors = {
    "Access-Control-Allow-Origin": "https://stackarchitect.xyz",
    "Content-Type": "application/json",
  };

  if (!env.SYSTEME_API_KEY) {
    console.error("SYSTEME_API_KEY binding is not configured");
    return json({ error: "Capture unavailable" }, 503, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, cors);
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "Body must be a JSON object" }, 400, cors);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Invalid email" }, 400, cors);
  }

  const tag = ALLOWED_TAGS.has(body.tag) ? body.tag : "site-capture";

  let upstream;
  try {
    upstream = await fetch(SYSTEME_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.SYSTEME_API_KEY,
      },
      body: JSON.stringify({ email, tags: [{ name: tag }] }),
    });
  } catch {
    return json({ error: "Upstream unreachable" }, 502, cors);
  }

  // 409 = contact already exists; a success from the visitor's perspective.
  if (upstream.ok || upstream.status === 409) {
    return json({ success: true }, 200, cors);
  }

  console.error("Systeme.io error", upstream.status);
  return json({ error: "Capture failed" }, 502, cors);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "https://stackarchitect.xyz",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function json(payload, status, headers) {
  return new Response(JSON.stringify(payload), { status, headers });
}
