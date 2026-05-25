const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve(__dirname, '../node_modules/whatsapp-rust-bridge/package.json');

if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let changed = false;

    if (!pkg.main) {
      pkg.main = './dist/index.js';
      changed = true;
    }

    if (pkg.exports && pkg.exports['.']) {
      const dotExport = pkg.exports['.'];
      if (!dotExport.require) {
        dotExport.require = './dist/index.js';
        changed = true;
      }
      if (!dotExport.default) {
        dotExport.default = './dist/index.js';
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4), 'utf8');
      console.log('Successfully patched whatsapp-rust-bridge package.json');
    } else {
      console.log('whatsapp-rust-bridge package.json is already patched');
    }
  } catch (error) {
    console.error('Error patching whatsapp-rust-bridge:', error);
  }
} else {
  console.log('whatsapp-rust-bridge package.json not found, skipping patch');
}
