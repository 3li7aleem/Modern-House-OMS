const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const staging = path.join(process.env.TEMP, 'oms-asar-staging');
if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });

const devSrc = 'C:/Users/7aleem/Desktop/Modern House OMS/Modern House OMS Development/src/desktop';
const files = ['main.cjs', 'preload.cjs', 'database.cjs', 'installation.cjs', 'backups.cjs', 'server.cjs', 'cloudSync.cjs', 'package.json'];
for (const f of files) {
  fs.copyFileSync(path.join(devSrc, f), path.join(staging, f));
}

const firebaseConfigSrc = 'C:/Users/7aleem/Desktop/Modern House OMS/Modern House OMS Development/firebase-applet-config.json';
if (fs.existsSync(firebaseConfigSrc)) {
  fs.copyFileSync(firebaseConfigSrc, path.join(staging, 'firebase-applet-config.json'));
}

fs.cpSync(path.join(devSrc, 'renderer'), path.join(staging, 'renderer'), { recursive: true });

const targets = [
  'C:/Users/7aleem/AppData/Local/Programs/Modern House OMS/resources/app.asar',
  'C:/Users/7aleem/Desktop/Modern House OMS/Modern House OMS Development/src/desktop/release/win-unpacked/resources/app.asar',
  'C:/Users/7aleem/Desktop/Modern House OMS/Modern House OMS Development/src/desktop/app.asar'
];

const mainTarget = targets[0];
execSync(`npx.cmd asar pack "${staging}" "${mainTarget}"`, { stdio: 'inherit' });

for (const t of targets.slice(1)) {
  try {
    fs.mkdirSync(path.dirname(t), { recursive: true });
    fs.copyFileSync(mainTarget, t);
    console.log('Copied app.asar to:', t);
  } catch (err) {
    console.error('Failed to copy to', t, err);
  }
}

console.log('SUCCESS! Updated all app.asar targets, size:', fs.statSync(mainTarget).size);
