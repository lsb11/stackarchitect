export async function onRequestPost(context) {
  const { request, env } = context;

  const cors = {
    "Access-Control-Allow-Origin": "https://stackarchitect.xyz",
    "Content-Type": "application/json",
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: cors });
  }

  const { email, tags } = body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return new Response(JSON.stringify({ error: "Valid email is required" }), { status: 400, headers: cors });
  }

  const apiKey = env.SYSTEME_IO_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500, headers: cors });
  }

  try {
    const res = await fetch('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ email, tags: tags || [{ name: 'guides-capture' }] }),
    });

    if (!res.ok) {
      // Return a generic error to avoid leaking systeme.io specifics, but forward status if helpful
      return new Response(JSON.stringify({ error: "Failed to submit" }), { status: 500, headers: cors });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: cors });
  }
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
