const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, '../src/pages');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.astro')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  const originalContent = content;
  content = content.replace(/<Nav\s*\/?>/gi, '');
  content = content.replace(/<Footer\s*\/?>/gi, '');

  const fragmentRegex = /<Fragment\s+slot="head">([\s\S]*?)<\/Fragment>/i;
  const match = content.match(fragmentRegex);
  
  if (match) {
    let fragmentContent = match[1];
    
    // Remove HTML comments from the fragment content before matching styles
    // so we don't accidentally match `<style>` written inside a comment.
    const commentRegex = /<!--[\s\S]*?-->/g;
    let strippedFragmentContent = fragmentContent.replace(commentRegex, '');
    
    const styleRegex = /<style[^>]*>[\s\S]*?<\/style>/gi;
    let styleMatch;
    let extractedStyles = [];
    
    while ((styleMatch = styleRegex.exec(strippedFragmentContent)) !== null) {
      extractedStyles.push(styleMatch[0]);
    }
    
    if (extractedStyles.length > 0) {
      // Remove the exact styles we found from the ORIGINAL fragmentContent (not the stripped one)
      // to preserve other comments if any, or we can just remove them from the stripped one.
      // Let's just remove the matched style blocks from the original fragmentContent.
      let newFragmentContent = fragmentContent;
      for (const styleBlock of extractedStyles) {
        newFragmentContent = newFragmentContent.replace(styleBlock, '');
      }
      
      const newFragment = `<Fragment slot="head">${newFragmentContent}</Fragment>`;
      content = content.replace(fragmentRegex, newFragment);
      content += '\n' + extractedStyles.join('\n') + '\n';
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed:', filePath.replace(PAGES_DIR, ''));
  }
}

processDirectory(PAGES_DIR);
console.log('Done.');
