import re, os

# Page configs: file, import path, ctaText, ctaHref, ctaBtnText
pages = [
    {
        'file': 'src/pages/capi-shield.astro',
        'import': "import Footer from '../components/Footer.astro';",
        'ctaText': "Your ads are optimising on incomplete data. Deploy CAPI Shield and fix it — <strong>free</strong>.",
        'ctaHref': '/capi-shield',
        'ctaBtn': 'Deploy CAPI Shield Free →',
    },
    {
        'file': 'src/pages/triple-whale-alternative.astro',
        'import': "import Footer from '../components/Footer.astro';",
        'ctaText': "Still paying Triple Whale $299/mo? Replace it in 6 minutes — <strong>free forever</strong>.",
        'ctaHref': '/capi-shield',
        'ctaBtn': 'Deploy CAPI Shield Free →',
    },
    {
        'file': 'src/pages/stocky-swap.astro',
        'import': "import Footer from '../components/Footer.astro';",
        'ctaText': "Stocky shuts down August 31. Replace it free in under 5 minutes.",
        'ctaHref': '/stocky-swap',
        'ctaBtn': 'Deploy Stocky Swap Free →',
    },
    {
        'file': 'src/pages/replace-klaviyo-free.astro',
        'import': "import Footer from '../components/Footer.astro';",
        'ctaText': "Still paying Klaviyo every month? Replace it free with Systeme.io — <strong>takes 30 minutes</strong>.",
        'ctaHref': '/replace-klaviyo-free',
        'ctaBtn': 'Replace Klaviyo Free →',
    },
    {
        'file': 'src/pages/pro.astro',
        'import': "import Footer from '../components/Footer.astro';",
        'ctaText': "Everything pre-built. Four Make.com scenarios, two Sheets templates — live in <strong>10 minutes</strong>.",
        'ctaHref': 'https://buy.stripe.com/00wfZa7w1a3Bfo55tnfrW00',
        'ctaBtn': 'Get the Complete Kit — $29 →',
    },
    {
        'file': 'src/pages/index.astro',
        'import': "import Footer from '../components/Footer.astro';",
        'ctaText': "Still paying for Shopify apps? Replace all six in under 10 minutes — <strong>free forever</strong>. Or get the pre-built kit for <strong>$29</strong>.",
        'ctaHref': '/pro',
        'ctaBtn': 'Get the Kit — $29 →',
    },
]

# Pattern to match the inline footer block
# Matches from the footer comment or <footer class="architect-footer" to </footer>
FOOTER_PATTERNS = [
    # With preceding comment block
    r'<!-- ═+\s*FOOTER\s*═+ -->\s*<footer class="architect-footer".*?</footer>',
    # Without comment
    r'<footer class="architect-footer".*?</footer>',
]

# CSS patterns to remove from <style> blocks
CSS_FOOTER_CLASSES = [
    r'\/\* Footer \*\/\s*',
    r'\.architect-footer\{[^}]+\}\s*',
    r'\.architect-footer::before\{[^}]+\}\s*',
    r'\.footer-container\{[^}]+\}\s*',
    r'\.footer-conversion-strip\{[^}]+\}\s*',
    r'\.footer-conversion-text\{[^}]+\}\s*',
    r'\.footer-conversion-text span\{[^}]+\}\s*',
    r'\.footer-conversion-cta\{[^}]+\}\s*',
    r'\.footer-conversion-cta:hover\{[^}]+\}\s*',
    r'\.footer-system-title\{[^}]+\}\s*',
    r'\.footer-links\{[^}]+\}\s*',
    r'\.footer-links a\{[^}]+\}\s*',
    r'\.footer-links a:hover\{[^}]+\}\s*',
    r'\.footer-trust-row\{[^}]+\}\s*',
    r'\.trust-badge\{[^}]+\}\s*',
    r'\.trust-badge-dot\{[^}]+\}\s*',
    r'\.footer-divider\{[^}]+\}\s*',
    r'\.return-origin\{[^}]+\}\s*',
    r'\.return-origin:hover\{[^}]+\}\s*',
    r'\.affiliate-disclosure\{[^}]+\}\s*',
    r'\.copyright\{[^}]+\}\s*',
    r'\.nav-secondary\{[^}]+\}\s*',
    r'\.nav-secondary a\{[^}]+\}\s*',
    r'\.nav-secondary a:hover\{[^}]+\}\s*',
    r'\.status-bar\{[^}]+\}\s*',
    r'\.status-item\{[^}]+\}\s*',
    r'\.bar-sep\{[^}]+\}\s*',
    r'\.pulse-dot\{[^}]+\}\s*',
    r'\.engine-link\{[^}]+\}\s*',
]

results = []

for page in pages:
    path = page['file']
    if not os.path.exists(path):
        results.append(f"SKIP (not found): {path}")
        continue
    
    content = open(path).read()
    original_len = len(content)
    
    # 1. Add import to frontmatter if not already there
    imp = page['import']
    if imp not in content:
        # Insert after the opening ---
        content = content.replace('---\n', f'---\n{imp}\n', 1)
    
    # 2. Build the Footer component tag
    footer_tag = f'''<Footer
  ctaText="{page['ctaText']}"
  ctaHref="{page['ctaHref']}"
  ctaBtnText="{page['ctaBtn']}"
/>'''
    
    # 3. Replace inline footer with component
    replaced = False
    for pattern in FOOTER_PATTERNS:
        new_content, n = re.subn(pattern, footer_tag, content, flags=re.DOTALL)
        if n > 0:
            content = new_content
            replaced = True
            break
    
    # 4. Save
    open(path, 'w').write(content)
    status = "OK - footer replaced" if replaced else "OK - import added (footer pattern not matched)"
    results.append(f"{status}: {path}")

for r in results:
    print(r)
