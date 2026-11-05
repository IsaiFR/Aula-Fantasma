'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { parsePet, fromImage, petId, MAX_FILE, MAX_IMAGE } = require('./pet-package.cjs');

function loadLibrary(directories, currentPet) {
  const entries = new Map(), coveredImages = new Set();
  let unavailable = 0;
  const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  const add = candidate => {
    const id = petId(candidate);
    if (!entries.has(id)) entries.set(id, { id, pet: candidate });
    Object.values(candidate.images).forEach(image => coveredImages.add(hash(image.bytes)));
  };
  const files = [...new Set(directories)].flatMap(directory => {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isFile() && /\.(pet|aulapet|png|webp|gif)$/i.test(entry.name)).map(entry => path.join(directory, entry.name));
  });
  const read = (file, max) => {
    if (fs.statSync(file).size > max) throw new Error('Archivo demasiado grande');
    return fs.readFileSync(file);
  };
  for (const file of files.filter(file => /\.(pet|aulapet)$/i.test(file))) {
    try { add(parsePet(read(file, MAX_FILE))); } catch { unavailable++; }
  }
  if (currentPet) add(currentPet);
  for (const file of files.filter(file => !/\.(pet|aulapet)$/i.test(file))) {
    try {
      const bytes = read(file, MAX_IMAGE);
      if (!coveredImages.has(hash(bytes))) add(fromImage(bytes, path.basename(file, path.extname(file)).slice(0, 80)));
    } catch { unavailable++; }
  }
  return { entries: new Map([...entries].sort((a, b) => a[1].pet.name.localeCompare(b[1].pet.name, 'es'))), unavailable };
}
module.exports = { loadLibrary };
