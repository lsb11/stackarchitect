const fs = require('fs');
const path = require('path');

const pagesDir = path.join(process.cwd(), 'src/pages');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('import Base from')) return;

  console.log('Migrating: ' + path.basename(filePath));

  // Extract frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return;
  let fm = fmMatch[1];
  
  if (!fm.includes("import Base from")) {
    fm = `import Base from '../layouts/Base.astro';\n` + fm;
  }

  let bodyContent = content.substring(fmMatch[0].length);

  // Extract Title and Description
  let titleMatch = bodyContent.match(/<title>(.*?)<\/title>/i) || fm.match(/const title\s*=\s*['"`](.*?)['"`]/i);
  let descMatch = bodyContent.match(/<meta[^>]*name="description"[^>]*content=['"](.*?)['"]/i) || fm.match(/const description\s*=\s*['"`](.*?)['"`]/i);
  
  const titleStr = titleMatch ? titleMatch[1].replace(/\{.*?\.title\}/, 'Stack Architect') : 'Stack Architect';
  const descStr = descMatch ? descMatch[1].replace(/\{.*?\.description\}/, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : '';

  // Extract all JSON-LD schemas
  let schemas = [];
  let currentIdx = 0;
  while ((currentIdx = bodyContent.indexOf('<script type="application/ld+json"', currentIdx)) !== -1) {
    let endIdx = bodyContent.indexOf('</script>', currentIdx);
    if (endIdx !== -1) {
      schemas.push(bodyContent.substring(currentIdx, endIdx + 9));
      currentIdx = endIdx + 9;
    } else {
      break;
    }
  }

  // Remove JSON-LD from body
  for (const s of schemas) {
    bodyContent = bodyContent.replace(s, '');
  }

  // Extract all styles
  let styles = [];
  currentIdx = 0;
  while ((currentIdx = bodyContent.indexOf('<style', currentIdx)) !== -1) {
    let endIdx = bodyContent.indexOf('</style>', currentIdx);
    if (endIdx !== -1) {
      styles.push(bodyContent.substring(currentIdx, endIdx + 8));
      currentIdx = endIdx + 8;
    } else {
      break;
    }
  }

  // Remove styles from body
  for (const s of styles) {
    bodyContent = bodyContent.replace(s, '');
  }

  // Strip HTML skeleton and head
  let bodyMatch = bodyContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyContent = bodyMatch[1];
  } else {
    bodyContent = bodyContent.replace(/<!DOCTYPE html>[\s\S]*?<head>[\s\S]*?<\/head>/i, '');
    bodyContent = bodyContent.replace(/<\/html>/i, '');
  }

  // Remove hardcoded Nav and Footer
  bodyContent = bodyContent.replace(/<Nav\s*\/?>/gi, '');
  bodyContent = bodyContent.replace(/<Footer\s*\/?>/gi, '');

  let baseTitle = titleStr.includes('{') ? `title={title}` : `title="${titleStr}"`;
  let baseDesc = descStr.includes('{') ? `description={description}` : `description="${descStr.replace(/"/g, '&quot;')}"`;
  
  const schemaProp = fm.includes('const allSchemas') ? ` schema={allSchemas}` : ``;
  
  let headSlot = schemas.length > 0 ? `<Fragment slot="head">\n${schemas.join('\n')}\n</Fragment>\n` : '';

  let newContent = `---
${fm}
---
<Base ${baseTitle} ${baseDesc}${schemaProp}>
${headSlot}${bodyContent.trim()}
</Base>
${styles.length > 0 ? '\n' + styles.join('\n') : ''}
`;

  fs.writeFileSync(filePath, newContent);
}

function run(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      run(fullPath);
    } else if (fullPath.endsWith('.astro')) {
      processFile(fullPath);
    }
  }
}

run(pagesDir);
console.log('Migration complete.');
