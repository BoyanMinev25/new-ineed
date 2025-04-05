/**
 * Script to fix all import paths in compiled JavaScript files
 * Run this with Node.js after building the module
 */
const fs = require('fs');
const path = require('path');

// Directories to search for JS files
const directoriesToFix = [
  path.join(__dirname, 'order-payments-module/dist'),
  path.join(__dirname, 'src/local-modules/order-payments-module')
];

// Function to process a file
function processFile(filePath) {
  if (!filePath.endsWith('.js')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix imports that need .js extension
    const importRegex = /from ['"](.+?)['"]/g;
    let match;
    let modified = false;
    
    const newContent = content.replace(importRegex, (match, importPath) => {
      // Skip node_modules, external packages and already fixed paths
      if (
        importPath.startsWith('./') || 
        importPath.startsWith('../')
      ) {
        // Don't add extension if it already has one
        if (!importPath.endsWith('.js') && !importPath.includes('?') && !importPath.includes('#')) {
          modified = true;
          return `from '${importPath}.js'`;
        }
      }
      return match;
    });
    
    if (modified) {
      console.log(`Fixed imports in: ${filePath}`);
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Recursive function to walk directories
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      walkDir(filePath);
    } else {
      processFile(filePath);
    }
  }
}

// Process all specified directories
for (const dir of directoriesToFix) {
  if (fs.existsSync(dir)) {
    console.log(`Processing directory: ${dir}`);
    walkDir(dir);
  } else {
    console.log(`Directory does not exist: ${dir}`);
  }
}

console.log('Finished fixing imports!'); 