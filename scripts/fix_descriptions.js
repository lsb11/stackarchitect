import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src/pages');

function fixDescriptions() {
  const files = fs.readdirSync(pagesDir);
  let count = 0;
  
  for (const file of files) {
    if (!file.endsWith('.astro')) continue;
    
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if Base is called with empty description=""
    if (content.match(/<Base[^>]*description=""/)) {
      // Find the meta description tag in the body, which might be in the headSlot
      const descMatch = content.match(/<meta[^>]*name="description"[^>]*content=['"](.*?)['"]/i);
      if (descMatch && descMatch[1]) {
        const descStr = descMatch[1].replace(/"/g, '&quot;');
        content = content.replace(/(<Base[^>]*description=)""/, `$1"${descStr}"`);
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Fixed description for ${file}`);
        count++;
      }
    }
  }
  console.log(`Fixed ${count} files.`);
}

fixDescriptions();
