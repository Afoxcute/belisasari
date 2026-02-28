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
      
      if (fullPath.replace(/\\/g, '/').includes('components/sections/layout/index.tsx')) continue;

      let newContent = content
        .replace(/text-slate-300/g, 'text-muted-foreground')
        .replace(/text-slate-500/g, 'text-muted-foreground')
        .replace(/text-slate-600/g, 'text-muted-foreground')
        .replace(/text-gray-500/g, 'text-muted-foreground')
        .replace(/bg-white\/\\[0\.02\\]/g, 'bg-foreground/[0.02]')
        .replace(/bg-white\/\\[0\.05\\]/g, 'bg-foreground/[0.05]');
        
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
