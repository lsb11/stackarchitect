import os
import glob
import re

astro_files = glob.glob('src/pages/*.astro')
for fpath in astro_files:
    if os.path.basename(fpath) in ['index.astro', '404.astro', 'sitemap.astro', 'sitemap-page.astro']:
        continue
    
    with open(fpath, 'r') as f:
        content = f.read()
    
    if '<AuthorCard' in content:
        continue
    
    if 'import Footer' not in content:
        continue

    # Try to add import if missing
    if 'import AuthorCard' not in content:
        content = re.sub(r"(import Footer.*?\n)", r"import AuthorCard from '../components/AuthorCard.astro';\n\1", content, count=1)
    
    # Check for hardcoded E-E-A-T box
    hardcoded_box = r"<!-- Author E-E-A-T Box -->.*?</div>\s*</div>"
    if re.search(hardcoded_box, content, re.DOTALL):
        content = re.sub(hardcoded_box, "<div style=\"max-width:860px;margin:0 auto;padding:0 24px;\">\n    <AuthorCard />\n  </div>", content, flags=re.DOTALL)
    else:
        # Just inject before Footer
        content = content.replace("<Footer", "<div style=\"max-width:860px;margin:0 auto;padding:0 24px;margin-bottom:60px;\">\n    <AuthorCard />\n  </div>\n<Footer")

    with open(fpath, 'w') as f:
        f.write(content)
    print(f"Updated {fpath}")
