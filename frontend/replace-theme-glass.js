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
      
      // Keep Layout untouched just in case
      if (fullPath.replace(/\\/g, '/').includes('components/sections/layout/index.tsx')) continue;

      let newContent = content
        .replace(/bg-white\/5/g, 'bg-foreground/5')
        .replace(/bg-white\/10/g, 'bg-foreground/10')
        .replace(/bg-white\/20/g, 'bg-foreground/20')
        .replace(/bg-white\/30/g, 'bg-foreground/30')
        // Also looking at hover states
        .replace(/hover:bg-white\/5/g, 'hover:bg-foreground/5')
        .replace(/hover:bg-white\/10/g, 'hover:bg-foreground/10')
        .replace(/hover:bg-white\/20/g, 'hover:bg-foreground/20');
        
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceInDir('./app');
replaceInDir('./components');
console.log('Done.');
