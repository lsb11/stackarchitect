import json
import os

apps = [
    # Marketing & Email
    {"name": "Omnisend", "category": "Email Marketing", "cost": "$59+", "replacement": "Systeme.io / Brevo", "link": "/replace-klaviyo-free/"},
    {"name": "Mailchimp", "category": "Email Marketing", "cost": "$20+", "replacement": "Systeme.io / Brevo", "link": "/replace-klaviyo-free/"},
    {"name": "Privy", "category": "Email & Popups", "cost": "$30+", "replacement": "Systeme.io / Brevo", "link": "/replace-klaviyo-free/"},
    {"name": "Postscript", "category": "SMS Marketing", "cost": "$100+", "replacement": "Systeme.io / Brevo", "link": "/replace-klaviyo-free/"},
    {"name": "Attentive", "category": "SMS Marketing", "cost": "$300+", "replacement": "Systeme.io / Brevo", "link": "/replace-klaviyo-free/"},
    
    # Tracking & Analytics
    {"name": "Littledata", "category": "Tracking & Analytics", "cost": "$129+", "replacement": "CAPI Shield & GTM Server-Side", "link": "/capi-shield/"},
    {"name": "Northbeam", "category": "Tracking & Analytics", "cost": "$1,000+", "replacement": "CAPI Shield & GTM Server-Side", "link": "/northbeam-alternative/"},
    {"name": "Analyzify", "category": "Tracking & Analytics", "cost": "$749", "replacement": "CAPI Shield & GTM Server-Side", "link": "/analyzify-alternative/"},
    {"name": "Lifetimely", "category": "Tracking & Analytics", "cost": "$34+", "replacement": "Google Analytics 4 + Looker Studio", "link": "/shopify-google-analytics-4-setup-free-2026/"},
    {"name": "Glew.io", "category": "Tracking & Analytics", "cost": "$79+", "replacement": "Google Analytics 4 + Looker Studio", "link": "/shopify-google-analytics-4-setup-free-2026/"},
    
    # Customer Service
    {"name": "Gorgias", "category": "Customer Support", "cost": "$50+", "replacement": "Tidio (Free Plan)", "link": "/tidio-shopify-guide/"},
    {"name": "Zendesk", "category": "Customer Support", "cost": "$55+", "replacement": "Tidio (Free Plan)", "link": "/tidio-shopify-guide/"},
    {"name": "Richpanel", "category": "Customer Support", "cost": "$100+", "replacement": "Tidio (Free Plan)", "link": "/tidio-shopify-guide/"},
    
    # Page Builders
    {"name": "Shogun", "category": "Page Builder", "cost": "$39+", "replacement": "Native Shopify OS 2.0", "link": "/ultimate-shopify-automation-guide/"},
    {"name": "PageFly", "category": "Page Builder", "cost": "$24+", "replacement": "Native Shopify OS 2.0", "link": "/ultimate-shopify-automation-guide/"},
    {"name": "GemPages", "category": "Page Builder", "cost": "$29+", "replacement": "Native Shopify OS 2.0", "link": "/ultimate-shopify-automation-guide/"},
    
    # Reviews
    {"name": "Yotpo", "category": "Product Reviews", "cost": "$15+", "replacement": "Ali Reviews (Free Tier)", "link": "/best-free-shopify-apps-2026/"},
    {"name": "Okendo", "category": "Product Reviews", "cost": "$119+", "replacement": "Ali Reviews (Free Tier)", "link": "/best-free-shopify-apps-2026/"},
    {"name": "Judge.me", "category": "Product Reviews", "cost": "$15", "replacement": "Ali Reviews (Free Tier)", "link": "/best-free-shopify-apps-2026/"},
    {"name": "Stamped.io", "category": "Product Reviews", "cost": "$23+", "replacement": "Ali Reviews (Free Tier)", "link": "/best-free-shopify-apps-2026/"},
    {"name": "Loox", "category": "Product Reviews", "cost": "$9.99+", "replacement": "Ali Reviews (Free Tier)", "link": "/best-free-shopify-apps-2026/"},
    
    # Subscriptions
    {"name": "Recharge", "category": "Subscriptions", "cost": "$99+", "replacement": "Shopify Native Subscriptions", "link": "/the-lean-shopify-tech-stack-2026/"},
    {"name": "Skio", "category": "Subscriptions", "cost": "$299+", "replacement": "Shopify Native Subscriptions", "link": "/the-lean-shopify-tech-stack-2026/"},
    {"name": "Bold Subscriptions", "category": "Subscriptions", "cost": "$49.99+", "replacement": "Shopify Native Subscriptions", "link": "/the-lean-shopify-tech-stack-2026/"},
    {"name": "Seal Subscriptions", "category": "Subscriptions", "cost": "$15+", "replacement": "Shopify Native Subscriptions", "link": "/the-lean-shopify-tech-stack-2026/"},
    
    # Automation
    {"name": "Zapier", "category": "Automation", "cost": "$19+", "replacement": "Make.com (Free Tier)", "link": "/make-vs-zapier-cost-calculator/"},
    {"name": "Alloy Automation", "category": "Automation", "cost": "$599+", "replacement": "Shopify Flow", "link": "/shopify-flow-vs-make/"},
    {"name": "Mesa", "category": "Automation", "cost": "$29+", "replacement": "Shopify Flow", "link": "/shopify-flow-vs-make/"},
    {"name": "Mechanic", "category": "Automation", "cost": "$20+", "replacement": "Shopify Flow", "link": "/shopify-flow-vs-make/"},
    {"name": "Celigo", "category": "Automation & Integration", "cost": "$600+", "replacement": "Make.com (Free Tier)", "link": "/make-com-shopify/"},
    
    # Inventory
    {"name": "Skubana", "category": "Inventory Management", "cost": "$1,000+", "replacement": "Stocky Swap & Google Sheets", "link": "/stocky-swap/"},
    {"name": "Linnworks", "category": "Inventory Management", "cost": "$800+", "replacement": "Stocky Swap & Google Sheets", "link": "/stocky-swap/"},
    {"name": "Veeqo", "category": "Inventory Management", "cost": "Free", "replacement": "Stocky Swap & Google Sheets", "link": "/stocky-swap/"},
    {"name": "Katana", "category": "Manufacturing & Inventory", "cost": "$179+", "replacement": "Stocky Swap & Google Sheets", "link": "/stocky-swap/"},
    {"name": "Prediko", "category": "Inventory Forecasting", "cost": "$149+", "replacement": "Google Sheets + Shopify Flow", "link": "/shopify-google-sheets-automation/"},
    {"name": "Qoblex", "category": "Inventory Management", "cost": "$59+", "replacement": "Stocky Swap", "link": "/stocky-swap/"},
    
    # Affiliates & Referrals
    {"name": "Refersion", "category": "Affiliate Marketing", "cost": "$99+", "replacement": "Shopify Collabs (Free)", "link": "/the-lean-shopify-tech-stack-2026/"},
    {"name": "UpPromote", "category": "Affiliate Marketing", "cost": "$29+", "replacement": "Shopify Collabs (Free)", "link": "/the-lean-shopify-tech-stack-2026/"},
    {"name": "ReferralCandy", "category": "Referral Program", "cost": "$59+", "replacement": "Shopify Collabs (Free)", "link": "/the-lean-shopify-tech-stack-2026/"},
    
    # SEO
    {"name": "Booster SEO", "category": "SEO Optimization", "cost": "$39+", "replacement": "Native OS 2.0 SEO", "link": "/ultimate-shopify-automation-guide/"},
    {"name": "Avada SEO", "category": "SEO Optimization", "cost": "$34+", "replacement": "Native OS 2.0 SEO", "link": "/ultimate-shopify-automation-guide/"},
    {"name": "Plug in SEO", "category": "SEO Optimization", "cost": "$29.99+", "replacement": "Native OS 2.0 SEO", "link": "/ultimate-shopify-automation-guide/"},
    
    # Returns
    {"name": "Loop Returns", "category": "Returns Management", "cost": "$165+", "replacement": "Native Shopify Returns", "link": "/the-lean-shopify-tech-stack-2026/"},
    {"name": "Returnly", "category": "Returns Management", "cost": "$149+", "replacement": "Native Shopify Returns", "link": "/the-lean-shopify-tech-stack-2026/"},
    {"name": "AfterShip Returns", "category": "Returns Management", "cost": "$23+", "replacement": "Native Shopify Returns", "link": "/the-lean-shopify-tech-stack-2026/"},
    
    # Search & Discovery
    {"name": "Searchanise", "category": "Site Search", "cost": "$19+", "replacement": "Shopify Search & Discovery App", "link": "/the-lean-shopify-tech-stack-2026/"},
    {"name": "Boost Commerce", "category": "Site Search", "cost": "$29+", "replacement": "Shopify Search & Discovery App", "link": "/the-lean-shopify-tech-stack-2026/"},
    {"name": "Fast Simon", "category": "Site Search", "cost": "$39+", "replacement": "Shopify Search & Discovery App", "link": "/the-lean-shopify-tech-stack-2026/"}
]

def generate_savings(cost_str):
    if cost_str.startswith("$"):
        try:
            val = int(cost_str.replace("$", "").replace("+", "").replace(",", ""))
            return f"${val * 12:,}/yr"
        except Exception:
            return "100% of subscription cost"
    return "100% of subscription cost"

output_data = []

# Load existing apps.json to preserve the original 5
existing_path = "src/data/apps.json"
if os.path.exists(existing_path):
    with open(existing_path, "r") as f:
        output_data = json.load(f)

existing_ids = set(app["id"] for app in output_data)

for app in apps:
    app_id = app["name"].lower().replace(" ", "-").replace(".", "")
    if app_id in existing_ids:
        continue
    
    savings = generate_savings(app["cost"])
    
    obj = {
        "id": app_id,
        "name": app["name"],
        "category": app["category"],
        "monthlyCost": app["cost"],
        "replacement": app["replacement"],
        "savings": savings,
        "description": f"{app['name']} is a premium {app['category']} app for Shopify.",
        "stackarchitectAlternativeLink": app["link"]
    }
    output_data.append(obj)

with open(existing_path, "w") as f:
    json.dump(output_data, f, indent=2)

print(f"Generated {len(output_data)} apps in {existing_path}")
