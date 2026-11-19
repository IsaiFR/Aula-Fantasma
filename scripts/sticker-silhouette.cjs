'use strict';

function neighbors(size, pixel, visit) {
  if (pixel % size > 0) visit(pixel - 1);
  if (pixel % size < size - 1) visit(pixel + 1);
  if (pixel >= size) visit(pixel - size);
  if (pixel < size * (size - 1)) visit(pixel + size);
}

function removeSticker(context, guide, { size, seedX, seedY, whiskerBounds }) {
  const [left, top, right, bottom] = whiskerBounds;
  const frame = context.getImageData(0, 0, size, size);
  const pixels = frame.data;
  const count = size * size;
  const background = new Uint8Array(count);
  const queue = new Uint32Array(count);
  let end = 0;
  const isWhite = index => {
    const low = Math.min(pixels[index], pixels[index + 1], pixels[index + 2]);
    const high = Math.max(pixels[index], pixels[index + 1], pixels[index + 2]);
    return low >= 150 && high - low <= 30;
  };
  const addBackground = pixel => {
    if (background[pixel]) return;
    const index = pixel * 4;
    if (pixels[index + 3] >= 12 && !isWhite(index)) return;
    background[pixel] = 1;
    queue[end++] = pixel;
  };
  for (let pixel = 0; pixel < count; pixel++) {
    const index = pixel * 4;
    const x = pixel % size;
    const y = Math.floor(pixel / size);
    // La edición guía ayuda a vaciar los huecos pequeños entre los bigotes.
    const whiskerGap = x >= left && x <= right && y >= top && y <= bottom;
    if (pixels[index + 3] < 12 || whiskerGap && guide[index + 3] < 12 && isWhite(index)) addBackground(pixel);
  }
  for (let cursor = 0; cursor < end; cursor++) neighbors(size, queue[cursor], addBackground);

  // Seguir la silueta desde el traje y descartar motas sueltas alrededor del gato.
  const silhouette = new Uint8Array(count);
  end = 0;
  const addCharacter = pixel => {
    if (background[pixel] || silhouette[pixel]) return;
    silhouette[pixel] = 1;
    queue[end++] = pixel;
  };
  addCharacter(seedY * size + seedX);
  for (let cursor = 0; cursor < end; cursor++) neighbors(size, queue[cursor], addCharacter);
  if (end < 100000) throw new Error('No se pudo separar la silueta del borde.');

  const original = new Uint8ClampedArray(pixels);
  for (let pixel = 0; pixel < count; pixel++) {
    const index = pixel * 4;
    if (!silhouette[pixel]) {
      pixels.fill(0, index, index + 4);
      continue;
    }
    // Recuperar el suavizado oscuro de la línea que estaba mezclada con el borde blanco.
    const level = (original[index] + original[index + 1] + original[index + 2]) / 3;
    if (level < 52 || level >= 245 || Math.max(original[index], original[index + 1], original[index + 2]) - Math.min(original[index], original[index + 1], original[index + 2]) > 42) continue;
    let touchesWhite = false;
    let ink = index;
    let inkLevel = level;
    neighbors(size, pixel, next => {
      const at = next * 4;
      if (background[next] && original[at + 3] > 120 && original[at] >= 145 && original[at + 1] >= 145 && original[at + 2] >= 145) touchesWhite = true;
      if (!silhouette[next]) return;
      const findInk = candidate => {
        const position = candidate * 4;
        const value = (original[position] + original[position + 1] + original[position + 2]) / 3;
        if (silhouette[candidate] && value < inkLevel) { inkLevel = value; ink = position; }
      };
      findInk(next);
      neighbors(size, next, findInk);
    });
    if (!touchesWhite || inkLevel >= 58 || level - inkLevel < 18) continue;
    pixels[index + 3] = original[index + 3] * (249 - level) / (249 - inkLevel);
    for (let channel = 0; channel < 3; channel++) pixels[index + channel] = original[ink + channel];
  }
  context.putImageData(frame, 0, 0);
}

module.exports = { removeSticker };
