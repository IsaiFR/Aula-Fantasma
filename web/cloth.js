'use strict';
// Deformación de la textura en tiempo de ejecución: el PNG original permanece intacto.
// Canvas 2D también funciona en fuentes de OBS sin aceleración gráfica.
(() => {
  const smooth = (a, b, v) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  function addMotionRegion(weights, n, { points, feather, strength }) {
    const scale = n - 1;
    const vertices = points.map(([x, y]) => [x * scale, y * scale]);
    const xs = vertices.map(([x]) => x), ys = vertices.map(([, y]) => y);
    const left = Math.ceil(Math.min(...xs)), right = Math.floor(Math.max(...xs));
    const top = Math.ceil(Math.min(...ys)), bottom = Math.floor(Math.max(...ys));
    const edges = vertices.map(([x, y], index) => {
      const [endX, endY] = vertices[(index + 1) % vertices.length];
      const dx = endX - x, dy = endY - y;
      return { x, y, endY, dx, dy, lengthSquared: dx * dx + dy * dy };
    }).filter(edge => edge.lengthSquared > 0);
    const fade = feather * scale;
    // Atenúa hacia dentro del contorno para fijar las uniones con el personaje.
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        let inside = false;
        let distanceSquared = fade * fade;
        for (const edge of edges) {
          const px = x - edge.x, py = y - edge.y;
          if ((edge.y > y) !== (edge.endY > y) && px < py * edge.dx / edge.dy) inside = !inside;
          const t = Math.max(0, Math.min(1, (px * edge.dx + py * edge.dy) / edge.lengthSquared));
          distanceSquared = Math.min(distanceSquared, (px - t * edge.dx) ** 2 + (py - t * edge.dy) ** 2);
        }
        const index = y * n + x;
        if (inside) weights[index] = Math.max(weights[index], strength * smooth(0, fade, Math.sqrt(distanceSquared)));
      }
    }
  }
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
      if (this.canvas.width !== n || this.canvas.height !== n || !this.output) {
        this.canvas.width = this.canvas.height = n;
        this.sourceCanvas.width = this.sourceCanvas.height = n;
        this.output = this.context.createImageData(n, n);
        this.weights = null;
      }
      this.sourceContext.clearRect(0, 0, n, n);
      const sourceWidth = this.image.naturalWidth || this.image.width, sourceHeight = this.image.naturalHeight || this.image.height;
      const scale = n / Math.max(sourceWidth, sourceHeight);
      const width = sourceWidth * scale, height = sourceHeight * scale;
      this.sourceContext.drawImage(this.image, (n - width) / 2, (n - height) / 2, width, height);
      this.source = this.sourceContext.getImageData(0, 0, n, n);
      if (!this.weights) this.prepareWeights(n);
      this.ready = true;
    }
    prepareWeights(n) {
      this.weights = new Float32Array(n * n);
      const profile = this.profile;
      if (profile.motionRegions) {
        this.startRow = Math.floor((n - 1) * Math.min(...profile.motionRegions.flatMap(region => region.points.map(([, y]) => y))));
        for (const region of profile.motionRegions) addMotionRegion(this.weights, n, region);
        return;
      }
      this.startRow = Math.floor(n * profile.startY);
      for (let y = this.startRow; y < n; y++) {
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
    }
    render(frame, enabled, profile) {
      const profileKey = JSON.stringify(profile);
      if (this.profileKey !== profileKey) {
        this.profile = profile; this.profileKey = profileKey; this.weights = null; this.reset();
      }
      if (!enabled || this.image.complete === false || !(this.image.naturalWidth || this.image.width)) {
        if (this.attach) this.body.classList.remove('cloth-active');
        return;
      }
      // Resolución limitada: no se procesa una imagen de 1254 px para una mascota de 150 px.
      const n = Math.max(32, Math.min(600, Math.ceil(this.body.clientWidth * (devicePixelRatio || 1))));
      const strength = profile.motionRegions ? 1 : (frame.clothStrength ?? 1);
      const key = `${n}:${frame.elapsed}:${strength}:${this.image.src || this.image.dataset.revision}`;
      if (this.key === key && this.ready) { if (this.attach) this.body.classList.add('cloth-active'); return; }
      if (!this.ready || this.canvas.width !== n) this.prepare(n);
      const started = performance.now();
      const src = this.source.data, out = this.output.data;
      out.set(src); // Los píxeles sin desplazamiento conservan la textura original.
      const time = frame.elapsed || 0;
      for (let y = this.startRow; y < n; y++) {
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
