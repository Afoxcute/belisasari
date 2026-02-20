#!/usr/bin/env node

/**
 * Test script to verify Iris startup configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Iris Platform Configuration...\n');

// Check if we're in the right directory
const requiredDirs = ['frontend', 'elizaos-agents', 'js-scraper'];
const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));

if (missingDirs.length > 0) {
  console.log('❌ Missing required directories:', missingDirs.join(', '));
  console.log('   Please run this from the root directory of the Iris project');
  process.exit(1);
}

console.log('✅ All required directories found');

// Check package.json files
const packageFiles = [
  'package.json',
  'frontend/package.json',
  'elizaos-agents/package.json',
  'js-scraper/package.json'
];

packageFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} found`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Check startup script
if (fs.existsSync('start-iris.js')) {
  console.log('✅ start-iris.js found');
} else {
  console.log('❌ start-iris.js missing');
}

// Check environment files
const envFiles = [
  'elizaos-agents/env.example',
  'frontend/.env.local'
];

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} found`);
  } else {
    console.log(`⚠️  ${file} not found (optional)`);
  }
});

console.log('\n🎯 Configuration test complete!');
console.log('\nTo start Iris Platform, run:');
console.log('  npm run iris');
console.log('  or');
console.log('  node start-iris.js');

