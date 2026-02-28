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
      
      // Keep Layout component explicitly untouched by this script
      if (fullPath.replace(/\\/g, '/').includes('components/sections/layout/index.tsx')) continue;

      let newContent = content
        .replace(/bg-\[#0A0A0F\]/gi, 'bg-background')
        .replace(/bg-\[#111118\]/gi, 'bg-card')
        .replace(/text-white/g, 'text-foreground')
        .replace(/text-slate-100/g, 'text-foreground')
        .replace(/text-slate-400/g, 'text-muted-foreground')
        .replace(/border-white\/10/g, 'border-border')
        .replace(/border-white\/20/g, 'border-border')
        .replace(/border-white\/5/g, 'border-border');
        
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
