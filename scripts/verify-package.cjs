'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const asar = require('@electron/asar');
const root = path.join(__dirname, '..');
const version = require('../package.json').version;
const base = root;
const archive = path.join(base, 'resources', 'app.asar');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function files(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? files(relative) : entry.isFile() ? [relative] : [];
  });
}
const runtimeFiles = ['src', 'web', 'assets', 'pets'].flatMap(files).concat(['GUIA-OBS.html', 'LEEME.txt']);
for (const file of runtimeFiles) {
  if (hash(fs.readFileSync(path.join(root, file))) !== hash(asar.extractFile(archive, path.normalize(file)))) {
    throw new Error(`El paquete contiene otra versión de ${file}`);
  }
}
for (const file of ['GUIA-OBS.html', 'LEEME.txt']) {
  if (hash(fs.readFileSync(path.join(root, file))) !== hash(fs.readFileSync(path.join(base, file)))) {
    throw new Error(`La copia externa de ${file} es distinta`);
  }
}
if (asar.listPackage(archive).some(file => !/^[\\/](src|web|assets|pets)([\\/]|$)|^[\\/](package\.json|GUIA-OBS\.html|LEEME\.txt)$/.test(file))) {
  throw new Error('Se incluyeron archivos de trabajo en el paquete');
}
if (JSON.parse(asar.extractFile(archive, 'package.json')).version !== version) throw new Error('Versión incorrecta');
if (process.argv[2]) {
  if (hash(fs.readFileSync(process.argv[2])) !== hash(fs.readFileSync(path.join(root, 'web', 'edughost', 'open.png')))) {
    throw new Error('La copia de EduGhost no coincide con el original');
  }
  console.log('PNG original intacto: SHA-256 coincide.');
}
console.log(`Integridad correcta: ${runtimeFiles.length} archivos de la versión ${version} coinciden con el código, imágenes y guías finales.`);
