const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let newContent = content
        .replace(/\bbg-background\b/g, 'bg-background-main')
        .replace(/\bbg-card\b/g, 'bg-card-bg')
        .replace(/\btext-foreground\b/g, 'text-text-main')
        .replace(/\btext-muted-foreground\b/g, 'text-text-secondary')
        .replace(/\bborder-border\b/g, 'border-border-light')
        .replace(/\btext-\[\#00D4FF\]\b/g, 'text-primary')
        .replace(/\bbg-\[\#00D4FF\]\b/g, 'bg-primary')
        .replace(/\btext-iris-primary\b/g, 'text-text-main')
        .replace(/\bbg-iris-primary\b/g, 'bg-primary');
        
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceInDir('./app');
replaceInDir('./components');
console.log('Class mapping complete.');
