'use strict';
(() => {
  class Flipbook {
    constructor(body) {
      this.body = body; this.canvas = document.createElement('canvas'); this.canvas.id = 'pet-flipbook';
      this.canvas.setAttribute('aria-hidden', 'true'); body.append(this.canvas);
      this.context = this.canvas.getContext('2d', { willReadFrequently: true });
      this.ready = false; this.epoch = 0; this.assets = ''; this.key = ''; this.clips = {}; this.sheet = null;
    }
    release() { for (const frames of Object.values(this.clips)) for (const image of frames) image.close(); this.clips = {}; this.sheet = null; }
    async decode(url) {
      const response = await fetch(url); if (!response.ok) throw new Error('GIF no disponible.');
      const decoder = new ImageDecoder({ data: await response.arrayBuffer(), type: 'image/gif', preferAnimation: true });
      const frames = [];
      try {
        await decoder.tracks.ready;
        const count = decoder.tracks.selectedTrack.frameCount;
        if (count < 1 || count > 128) throw new Error('Demasiados fotogramas.');
        for (let index = 0; index < count; index++) {
          const { image } = await decoder.decode({ frameIndex: index });
          try { frames.push(await createImageBitmap(image)); } finally { image.close(); }
        }
        return frames;
      } catch (error) { for (const frame of frames) frame.close(); throw error; }
      finally { decoder.close(); }
    }
    setAssets(frame) {
      const cycle = frame.behavior?.cycle;
      const config = cycle || frame.behavior?.flipbook;
      const assets = config ? JSON.stringify([frame.walkGifUrl, frame.greetingGifUrl, frame.cycleGifUrl, frame.framesUrl, config]) : '';
      if (assets === this.assets) return;
      this.assets = assets; this.ready = false; this.key = ''; this.release(); this.body.classList.remove('flipbook-active');
      const epoch = ++this.epoch;
      if (!config) return;
      const load = async () => {
        let clips;
        if (typeof ImageDecoder !== 'undefined') {
          if (cycle) {
            try {
              const images = await this.decode(frame.cycleGifUrl);
              if (images.length === cycle.sequence.length) clips = { cycle: images };
              else for (const image of images) image.close();
            } catch { /* Hoja PNG como alternativa al decodificador GIF. */ }
          } else {
          const results = await Promise.allSettled([this.decode(frame.walkGifUrl), this.decode(frame.greetingGifUrl)]);
          if (results.every(result => result.status === 'fulfilled') && results[0].value.length === config.walkFrames && results[1].value.length === config.raiseFrames * 2 - 1) clips = { walk: results[0].value, greeting: results[1].value };
          else for (const result of results) if (result.status === 'fulfilled') for (const image of result.value) image.close();
          }
        }
        if (epoch !== this.epoch) { if (clips) for (const frames of Object.values(clips)) for (const image of frames) image.close(); return; }
        if (clips) { this.clips = clips; this.canvas.dataset.decoder = 'gif'; }
        else {
          const sheet = new Image(); sheet.src = frame.framesUrl; await sheet.decode();
          if (epoch !== this.epoch) return;
          this.sheet = sheet; this.canvas.dataset.decoder = 'png';
        }
        this.ready = true; this.key = '';
      };
      load().catch(() => { if (epoch === this.epoch) { this.ready = false; this.body.classList.remove('flipbook-active'); } });
    }
    render(frame, enabled) {
      const config = frame.behavior?.cycle || frame.behavior?.flipbook, pose = frame.gifFrame;
      if (!enabled || !config || !pose || !this.ready) { this.body.classList.remove('flipbook-active'); return; }
      const n = Math.max(32, Math.min(800, Math.ceil(this.body.clientWidth * (devicePixelRatio || 1))));
      const key = JSON.stringify([n, this.assets, pose, frame.facing]);
      if (key !== this.key) {
        if (this.canvas.width !== n) this.canvas.width = this.canvas.height = n;
        const ctx = this.context; ctx.clearRect(0, 0, n, n); ctx.save();
        // El texto de los ciclos está integrado en la imagen: conservar su lectura.
        if (config.mirror && frame.facing < 0 && !frame.cycle?.text) { ctx.translate(n, 0); ctx.scale(-1, 1); }
        if (this.sheet) {
          const index = pose.sheetIndex ?? pose.index;
          ctx.drawImage(this.sheet, index % config.columns * config.size, Math.floor(index / config.columns) * config.size, config.size, config.size, 0, 0, n, n);
        } else ctx.drawImage(this.clips[pose.clip][pose.index], 0, 0, n, n);
        ctx.restore(); this.key = key;
      }
      this.canvas.dataset.phase = frame.cycle?.stage || frame.greeting.phase; this.canvas.dataset.lift = String(frame.greeting.lift);
      this.canvas.dataset.walkPhase = String(frame.walk.phase); this.canvas.dataset.walkStrength = String(frame.walk.strength);
      this.canvas.dataset.frame = String(pose.index); this.canvas.dataset.facing = String(frame.facing);
      this.body.classList.add('flipbook-active');
    }
  }
  window.AulaFlipbook = Flipbook;
})();
