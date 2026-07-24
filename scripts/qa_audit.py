import json
import glob

print("=== PROGRAMMATIC HUB QA AUDIT ===")
app_files = glob.glob('dist/apps/*/index.html')
print(f"Total built programmatic apps: {len(app_files)}")

if app_files:
    test_file = app_files[0]
    with open(test_file, 'r') as f:
        content = f.read()
    
    # Check Title
    title = content.split('<title>')[1].split('</title>')[0] if '<title>' in content else "MISSING"
    
    # Check Desc
    desc = "MISSING"
    if 'name="description"' in content:
        desc = content.split('name="description" content="')[1].split('"')[0]
    
    print(f"\n[SEO METADATA - {test_file}]")
    print(f"Title: {title}")
    print(f"Description: {desc}")
    
    # Check Schema
    print(f"FAQPage Schema Present: {'✅ YES' if 'FAQPage' in content else '❌ NO'}")
    
    # Check Semantic HTML
    print(f"H1 Present: {'✅ YES' if '<h1' in content else '❌ NO'}")
    print(f"FactTable Present: {'✅ YES' if 'Fact Sheet' in content and '<table' in content else '❌ NO'}")

print("\n=== PILLAR PAGE QA AUDIT ===")
hub_file = 'dist/shopify-tracking-hub/index.html'
try:
    with open(hub_file, 'r') as f:
        content = f.read()
    print(f"CollectionPage Schema Present: {'✅ YES' if 'CollectionPage' in content else '❌ NO'}")
except FileNotFoundError:
    print(f"❌ {hub_file} not found!")
