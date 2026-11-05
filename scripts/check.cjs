'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
let failed = false;
for (const directory of ['src', 'web', 'scripts', 'tests']) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (!/\.(cjs|js)$/.test(name)) continue;
    const result = spawnSync(process.execPath, ['--check', path.join(root, directory, name)], { encoding: 'utf8' });
    if (result.status !== 0) { failed = true; process.stderr.write(result.stderr); }
  }
}
if (!failed) console.log('Sintaxis correcta en todos los módulos.');
process.exitCode = failed ? 1 : 0;
