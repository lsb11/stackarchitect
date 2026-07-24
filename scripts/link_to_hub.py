import os

files = [
    "src/content/blog/shopify-google-analytics-4-setup-free-2026.md",
    "src/content/blog/how-to-fix-shopify-conversion-tracking-after-ios-updates.md",
    "src/content/blog/recover-lost-shopify-conversions-capi-shield.md",
    "src/content/blog/how-to-fix-shopify-google-ads-conversion-tracking-2026.md"
]

astro_file = "src/pages/blog/shopify-server-side-tracking-complete-setup-guide.astro"

injection = "\n> [!NOTE]\n> **Deep Dive:** This article is part of our comprehensive tracking series. For the full masterclass on CAPI, GA4, and Server-Side tracking, see [The Ultimate Shopify Tracking Hub](/shopify-tracking-hub/).\n"

astro_injection = "\n<div style=\"max-width:860px;margin:2rem auto;padding:16px 24px;background:rgba(52,211,119,0.1);border-left:4px solid #34d377;\"><p style=\"color:white;margin:0;\"><strong>Deep Dive:</strong> This article is part of our comprehensive tracking series. For the full masterclass on CAPI, GA4, and Server-Side tracking, see <a href=\"/shopify-tracking-hub/\" style=\"color:#34d377;text-decoration:underline;\">The Ultimate Shopify Tracking Hub</a>.</p></div>\n"

for fpath in files:
    if not os.path.exists(fpath):
        continue
    with open(fpath, "r") as f:
        content = f.read()
    if "The Ultimate Shopify Tracking Hub" in content:
        continue
    parts = content.split("---", 2)
    if len(parts) >= 3:
        new_content = parts[0] + "---" + parts[1] + "---" + injection + parts[2]
        with open(fpath, "w") as f:
            f.write(new_content)
        print(f"Injected Hub link into {fpath}")

if os.path.exists(astro_file):
    with open(astro_file, "r") as f:
        content = f.read()
    if "The Ultimate Shopify Tracking Hub" not in content:
        if "<article" in content:
            content = content.replace("<article", astro_injection + "<article")
            with open(astro_file, "w") as f:
                f.write(content)
            print(f"Injected Hub link into {astro_file}")
