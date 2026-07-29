const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'frontend-legacy', 'src');
const dest = path.join(__dirname, 'backend', 'src', 'main', 'resources', 'static', 'legacy');

function copy(srcFile, destFile) {
    const dir = path.dirname(destFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(srcFile, destFile);
}

copy(path.join(src, 'index.html'), path.join(dest, 'index.html'));
copy(path.join(src, 'styles', 'legacy.css'), path.join(dest, 'styles', 'legacy.css'));
copy(path.join(src, 'scripts', 'legacy.js'), path.join(dest, 'scripts', 'legacy.js'));

console.log('[OK] Legacy files copied to ' + dest);
