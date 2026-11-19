'use strict';

const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { SCRCPY_VERSION } = require('../src/tablet.cjs');

const release = `scrcpy-win64-v${SCRCPY_VERSION}`;
const archiveHash = '5b12172b3264b2889f4583ee64752ce832e29bc8b1089dca81093459697165db';
const files = {
  'adb.exe': '957e46b8615f7af5b7292a2ddabe98d2e61940c3fb2b0545756507f080613e71',
  'AdbWinApi.dll': '120bef587119c6cb926b86b9be90fdfbce38937588eae28cd91a94ce63c7b965',
  'AdbWinUsbApi.dll': '6ca69a2ca0e31309c087d288f058977d421ad03500e4c3e1dbd981241a069c60',
  'libusb-1.0.dll': '8ec130918a476b0dbd114c803e71314360608ceabdd2b6f38c83f6f208c608e0',
  'scrcpy-server': 'deacb991ed2509715160ffdc7907e47b4160eb30d1566217e9047fd5b8850cae',
  'LICENSE.txt': '01c12035bf35af37241298dc7ad538eb2a07e5c940437bc6876feeaa9d1951d0'
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const valid = directory => Object.entries(files).every(([name, expected]) => {
  const file = path.join(directory, name);
  return fs.existsSync(file) && hash(fs.readFileSync(file)) === expected;
});

async function prepareTabletRuntime(installed, staging) {
  if (valid(installed)) return installed;
  const url = `https://github.com/Genymobile/scrcpy/releases/download/v${SCRCPY_VERSION}/${release}.zip`;
  const archive = process.env.AULA_SCRCPY_ZIP ? path.resolve(process.env.AULA_SCRCPY_ZIP) : path.join(staging, `${release}.zip`);
  if (!process.env.AULA_SCRCPY_ZIP) {
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Falló la descarga del motor USB (${response.status}).`);
    fs.writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  }
  if (hash(fs.readFileSync(archive)) !== archiveHash) throw new Error('El archivo del motor USB no coincide con el SHA-256 oficial de scrcpy.');
  execFileSync('tar.exe', ['-xf', archive, '-C', staging, ...Object.keys(files).map(name => `${release}/${name}`)], { windowsHide: true });
  const source = path.join(staging, release);
  verifyTabletRuntime(source);
  return source;
}

function verifyTabletRuntime(directory) {
  if (!valid(directory)) throw new Error(`El motor USB scrcpy ${SCRCPY_VERSION} está incompleto o fue modificado.`);
}

module.exports = { prepareTabletRuntime, verifyTabletRuntime };
