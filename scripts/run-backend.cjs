const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const i = t.indexOf('=');
        if (i === -1) continue;
        process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
}

execSync('mvn spring-boot:run', {cwd: path.resolve(__dirname, '..', 'backend'), stdio: 'inherit', env: process.env});
