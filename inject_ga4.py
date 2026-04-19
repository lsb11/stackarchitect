import os, re

GA4_SNIPPET = """  <!-- GA4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-TE6Z6CW514"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-TE6Z6CW514');
  </script>"""

PAGES = [
    'src/pages/about.astro',
    'src/pages/analyzify-alternative.astro',
    'src/pages/autocrat-quota-fix.astro',
    'src/pages/capi-shield.astro',
    'src/pages/elevar-alternative.astro',
    'src/pages/index.astro',
    'src/pages/klaviyo-vs-systeme-io.astro',
    'src/pages/northbeam-alternative.astro',
    'src/pages/privacy.astro',
    'src/pages/pro.astro',
    'src/pages/replace-klaviyo-free.astro',
    'src/pages/shopify-app-cost-calculator.astro',
    'src/pages/shopify-automation-scanner.astro',
    'src/pages/shopify-profit-loss-automation.astro',
    'src/pages/shopify-scripts-sunset-audit.astro',
    'src/pages/sitemap-page.astro',
    'src/pages/stack.astro',
    'src/pages/stocky-alternative.astro',
    'src/pages/stocky-shutdown.astro',
    'src/pages/stocky-swap.astro',
    'src/pages/terms.astro',
    'src/pages/tiktok-events-api-shopify.astro',
    'src/pages/triple-whale-alternative.astro',
    'src/pages/ultimate-shopify-automation-guide.astro',
]

results = []
for path in PAGES:
    if not os.path.exists(path):
        results.append(f'SKIP (not found): {path}')
        continue
    content = open(path).read()
    if 'G-TE6Z6CW514' in content or 'googletagmanager' in content:
        results.append(f'SKIP (already has GA4): {path}')
        continue
    # Insert before </head>
    if '</head>' in content:
        content = content.replace('</head>', GA4_SNIPPET + '\n</head>', 1)
        open(path, 'w').write(content)
        results.append(f'OK: {path}')
    else:
        results.append(f'NO </head> TAG: {path}')

for r in results:
    print(r)

print(f'\nDone. {sum(1 for r in results if r.startswith("OK"))} pages updated.')
