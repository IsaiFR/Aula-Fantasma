'use strict';
// Capas articuladas del archivo .aulapet. Canvas conserva el alfa del atlas.
(() => {
  class Rig {
    constructor(body) {
      this.body = body;
      this.canvas = document.createElement('canvas'); this.canvas.id = 'pet-rig';
      this.canvas.setAttribute('aria-hidden', 'true'); body.append(this.canvas);
      this.context = this.canvas.getContext('2d', { willReadFrequently: true });
      this.image = new Image(); this.limb = new Image(); this.url = ''; this.limbUrl = ''; this.atlasReady = false; this.limbReady = false; this.key = '';
      this.image.onload = () => { this.atlasReady = true; this.key = ''; };
      this.limb.onload = () => { this.limbReady = true; this.key = ''; };
      this.image.onerror = () => { this.atlasReady = false; body.classList.remove('rig-active'); };
      this.limb.onerror = () => { this.limbReady = false; body.classList.remove('rig-active'); };
    }
    get ready() { return this.atlasReady && (!this.limbUrl || this.limbReady); }
    setAsset(url, limbUrl) {
      if (this.url === (url || '') && this.limbUrl === (limbUrl || '')) return;
      this.url = url || ''; this.limbUrl = limbUrl || ''; this.atlasReady = false; this.limbReady = false; this.key = '';
      this.body.classList.remove('rig-active');
      if (url) this.image.src = url; else this.image.removeAttribute('src');
      if (limbUrl) this.limb.src = limbUrl; else this.limb.removeAttribute('src');
    }
    render(frame, enabled) {
      const behavior = frame.behavior, rig = behavior?.rig;
      if (!enabled || !rig || !this.ready) { this.body.classList.remove('rig-active'); return; }
      const n = Math.max(32, Math.min(800, Math.ceil(this.body.clientWidth * (devicePixelRatio || 1))));
      const key = JSON.stringify([n, this.url, this.limbUrl, rig, frame.walk, frame.greeting.lift, frame.facing]);
      if (this.key === key) { this.body.classList.add('rig-active'); return; }
      if (this.canvas.width !== n) this.canvas.width = this.canvas.height = n;
      const ctx = this.context; ctx.clearRect(0, 0, n, n); ctx.save();
      if (rig.mirror && frame.facing < 0) { ctx.translate(n, 0); ctx.scale(-1, 1); }
      const order = ['leftFoot', 'rightFoot', 'freeFoot', 'body', 'arm'];
      for (const role of order) {
        const layer = rig.layers.find(value => value.role === role);
        if (!layer) continue;
        const image = role === 'freeFoot' ? this.limb : this.image;
        const r = layer.placement, crop = layer.crop;
        let x = r.x, y = r.y, angle = layer.restAngle;
        if (role === 'arm') angle += (layer.raisedAngle - layer.restAngle) * frame.greeting.lift;
        if (role === 'leftFoot' || role === 'rightFoot') {
          const phase = frame.walk.phase + (role === 'rightFoot' ? Math.PI : 0);
          const stride = Math.sin(phase) * frame.walk.strength;
          x += stride * behavior.walk.stepWidth;
          y -= Math.max(0, Math.sin(phase)) * behavior.walk.stepHeight * frame.walk.strength;
          angle += stride * behavior.walk.footAngle;
        }
        ctx.save();
        ctx.translate((x + r.width * layer.pivot.x) * n, (y + r.height * layer.pivot.y) * n);
        ctx.rotate(angle * Math.PI / 180);
        ctx.drawImage(image, crop.x * image.naturalWidth, crop.y * image.naturalHeight, crop.width * image.naturalWidth, crop.height * image.naturalHeight, -r.width * layer.pivot.x * n, -r.height * layer.pivot.y * n, r.width * n, r.height * n);
        ctx.restore();
      }
      ctx.restore();
      this.canvas.dataset.phase = frame.greeting.phase;
      this.canvas.dataset.lift = String(frame.greeting.lift);
      this.canvas.dataset.walkPhase = String(frame.walk.phase);
      this.canvas.dataset.walkStrength = String(frame.walk.strength);
      this.key = key; this.body.classList.add('rig-active');
    }
  }
  window.AulaRig = Rig;
})();
