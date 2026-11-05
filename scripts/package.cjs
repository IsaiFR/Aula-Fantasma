'use strict';
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { packager } = require('@electron/packager');

(async () => {
  const root = path.join(__dirname, '..');
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'aula-fantasma-build-'));
  try {
    const output = await packager({
      dir: root, out: staging,
      name: 'Aula Fantasma', platform: 'win32', arch: 'x64',
      electronZipDir: process.env.AULA_ELECTRON_ZIP_DIR || undefined,
      icon: path.join(root, 'assets', 'app-icon.ico'),
      overwrite: true, asar: true, prune: true,
      appCopyright: 'EduNet',
      win32metadata: { CompanyName: 'EduNet', FileDescription: 'Mascota de escritorio y OBS', ProductName: 'Aula Fantasma' },
      // Solo entra la fuente; el runtime de la raíz nunca entra en su propio ASAR.
      ignore: file => {
        const relative = file.replace(/\\/g, '/').replace(/^\//, '');
        if (!relative) return false;
        return !/^(src|web|assets|pets)(\/|$)|^(package\.json|GUIA-OBS\.html|LEEME\.txt)$/.test(relative);
      }
    });
    for (const directory of output) {
      for (const name of fs.readdirSync(directory)) {
        const source = path.join(directory, name), target = path.join(root, name);
        // Sobrescribir archivos en sitio evita eliminar antes un ejecutable que
        // Windows puede mantener abierto temporalmente sin compartir borrado.
        if (fs.statSync(source).isFile()) fs.copyFileSync(source, target);
        else fs.cpSync(source, target, { recursive: true, force: true });
      }
    }
    require('./verify-package.cjs');
    console.log(`App actualizada en la raíz: ${path.join(root, 'Aula Fantasma.exe')}`);
  } finally {
    const resolved = path.resolve(staging);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('aula-fantasma-build-')) throw new Error('Ruta temporal no válida');
    fs.rmSync(resolved, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
