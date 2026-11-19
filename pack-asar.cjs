const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const staging = path.join(process.env.TEMP, 'oms-asar-staging');
if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });

const devSrc = 'C:/Users/7aleem/Desktop/Modern House OMS/Modern House OMS Development/src/desktop';
const files = ['main.cjs', 'preload.cjs', 'database.cjs', 'installation.cjs', 'backups.cjs', 'server.cjs', 'package.json'];
for (const f of files) {
  fs.copyFileSync(path.join(devSrc, f), path.join(staging, f));
}

fs.cpSync(path.join(devSrc, 'renderer'), path.join(staging, 'renderer'), { recursive: true });

const targetAsar = 'C:/Users/7aleem/AppData/Local/Programs/Modern House OMS/resources/app.asar';
execSync(`npx.cmd asar pack "${staging}" "${targetAsar}"`, { stdio: 'inherit' });
console.log('SUCCESS! Updated installed app.asar size:', fs.statSync(targetAsar).size);
