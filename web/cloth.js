'use strict';
// Deformación de la textura en tiempo de ejecución: el PNG original permanece intacto.
// Canvas 2D también funciona en fuentes de OBS sin aceleración gráfica.
(() => {
  const smooth = (a, b, v) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  class Cloth {
    constructor(image, body, { attach = true } = {}) {
      this.image = image;
      this.body = body;
      this.attach = attach;
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'pet-cloth';
      this.canvas.setAttribute('aria-hidden', 'true');
      if (attach) body.insertBefore(this.canvas, image.nextSibling);
      this.context = this.canvas.getContext('2d', { willReadFrequently: true });
      this.sourceCanvas = document.createElement('canvas');
      this.sourceContext = this.sourceCanvas.getContext('2d', { willReadFrequently: true });
      this.ready = false;
      this.key = '';
    }
    reset() {
      this.ready = false;
      this.key = '';
      if (this.attach) this.body.classList.remove('cloth-active');
    }
    prepare(n) {
      this.canvas.width = this.canvas.height = n;
      this.sourceCanvas.width = this.sourceCanvas.height = n;
      this.sourceContext.clearRect(0, 0, n, n);
      const sourceWidth = this.image.naturalWidth || this.image.width, sourceHeight = this.image.naturalHeight || this.image.height;
      const scale = n / Math.max(sourceWidth, sourceHeight);
      const width = sourceWidth * scale, height = sourceHeight * scale;
      this.sourceContext.drawImage(this.image, (n - width) / 2, (n - height) / 2, width, height);
      this.source = this.sourceContext.getImageData(0, 0, n, n);
      this.output = this.context.createImageData(n, n);
      this.weights = new Float32Array(n * n);
      // Cada mascota describe dónde empieza la tela y qué regiones se protegen.
      const profile = this.profile;
      for (let y = Math.floor(n * profile.startY); y < n; y++) {
        const v = y / (n - 1);
        const lower = smooth(profile.startY, profile.fullY, v);
        for (let x = 0; x < n; x++) {
          const u = x / (n - 1);
          const t = profile.tail;
          const tail = t ? 1 - (1 - smooth(t.startX, t.endX, u)) * (1 - smooth(t.startY, t.endY, v)) : 1;
          let protectedWeight = 1;
          for (const region of profile.protectedRegions) protectedWeight = Math.min(protectedWeight, smooth(0.8, 1.4, Math.hypot((u - region.cx) / region.rx, (v - region.cy) / region.ry)));
          this.weights[y * n + x] = lower * tail * protectedWeight;
        }
      }
      this.ready = true;
    }
    render(frame, enabled, profile) {
      const profileKey = JSON.stringify(profile);
      if (this.profileKey !== profileKey) {
        this.profile = profile; this.profileKey = profileKey; this.reset();
      }
      if (!enabled || this.image.complete === false || !(this.image.naturalWidth || this.image.width)) {
        if (this.attach) this.body.classList.remove('cloth-active');
        return;
      }
      // Resolución limitada: no se procesa una imagen de 1254 px para una mascota de 150 px.
      const n = Math.max(32, Math.min(600, Math.ceil(this.body.clientWidth * (devicePixelRatio || 1))));
      const strength = frame.clothStrength ?? 1;
      const key = `${n}:${frame.elapsed}:${strength}:${this.image.src || this.image.dataset.revision}`;
      if (this.key === key && this.ready) { if (this.attach) this.body.classList.add('cloth-active'); return; }
      if (!this.ready || this.canvas.width !== n) this.prepare(n);
      const started = performance.now();
      const src = this.source.data, out = this.output.data;
      out.set(src); // La parte superior conserva exactamente la textura original.
      const time = frame.elapsed || 0;
      for (let y = Math.floor(n * profile.startY); y < n; y++) {
        const v = y / (n - 1);
        const wave = Math.sin(v * profile.frequencyY - time * profile.speedX);
        for (let x = 0; x < n; x++) {
          const index = y * n + x, weight = this.weights[index] * strength;
          if (weight < 0.00001) continue;
          const u = x / (n - 1);
          // Dos ondas desfasadas desplazan los pliegues; una onda vertical mueve el dobladillo.
          const sx = x + n * weight * (profile.amplitudeX * wave + profile.amplitudeX2 * Math.sin(u * profile.frequencyX2 + v * profile.frequencyY2 - time * profile.speedX2));
          const sy = y + n * weight * profile.amplitudeY * Math.sin(u * profile.frequencyX - time * profile.speedY + v * profile.frequencyY3);
          const dest = index * 4;
          if (sx < 0 || sy < 0 || sx >= n - 1 || sy >= n - 1) { out.fill(0, dest, dest + 4); continue; }
          const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
          const a = (iy * n + ix) * 4, b = a + 4, c = a + n * 4, d = c + 4;
          // Interpolación con alfa premultiplicado para mantener limpio el contorno transparente.
          const wa = (1 - fx) * (1 - fy) * src[a + 3], wb = fx * (1 - fy) * src[b + 3];
          const wc = (1 - fx) * fy * src[c + 3], wd = fx * fy * src[d + 3];
          const alpha = wa + wb + wc + wd;
          out[dest + 3] = alpha;
          if (alpha < 0.5) { out.fill(0, dest, dest + 3); continue; }
          for (let channel = 0; channel < 3; channel++) {
            out[dest + channel] = (wa * src[a + channel] + wb * src[b + channel] + wc * src[c + channel] + wd * src[d + channel]) / alpha;
          }
        }
      }
      this.context.putImageData(this.output, 0, 0);
      this.canvas.dataset.phase = String(frame.elapsed);
      this.canvas.dataset.strength = String(strength);
      this.canvas.dataset.renderMs = (performance.now() - started).toFixed(2);
      this.key = key;
      if (this.attach) this.body.classList.add('cloth-active');
    }
  }
  window.AulaCloth = Cloth;
})();
