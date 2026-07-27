const fs = require('fs');
const { google } = require('googleapis');
const xml2js = require('xml2js');
const path = require('path');

// NOTE: You must provide a valid service_account.json key to authenticate with the Google Indexing API
const SERVICE_ACCOUNT_FILE = path.join(__dirname, 'service_account.json');
const SITEMAP_FILE = path.join(__dirname, '../dist/sitemap-0.xml');

async function getJwtClient() {
  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.error(`Error: Service account file not found at ${SERVICE_ACCOUNT_FILE}`);
    console.error('Please download your Google Cloud service account JSON key and place it in the scripts/ directory.');
    process.exit(1);
  }

  const key = require(SERVICE_ACCOUNT_FILE);
  const jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/indexing'],
    null
  );

  return new Promise((resolve, reject) => {
    jwtClient.authorize((err, tokens) => {
      if (err) {
        console.error('Auth Error:', err);
        return reject(err);
      }
      resolve(jwtClient);
    });
  });
}

async function forceIndexUrls(jwtClient, urls) {
  const indexing = google.indexing({ version: 'v3', auth: jwtClient });
  
  for (const url of urls) {
    try {
      const res = await indexing.urlNotifications.publish({
        requestBody: {
          url: url,
          type: 'URL_UPDATED'
        }
      });
      console.log(`Successfully requested indexing for: ${url}`);
    } catch (err) {
      console.error(`Failed to request indexing for ${url}:`, err.message);
    }
  }
}

async function main() {
  if (!fs.existsSync(SITEMAP_FILE)) {
    console.error(`Error: Sitemap not found at ${SITEMAP_FILE}. Ensure you have run 'npm run build' first.`);
    process.exit(1);
  }

  const sitemapXml = fs.readFileSync(SITEMAP_FILE, 'utf8');
  const parser = new xml2js.Parser();
  
  parser.parseString(sitemapXml, async (err, result) => {
    if (err) {
      console.error('Error parsing sitemap XML:', err);
      return;
    }

    const urls = result.urlset.url.map(u => u.loc[0]);
    console.log(`Found ${urls.length} URLs in sitemap.`);
    
    // Filter for the new programmatic pages and the hub
    const targetUrls = urls.filter(url => 
      url.includes('/apps/') || 
      url.includes('/stocky-migration-hub/') ||
      url.includes('/stocky-shutdown/')
    );

    console.log(`Targeting ${targetUrls.length} critical pages for instant indexing.`);

    if (targetUrls.length > 0) {
      const jwtClient = await getJwtClient();
      await forceIndexUrls(jwtClient, targetUrls);
    } else {
      console.log('No matching critical URLs found.');
    }
  });
}

main();
