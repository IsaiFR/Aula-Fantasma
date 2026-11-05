'use strict';
window.AulaDraculaBat = class {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = 512;
  }
  render(context, image, state, width, height, poseImage = image) {
    if (!image || state.mix <= 0 && state.smoke <= 0) return;
    const c = this.canvas.getContext('2d'), n = this.canvas.width, t = state.elapsed;
    c.clearRect(0, 0, n, n); c.save(); c.scale(n, n);
    // Nubes deterministas: todas las salidas reciben la misma fase.
    const smoke = Math.max(state.mix * .72, state.smoke);
    for (let i = 0; i < 22; i++) {
      const angle = i * 2.39996 + t * (.16 + i % 3 * .025);
      const pulse = .5 + .5 * Math.sin(t * 1.7 + i * 1.9);
      const radius = .21 + .075 * Math.sin(t * .7 + i);
      const x = .5 + Math.cos(angle) * radius * 1.22;
      const y = .52 + Math.sin(angle) * radius * .78 - .03 * Math.sin(t + i);
      const r = .06 + pulse * .055 + state.smoke * .04;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(218,12,44,${smoke * .26})`);
      g.addColorStop(.45, `rgba(161,0,28,${smoke * .18})`);
      g.addColorStop(1, 'rgba(130,0,20,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
    c.save(); c.globalAlpha = state.mix;
    c.translate(.5 + Math.sin(t * 1.1) * .018, .5 + Math.sin(t * 3.1) * .022);
    c.rotate(Math.sin(t * 1.55) * .035); c.scale(.82, .82); c.translate(-.5, -.5);
    const iw = image.naturalWidth, ih = image.naturalHeight;
    const flap = Math.sin(t * Math.PI * 2 * 2.6);
    // Tiras articuladas: hombro fijo, punta móvil y membranas flexibles.
    for (const side of [-1, 1]) {
      const root = side < 0 ? state.wingLeft : state.wingRight;
      const span = side < 0 ? root : 1 - root;
      const count = 36, strip = span / count;
      for (let i = 0; i < count; i++) {
        const sx = side < 0 ? i * strip : root + i * strip;
        const a = Math.abs(sx - root) / span, b = Math.abs(sx + strip - root) / span;
        const contraction = 1 - .12 * (flap + 1);
        const dx = root + (sx - root) * contraction;
        const dy = flap * .17 * a * a;
        const slope = flap * .17 * (b * b - a * a) / strip;
        c.save(); c.transform(contraction, slope, 0, 1, dx, dy);
        c.drawImage(image, sx * iw, 0, Math.min(strip * iw + 1, iw - sx * iw), ih, 0, 0, strip + 1 / iw, 1);
        c.restore();
      }
    }
    const left = state.wingLeft, right = state.wingRight;
    c.drawImage(image, left * iw, 0, (right - left) * iw, ih, left, 0, right - left, 1);
    // Solo cambia el rostro; alas, cuerpo y accesorios conservan el dibujo aprobado.
    if (poseImage !== image) {
      c.save(); c.beginPath();
      c.moveTo(.481, .416);
      c.ellipse(.414, .416, .067, .053, 0, 0, Math.PI * 2);
      c.moveTo(.635, .416);
      c.ellipse(.568, .416, .067, .053, 0, 0, Math.PI * 2);
      c.moveTo(.563, .48);
      c.ellipse(.508, .48, .055, .036, 0, 0, Math.PI * 2);
      c.clip(); c.drawImage(poseImage, 0, 0, 1, 1); c.restore();
    }
    c.restore(); c.restore();
    context.drawImage(this.canvas, 0, 0, width, height);
  }
};
