import json
import glob
import re
import os

# Load apps
with open('src/data/apps.json', 'r') as f:
    apps = json.load(f)

def find_matches(content, app_links):
    content_lower = content.lower()
    matches = []
    
    for app_name, app_data in app_links.items():
        if app_name in content_lower:
            # Check if we already linked to it (simplistic check)
            if app_data['link'] not in content:
                matches.append(app_data)
                
    return matches

def inject_links(file_path, content, matches):
    # Inject links safely at the bottom of the file
    if file_path.endswith('.md'):
        # Just append to MD
        injection = "\n\n## Related App Alternatives\n"
        for match in matches:
            injection += f"- [{match['name']} Pricing & Alternatives]({match['link']})\n"
        
        # Don't add if already there
        if "## Related App Alternatives" not in content:
            with open(file_path, 'a') as f:
                f.write(injection)
            print(f"Injected links into {file_path}")

    elif file_path.endswith('.astro'):
        # Inject before <AuthorCard or <Footer
        injection = "\n<div style=\"max-width:860px;margin:2rem auto;padding:0 24px;\">\n  <h2 style=\"font-size:1.5rem;font-weight:bold;margin-bottom:1rem;color:white;\">Related App Alternatives</h2>\n  <ul style=\"list-style:disc;padding-left:1.5rem;color:#9ca3af;\">\n"
        for match in matches:
            injection += f"    <li><a href=\"{match['link']}\" style=\"color:#34d377;text-decoration:none;hover:underline;\">{match['name']} Pricing & Alternatives</a></li>\n"
        injection += "  </ul>\n</div>\n"
        
        if "Related App Alternatives" not in content:
            if "<AuthorCard" in content:
                content = content.replace("<AuthorCard", injection + "<AuthorCard")
            elif "<Footer" in content:
                content = content.replace("<Footer", injection + "<Footer")
            
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"Injected links into {file_path}")

# Build a mapping of app names to their programmatic hub links
app_links = {}
for app in apps:
    app_links[app['name'].lower()] = {
        'name': app['name'],
        'link': f"/apps/{app['id']}/"
    }

blog_files = glob.glob('src/content/blog/*.md')
standalone_files = glob.glob('src/pages/*.astro')

files_to_check = blog_files + [f for f in standalone_files if os.path.basename(f) not in ['index.astro', '404.astro', 'sitemap.astro', 'sitemap-page.astro']]

for file_path in files_to_check:
    with open(file_path, 'r') as f:
        content = f.read()

    matches = find_matches(content, app_links)

    if not matches:
        continue

    inject_links(file_path, content, matches)
