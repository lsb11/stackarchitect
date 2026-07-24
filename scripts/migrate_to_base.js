import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages');

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('import Base from') || !content.toLowerCase().includes('<!doctype html>')) {
    return;
  }
  
  console.log(`Migrating ${path.basename(filePath)}...`);
  
  // Extract Frontmatter block
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.error(`No frontmatter found in ${path.basename(filePath)}`);
    return;
  }
  
  let frontmatter = frontmatterMatch[1];
  
  // Ensure Base is imported in frontmatter
  if (!frontmatter.includes("import Base from")) {
    frontmatter = `import Base from '../layouts/Base.astro';\n` + frontmatter;
  }
  
  // Extract SEO title/desc from frontmatter or HTML
  let titleMatch = content.match(/title:\s*['"`](.*?)['"`]/) || content.match(/<title>(.*?)<\/title>/i) || frontmatter.match(/const\s+title\s*=\s*['"`](.*?)['"`]/i);
  let descMatch = content.match(/description:\s*['"`]([\s\S]*?)['"`]/) || content.match(/<meta[^>]*name="description"[^>]*content=['"](.*?)['"]/i) || frontmatter.match(/const\s+description\s*=\s*['"`](.*?)['"`]/i);
  
  const titleStr = titleMatch ? titleMatch[1].replace(/\{.*?\.title\}/, 'Stack Architect') : 'Stack Architect';
  const descStr = descMatch ? descMatch[1].replace(/\{.*?\.description\}/, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : '';
  
  let bodyContent = content.substring(content.indexOf('---', 3) + 3);
  
  // EXTRACT SCHEMAS SAFELY
  let customSchemas = '';
  let startIdx = 0;
  while ((startIdx = bodyContent.indexOf('<script type="application/ld+json"')) !== -1) {
    let tagCloseIdx = bodyContent.indexOf('>', startIdx);
    if (bodyContent[tagCloseIdx - 1] === '/') {
      // Self-closing
      let fullTag = bodyContent.substring(startIdx, tagCloseIdx + 1);
      customSchemas += fullTag + '\n';
      bodyContent = bodyContent.substring(0, startIdx) + bodyContent.substring(tagCloseIdx + 1);
    } else {
      let endTagIdx = bodyContent.indexOf('</script>', tagCloseIdx);
      if (endTagIdx !== -1) {
        let fullTag = bodyContent.substring(startIdx, endTagIdx + 9);
        customSchemas += fullTag + '\n';
        bodyContent = bodyContent.substring(0, startIdx) + bodyContent.substring(endTagIdx + 9);
      } else {
        break; // Should never happen
      }
    }
  }

  // EXTRACT STYLES SAFELY
  let customStyles = '';
  startIdx = 0;
  while ((startIdx = bodyContent.toLowerCase().indexOf('<style')) !== -1) {
    let endTagIdx = bodyContent.toLowerCase().indexOf('</style>', startIdx);
    if (endTagIdx !== -1) {
      let fullTag = bodyContent.substring(startIdx, endTagIdx + 8);
      customStyles += fullTag + '\n';
      bodyContent = bodyContent.substring(0, startIdx) + bodyContent.substring(endTagIdx + 8);
    } else {
      break;
    }
  }
  
  // Remove HTML shell
  let matchHead = bodyContent.match(/<!doctype html>[\s\S]*?<body[^>]*>/i);
  if (matchHead) {
    bodyContent = bodyContent.substring(0, matchHead.index) + bodyContent.substring(matchHead.index + matchHead[0].length);
  } else {
    bodyContent = bodyContent.replace(/<head>[\s\S]*?<\/head>/i, '');
    bodyContent = bodyContent.replace(/<body[^>]*>/i, '');
  }
  
  // Remove closing tags
  bodyContent = bodyContent.replace(/<\/body>[\s\S]*?<\/html>/i, '');
  
  // IMPORTANT: Remove Nav and Footer because Base.astro renders them by default!
  bodyContent = bodyContent.replace(/<Nav\s*\/>/gi, '');
  bodyContent = bodyContent.replace(/<Footer\s*\/>/gi, '');
  
  // Clean up any remaining <head> fragments
  bodyContent = bodyContent.replace(/<head>[\s\S]*?<\/head>/i, '');
  
  let baseTitle = content.includes('{title}') || frontmatter.includes('const title') ? `title={title}` : `title="${titleStr}"`;
  let baseDesc = content.includes('{description}') || frontmatter.includes('const description') ? `description={description}` : `description="${descStr.replace(/"/g, '&quot;')}"`;
  
  const schemaProp = frontmatter.includes('const allSchemas') ? ` schema={allSchemas}` : ``;
  
  const headSlot = (customSchemas || customStyles) ? `<Fragment slot="head">\n${customSchemas}${customStyles}</Fragment>\n` : '';
  
  const newContent = `---
${frontmatter}
---
<Base ${baseTitle} ${baseDesc}${schemaProp}>
${headSlot}
${bodyContent.trim()}
</Base>
`;
  
  fs.writeFileSync(filePath, newContent, 'utf-8');
}

function run() {
  const files = fs.readdirSync(pagesDir);
  for (const file of files) {
    if (file.endsWith('.astro')) {
      migrateFile(path.join(pagesDir, file));
    }
  }
}

run();
