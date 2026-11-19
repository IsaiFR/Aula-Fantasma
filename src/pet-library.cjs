'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parsePet, fromImage, petId, MAX_FILE, MAX_IMAGE } = require('./pet-package.cjs');

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const isPackage = file => /\.(pet|aulapet)$/i.test(file);

async function loadLibrary(directories, currentPet, { cache = new Map(), immutableDirectory } = {}) {
  const entries = new Map(), coveredImages = new Set(), packagesByDigest = new Map();
  let unavailable = 0;
  const files = [];
  for (const directory of new Set(directories)) {
    try {
      const children = await fs.promises.readdir(directory, { withFileTypes: true });
      for (const child of children) {
        if (child.isFile() && /\.(pet|aulapet|png|webp|gif)$/i.test(child.name)) files.push(path.join(directory, child.name));
      }
    } catch (error) {
      if (error.code !== 'ENOENT') unavailable++;
    }
  }
  const present = new Set(files);
  for (const file of cache.keys()) if (!present.has(file)) cache.delete(file);

  const describe = pet => ({ entry: { id: petId(pet), pet }, imageHashes: Object.values(pet.images).map(image => hash(image.bytes)) });
  function add(record) {
    const { entry, imageHashes } = record;
    if (!entries.has(entry.id)) entries.set(entry.id, entry);
    for (const digest of imageHashes) coveredImages.add(digest);
  }
  async function inspect(file, packaged) {
    const previous = cache.get(file);
    if (previous && path.dirname(file) === immutableDirectory) return previous;

    const { size, mtimeMs, ctimeMs } = await fs.promises.stat(file);
    const stamp = `${size}:${mtimeMs}:${ctimeMs}`;
    if (previous?.stamp === stamp) return previous;
    if (size > (packaged ? MAX_FILE : MAX_IMAGE)) throw new Error('Archivo demasiado grande');
    const bytes = await fs.promises.readFile(file);
    const digest = hash(bytes);
    let record = packaged ? packagesByDigest.get(digest) : null;
    if (!record) {
      try {
        if (packaged) record = describe(parsePet(bytes));
        else if (!coveredImages.has(digest)) record = describe(fromImage(bytes, path.basename(file, path.extname(file)).slice(0, 80)));
      } catch {
        record = { invalid: true };
      }
    }
    // Una imagen cubierta hoy puede quedar disponible si se retira su paquete.
    const result = { stamp, digest, record };
    if (record) cache.set(file, result);
    return result;
  }
  async function include(file, packaged) {
    try {
      const { record, digest } = await inspect(file, packaged);
      if (packaged) packagesByDigest.set(digest, record);
      if (!packaged && coveredImages.has(digest)) return;
      if (record?.invalid) unavailable++;
      else if (record) add(record);
    } catch {
      unavailable++;
    }
  }
  for (const file of files.filter(isPackage)) await include(file, true);
  if (currentPet) add(describe(currentPet));
  for (const file of files.filter(file => !isPackage(file))) await include(file, false);
  return { entries: new Map([...entries].sort((a, b) => a[1].pet.name.localeCompare(b[1].pet.name, 'es'))), unavailable };
}
module.exports = { loadLibrary };
