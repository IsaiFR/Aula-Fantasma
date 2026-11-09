'use strict';
const assert = require('node:assert/strict'), { inflateSync } = require('node:zlib');
// Decodificador de prueba para PNG RGBA o indexados de 8 bits: sin librerías
// gráficas ni dependencia del generador que se está verificando.
module.exports = function decode(bytes) {
  let offset = 8, width, height, colorType, palette, transparency; const parts = [];
  while (offset < bytes.length) {
    const size = bytes.readUInt32BE(offset), kind = bytes.toString('ascii', offset + 4, offset + 8), data = bytes.subarray(offset + 8, offset + 8 + size);
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      colorType = data[9];
      assert.equal(data[8], 8); assert.ok(colorType === 6 || colorType === 3); assert.equal(data[12], 0);
    }
    if (kind === 'IDAT') parts.push(data);
    if (kind === 'PLTE') palette = data;
    if (kind === 'tRNS') transparency = data;
    offset += size + 12;
  }
  const channels = colorType === 3 ? 1 : 4;
  const packed = inflateSync(Buffer.concat(parts)), stride = width * channels, pixels = Buffer.alloc(stride * height);
  let source = 0;
  for (let y = 0; y < height; y++) {
    const filter = packed[source++]; assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const position = y * stride + x, left = x >= channels ? pixels[position - channels] : 0, up = y ? pixels[position - stride] : 0, corner = y && x >= channels ? pixels[position - stride - channels] : 0;
      let prediction = 0;
      if (filter === 1) prediction = left;
      if (filter === 2) prediction = up;
      if (filter === 3) prediction = Math.floor((left + up) / 2);
      if (filter === 4) {
        const estimate = left + up - corner, a = Math.abs(estimate - left), b = Math.abs(estimate - up), c = Math.abs(estimate - corner);
        prediction = a <= b && a <= c ? left : b <= c ? up : corner;
      }
      pixels[position] = (packed[source++] + prediction) & 255;
    }
  }
  if (colorType === 3) {
    assert.ok(palette?.length);
    const rgba = Buffer.alloc(width * height * 4);
    for (let i = 0; i < pixels.length; i++) {
      const index = pixels[i]; assert.ok(index * 3 + 2 < palette.length);
      for (let k = 0; k < 3; k++) rgba[i * 4 + k] = palette[index * 3 + k];
      rgba[i * 4 + 3] = transparency?.[index] ?? 255;
    }
    return { width, height, pixels: rgba };
  }
  return { width, height, pixels };
};
