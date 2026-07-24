import re

with open('src/pages/index.astro', 'r') as f:
    content = f.read()

# Extract frontmatter
fm_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
fm = fm_match.group(1) if fm_match else ""

# Extract JSON-LD schema array
schema_match = re.search(r'(<script type="application/ld\+json">\s*{[\s\S]*?}\s*</script>)', content)
schema = schema_match.group(1) if schema_match else ""

# Extract all OpenGraph and Twitter meta tags
meta_tags = re.findall(r'<meta (?:property|name)="(?:og:|twitter:|article:)[^"]*" content="[^"]*">', content)
meta_str = '\n'.join(meta_tags)

# Extract body content (everything inside <body>...</body>)
body_match = re.search(r'<body>\s*(.*?)\s*</body>', content, re.DOTALL | re.IGNORECASE)
body = body_match.group(1) if body_match else ""

# Remove Nav and Footer from body
body = re.sub(r'<Nav\b[^>]*/>\n?', '', body)
body = re.sub(r'<Footer\b[^>]*/>\n?', '', body)
body = re.sub(r'<footer class="sa-footer">[\s\S]*?</footer>', '', body, flags=re.IGNORECASE)

# Extract styles
style_match = re.search(r'<style is:global>\s*(.*?)\s*</style>', content, re.DOTALL)
styles = style_match.group(1) if style_match else ""

# Rebuild new content
new_content = f"""---
import Base from '../layouts/Base.astro';
import AttributionTracker from '../components/AttributionTracker.astro';
---
<Base 
  title="Free Shopify Automation Stack 2026 — Replace $700/mo of Paid Apps" 
  description="Replace 6 paid Shopify apps with free tools: Meta CAPI tracking, Google Enhanced Conversions, Stocky replacement, Klaviyo alternative, TikTok Events API, live P&L. Verified free tier of Make.com. No code. 6 minutes. $29 Complete Kit optional."
>
  <Fragment slot="head">
    {schema}
    {meta_str}
  </Fragment>

  {body}
</Base>

<style is:global>
{styles}
</style>
"""

with open('src/pages/index.astro', 'w') as f:
    f.write(new_content)
