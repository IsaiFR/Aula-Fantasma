'use strict';
const assert = require('node:assert/strict'), { inflateSync } = require('node:zlib');
// Decodificador de prueba para los PNG RGBA de 8 bits del atlas: sin librerías
// gráficas ni dependencia del generador que se está verificando.
module.exports = function decode(bytes) {
  let offset = 8, width, height; const parts = [];
  while (offset < bytes.length) {
    const size = bytes.readUInt32BE(offset), kind = bytes.toString('ascii', offset + 4, offset + 8), data = bytes.subarray(offset + 8, offset + 8 + size);
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      assert.equal(data[8], 8); assert.equal(data[9], 6); assert.equal(data[12], 0);
    }
    if (kind === 'IDAT') parts.push(data);
    offset += size + 12;
  }
  const packed = inflateSync(Buffer.concat(parts)), stride = width * 4, pixels = Buffer.alloc(stride * height);
  let source = 0;
  for (let y = 0; y < height; y++) {
    const filter = packed[source++]; assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const position = y * stride + x, left = x >= 4 ? pixels[position - 4] : 0, up = y ? pixels[position - stride] : 0, corner = y && x >= 4 ? pixels[position - stride - 4] : 0;
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
  return { width, height, pixels };
};
