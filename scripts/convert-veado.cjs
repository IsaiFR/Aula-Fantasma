'use strict';
// Conversión offline de avatares mini estáticos. No ejecuta código del archivo.
// Referencias: https://veado.tube/docs/tech/file/ y /images/.
const fs = require('node:fs');
const path = require('node:path');
const { deflateSync } = require('node:zlib');
const { serializePet, animationProfile, safeFilename } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');
function ensure(ok, message = 'Archivo veado no compatible o incompleto.') { if (!ok) throw new Error(message); }
class Reader {
  constructor(bytes) { this.bytes = bytes; this.offset = 0; }
  take(n) { ensure(Number.isSafeInteger(n) && n >= 0 && this.offset + n <= this.bytes.length); const b = this.bytes.subarray(this.offset, this.offset + n); this.offset += n; return b; }
  u32() { return this.take(4).readUInt32LE(); }
  double() { const n = this.take(8).readDoubleLE(); ensure(Number.isFinite(n)); return n; }
  variable() { let n = 0; for (let i = 0; i < 5; i++) { const b = this.take(1)[0]; n += (b & 127) * 2 ** (7 * i); if (!(b & 128)) { ensure(n <= 0x7fffffff); return n; } } throw new Error('Entero veado no válido.'); }
  string() { const n = this.variable(); ensure(n <= 4096); return this.take(n).toString('utf8'); }
}
function dimensions(w, h) { ensure(w > 0 && h > 0 && w <= 2048 && h <= 2048, 'La conversión admite imágenes de hasta 2048 × 2048.'); }
function decodeTexture(bytes) {
  const reader = new Reader(bytes), width = reader.u32(), height = reader.u32(), format = reader.take(4).toString();
  dimensions(width, height);
  const count = width * height, rgba = Buffer.alloc(count * 4);
  if (format === 'RAW.') { reader.take(count * 4).copy(rgba); return { width, height, rgba }; }
  ensure(format === 'VDD.', `Textura ${format} no compatible.`);
  const lengths = Array.from({ length: 4 }, () => reader.u32());
  for (const [channel, size] of lengths.entries()) {
    const component = [3, 0, 1, 2][channel];
    if (size >= 0xffffff00) { for (let i = 0; i < count; i++) rgba[i * 4 + component] = size & 255; continue; }
    const stream = reader.take(size * 4); let bit = 0;
    const bits = n => { let v = 0; for (let i = 0; i < n; i++) { ensure(bit < stream.length * 8, 'Textura VDD truncada.'); v |= ((stream[bit >> 3] >> (bit & 7)) & 1) << i; bit++; } return v; };
    let value = channel === 0 ? 255 : 0, repeat = 0;
    for (let i = 0; i < count; i++) {
      if (channel && !rgba[i * 4 + 3]) continue;
      if (repeat) repeat--;
      else {
        let delta = 0;
        if (bits(1)) { if (bits(1)) delta = bits(1) + 1; }
        else if (bits(1)) delta = bits(1) ? bits(2) + 5 : bits(1) + 3;
        else if (bits(1)) delta = bits(1) ? bits(4) + 17 : bits(3) + 9;
        else if (bits(1)) delta = bits(1) ? bits(6) + 65 : bits(5) + 33;
        else repeat = bits(8) + 6;
        if (delta && !bits(1)) delta = -delta;
        value = (value + delta) & 255;
      }
      rgba[i * 4 + component] = value;
    }
  }
  return { width, height, rgba };
}
function png(width, height, rgba) {
  const chunk = (type, data) => {
    const b = Buffer.alloc(data.length + 12); b.writeUInt32BE(data.length); b.write(type, 4); data.copy(b, 8);
    let crc = 0xffffffff;
    for (const value of b.subarray(4, -4)) { crc ^= value; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
    b.writeUInt32BE((crc ^ 0xffffffff) >>> 0, b.length - 4); return b;
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const scan = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) rgba.copy(scan, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scan)), chunk('IEND', Buffer.alloc(0))]);
}
function convert(bytes) {
  ensure(bytes.length <= 64 * 1024 * 1024 && bytes.subarray(0, 9).toString() === 'VEADOTUBE');
  const r = new Reader(bytes); r.take(9); const chunks = new Map();
  while (r.offset + 12 <= bytes.length) {
    const id = r.u32(), type = r.take(4).toString(), size = r.u32();
    if (!id) break;
    ensure(!chunks.has(id) && chunks.size < 1024); chunks.set(id, { type, data: r.take(size) });
  }
  const get = (id, type) => { const c = chunks.get(id); ensure(c?.type === type, `Falta el bloque ${type} ${id}.`); return new Reader(c.data); };
  const render = id => {
    const image = get(id, 'AIMG'), w = image.u32(), h = image.u32(); dimensions(w, h);
    ensure(image.variable() === 1, 'Este conversor requiere imágenes estáticas; no descarta fotogramas animados.');
    const textureId = image.u32(), x = image.u32(), y = image.u32(); image.double();
    const t = decodeTexture(get(textureId, 'ABMP').bytes); ensure(x + t.width <= w && y + t.height <= h);
    const rgba = Buffer.alloc(w * h * 4);
    for (let row = 0; row < t.height; row++) t.rgba.copy(rgba, ((h - 1 - y - row) * w + x) * 4, row * t.width * 4, (row + 1) * t.width * 4);
    return { mime: 'image/png', bytes: png(w, h, rgba) };
  };
  const list = [...chunks.values()].find(c => c.type === 'MLST'); ensure(list && list.data.length % 4 === 0 && list.data.length <= 64 * 4);
  const states = new Reader(list.data), pets = [];
  while (states.offset < list.data.length) {
    const state = get(states.u32(), 'MSTA'), name = state.string();
    // El adjunto exportado por mini 1.4 usa flags uint32 y tres doubles de parpadeo.
    const flags = state.u32(); ensure(flags <= 7, 'Versión MSTA no compatible con este conversor.');
    for (let i = 0; i < 4; i++) state.u32(); // Miniaturas; se usan las imágenes completas.
    const ids = Array.from({ length: 4 }, () => state.u32());
    const duration = state.double(), intervalMin = state.double(), intervalMax = state.double();
    ensure(ids.every(Boolean), 'Se necesitan las cuatro imágenes del personaje.');
    const images = Object.fromEntries(['open', 'talking', 'closed', 'talkingClosed'].map((key, i) => [key, render(ids[i])]));
    const pet = { kind: 'voice', name: `${name} (voz)`, images, animation: animationProfile({ float: { enabled: false }, blink: { enabled: true, duration, intervalMin, intervalMax } }), behavior: behaviorProfile() };
    pets.push(pet);
  }
  return pets;
}
if (require.main === module) {
  const [source, output] = process.argv.slice(2); ensure(source && output, 'Uso: node scripts/convert-veado.cjs origen.veado carpeta-destino');
  for (const pet of convert(fs.readFileSync(source))) {
    const file = path.join(output, safeFilename(pet.name.replace(' (voz)', '-Voz'), 'pet'));
    fs.writeFileSync(file, serializePet(pet)); console.log(`${pet.name}: ${file}`);
  }
}
module.exports = { convert, decodeTexture, png };
