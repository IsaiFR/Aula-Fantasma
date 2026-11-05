'use strict';
// Funciones compartidas con las pruebas de límites y distintos tamaños de lienzo.
((root, factory) => {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AulaLayout = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const clamp = (value, min, max) => Math.max(min, Math.min(Math.max(min, max), value));
  function petLayout(width, height, settings, frame, surface = 'obs') {
    const pixel = frame.pixelRoute;
    const reference = frame.canvas || frame.viewport || { width: 1920, height: 1080 };
    const scale = pixel || frame.cycle ? (surface === 'preview' ? Math.min(width / reference.width, height / reference.height) : 1) : Math.min(width / reference.width, height / reference.height);
    const size = Math.max(1, Math.min(settings.size * scale, width, height));
    const margin = Math.min(settings.margin * scale, Math.max(0, (Math.min(width, height) - size) / 2));
    const spanX = Math.max(0, width - size - margin * 2), spanY = Math.max(0, height - size - margin * 2);
    let baseX = clamp(margin + frame.x * spanX, 0, width - size);
    let baseY = clamp(margin + frame.y * spanY + frame.bob * scale, 0, height - size), facing = frame.facing;
    if (pixel && settings.mode !== 'still') {
      const distance = pixel.distance * scale;
      if (settings.mode === 'edges') {
        const perimeter = 2 * (spanX + spanY);
        const d = perimeter ? (spanX + spanY + (1 - pixel.x) * spanX + distance) % perimeter : 0;
        if (d < spanX) { baseX = margin + d; baseY = margin; facing = 1; }
        else if (d < spanX + spanY) { baseX = margin + spanX; baseY = margin + d - spanX; facing = 1; }
        else if (d < 2 * spanX + spanY) { baseX = margin + 2 * spanX + spanY - d; baseY = margin + spanY; facing = -1; }
        else { baseX = margin; baseY = margin + perimeter - d; facing = -1; }
      } else {
        const reflected = (start, delta, span, direction) => {
          if (!span) return { position: 0, direction };
          const p = ((start + delta) % (2 * span) + 2 * span) % (2 * span);
          return { position: p <= span ? p : 2 * span - p, direction: direction * (p < span ? 1 : -1) };
        };
        const norm = Math.hypot(1, .62);
        const horizontal = reflected(pixel.x * spanX, distance / norm * pixel.directionX, spanX, pixel.directionX);
        const vertical = reflected(pixel.y * spanY, distance * .62 / norm * pixel.directionY, spanY, pixel.directionY);
        baseX = margin + horizontal.position; baseY = margin + vertical.position; facing = horizontal.direction;
      }
    }
    const progress = clamp(frame.presence?.progress || 0, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    // El destino supera el borde completo, incluidos balanceo y contorno del personaje.
    const outsideX = frame.presence?.side === 'left' ? -size - 32 * scale : width + 32 * scale;
    return {
      scale, size, margin, facing,
      x: baseX + (outsideX - baseX) * eased,
      y: baseY
    };
  }
  function bubbleLayout(width, height, pet, bubbleWidth, bubbleHeight) {
    const padding = Math.min(8 * pet.scale, width / 8, height / 8);
    const gap = 10 * pet.scale;
    const cx = pet.x + pet.size / 2, cy = pet.y + pet.size / 2;
    let x = cx - bubbleWidth / 2, y, placement;
    if (pet.y >= bubbleHeight + gap + padding) {
      y = pet.y - bubbleHeight - gap; placement = 'above';
    } else if (pet.y + pet.size + bubbleHeight + gap + padding <= height) {
      y = pet.y + pet.size + gap; placement = 'below';
    } else if (pet.x >= bubbleWidth + gap + padding) {
      x = pet.x - bubbleWidth - gap; y = cy - bubbleHeight / 2; placement = 'left';
    } else {
      x = pet.x + pet.size + gap; y = cy - bubbleHeight / 2; placement = 'right';
    }
    x = clamp(x, padding, width - bubbleWidth - padding);
    y = clamp(y, padding, height - bubbleHeight - padding);
    return { x, y, placement, tailX: clamp(cx - x, bubbleWidth * 0.15, bubbleWidth * 0.85), tailY: clamp(cy - y, bubbleHeight * 0.2, bubbleHeight * 0.8) };
  }
  return { petLayout, bubbleLayout };
});
