import os
import glob
import re

astro_files = glob.glob('src/pages/*.astro')
for fpath in astro_files:
    if os.path.basename(fpath) in ['index.astro', '404.astro', 'sitemap.astro', 'sitemap-page.astro']:
        continue
    
    with open(fpath, 'r') as f:
        content = f.read()
    
    if '<TableOfContents' in content:
        continue
    
    if '<main' not in content:
        continue

    # Add import if missing
    if 'import TableOfContents' not in content:
        content = re.sub(r"(---.*?)\n(---)", r"\1\nimport TableOfContents from '../components/TableOfContents.astro';\n\2", content, count=1, flags=re.DOTALL)
    
    # We want to insert <TableOfContents /> after the first </h1> or <p class="subtitle"...>
    # Finding the end of the subtitle or h1
    h1_match = re.search(r'</h1>', content)
    subtitle_match = re.search(r'</p>', content[h1_match.end():] if h1_match else "")
    
    insert_pos = -1
    if h1_match:
        if subtitle_match and 'class="subtitle"' in content[h1_match.end():h1_match.end()+subtitle_match.end()]:
            insert_pos = h1_match.end() + subtitle_match.end()
        else:
            insert_pos = h1_match.end()
            
    if insert_pos != -1:
        content = content[:insert_pos] + "\n\n  <TableOfContents />\n" + content[insert_pos:]
        
    with open(fpath, 'w') as f:
        f.write(content)
    print(f"Updated {fpath}")
