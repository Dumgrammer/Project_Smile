const fs = require('fs');
const path = require('path');

// Copy PWA files to the build output
const sourceDir = path.join(__dirname, 'public');
const buildDir = path.join(__dirname, '.next');

// Files to copy
const pwaFiles = ['manifest.json', 'sw.js', 'Mafdc.jpg'];

console.log('Copying PWA files to build directory...');

pwaFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(buildDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${file}`);
  } else {
    console.log(`✗ File not found: ${file}`);
  }
});

// Also copy to static directory for Next.js to serve them
const staticDir = path.join(buildDir, 'static');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

pwaFiles.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(staticDir, file);
  
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied ${file} to static directory`);
  }
});

console.log('PWA files copied successfully!');
