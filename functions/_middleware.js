// Cloudflare Pages Edge Middleware — Host & Protocol Canonicalization
// Forces www.stackarchitect.xyz -> stackarchitect.xyz via 301 Permanent Redirect.
export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Check if host starts with www. or if request is HTTP on production
  if (url.hostname.startsWith('www.') || url.protocol === 'http:') {
    url.hostname = url.hostname.replace(/^www\./, '');
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
