const fs = require('fs');
const path = require('path');

const appsFilePath = path.join(__dirname, '../src/data/apps.json');
const apps = JSON.parse(fs.readFileSync(appsFilePath, 'utf8'));

// Helper to generate a unique technical verdict
function generateVerdict(app) {
  const cat = app.category.toLowerCase();
  if (cat.includes('tracking') || cat.includes('analytics')) {
    return `Unlike ${app.name}, which relies heavily on browser-side scripts and pixels that are easily blocked by iOS and ad-blockers, ${app.replacement} utilizes a pure server-to-server architecture. This guarantees up to 20-40% higher data accuracy by completely bypassing browser limitations.`;
  } else if (cat.includes('email') || cat.includes('sms')) {
    return `While ${app.name} penalizes your growth by exponentially increasing your monthly bill as your subscriber list expands, ${app.replacement} allows you to scale indefinitely with flat-rate or significantly cheaper volume pricing, saving massive margin at scale.`;
  } else if (cat.includes('inventory')) {
    return `The core issue with ${app.name} is that you are paying a hefty premium for enterprise UX. ${app.replacement} relies on a headless automation flow that syncs your raw inventory data directly to a Google Sheet, offering infinite customizability without the monthly subscription overhead.`;
  } else if (cat.includes('support')) {
    return `${app.name} charges per agent or per ticket, meaning high support volume during BFCM destroys profitability. ${app.replacement} centralizes your Shopify customer data without artificial paywalls on your support volume.`;
  } else {
    return `${app.name} is a monolithic application that locks your data inside its proprietary ecosystem. By switching to ${app.replacement}, you regain 100% ownership of your store's infrastructure while drastically reducing your monthly operational expenses.`;
  }
}

// Helper to generate a unique migration path
function generateMigrationPath(app) {
  return [
    `Step 1: Export all historical data (CSV/JSON) directly from the ${app.name} admin dashboard before canceling your subscription to prevent data loss.`,
    `Step 2: Install and configure ${app.replacement}, using our free blueprint to map your existing data structures to the new system.`,
    `Step 3: Run both systems in parallel for a 7-day testing phase to verify data parity, then officially uninstall ${app.name} from your Shopify store.`
  ];
}

const enrichedApps = apps.map(app => {
  return {
    ...app,
    technicalVerdict: app.technicalVerdict || generateVerdict(app),
    uniqueMigrationPath: app.uniqueMigrationPath || generateMigrationPath(app)
  };
});

fs.writeFileSync(appsFilePath, JSON.stringify(enrichedApps, null, 2), 'utf8');
console.log(`Successfully enriched ${enrichedApps.length} apps with unique technical verdicts and migration paths.`);
