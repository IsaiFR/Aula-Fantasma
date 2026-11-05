'use strict';
window.AulaVoice = class {
  constructor(body) {
    this.body = body; this.canvas = document.createElement('canvas'); this.canvas.id = 'pet-voice'; body.append(this.canvas);
    this.key = ''; this.ready = false; this.images = {}; this.revision = 0;
    this.source = document.createElement('canvas');
    this.cloth = new window.AulaCloth(this.source, body, { attach: false });
    this.bat = new window.AulaDraculaBat();
  }
  setAssets(voice) {
    const key = voice ? JSON.stringify(voice.urls) : '';
    if (key === this.key) return;
    this.key = key; this.ready = false; const revision = ++this.revision;
    this.body.classList.remove('voice-active');
    if (!voice) return;
    Promise.all(Object.entries(voice.urls).filter(([, url]) => url).map(async ([kind, url]) => {
      const image = new Image(); image.src = url; await image.decode(); return [kind, image];
    })).then(entries => { if (revision === this.revision) { this.images = Object.fromEntries(entries); this.ready = true; } }).catch(() => { /* Se mantiene visible la imagen en reposo si falla un recurso. */ });
  }
  render(frame, enabled = true) {
    const voice = frame.voice, active = Boolean(voice && this.ready && enabled);
    this.body.classList.toggle('voice-active', active);
    if (!active) return;
    const kind = voice.speaking ? (voice.blinking ? 'talkingClosed' : 'talking') : (voice.blinking ? 'closed' : 'open');
    const image = this.images[kind] || this.images[voice.speaking ? 'talking' : 'open'];
    if (!image) return;
    const mirrored = Boolean(voice.mirrored);
    const clothProfile = frame.animation?.cloth, animated = Boolean(clothProfile?.enabled);
    const sourceKey = `${this.key}:${kind}`;
    if (animated && this.source.dataset.revision !== sourceKey) {
      this.source.width = image.naturalWidth; this.source.height = image.naturalHeight;
      this.source.getContext('2d').drawImage(image, 0, 0);
      this.source.dataset.revision = sourceKey; this.cloth.reset();
    }
    if (animated) this.cloth.render(frame, true, clothProfile);
    const texture = animated ? this.cloth.canvas : image;
    const width = animated ? texture.width : image.naturalWidth, height = animated ? texture.height : image.naturalHeight;
    const bat = frame.draculaBat;
    this.canvas.dataset.form = bat?.phase || 'original';
    this.canvas.dataset.batMix = String(bat?.mix || 0);
    this.canvas.dataset.phase = String(frame.elapsed);
    const renderedKey = `${sourceKey}:${mirrored}:${animated ? this.cloth.key : ''}:${bat && bat.mix > 0 ? `${bat.elapsed}:${bat.mix}` : ''}`;
    if (this.renderedKey === renderedKey) return;
    this.renderedKey = renderedKey;
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    const context = this.canvas.getContext('2d'); context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.save();
    if (mirrored) { context.translate(this.canvas.width, 0); context.scale(-1, 1); }
    context.globalAlpha = bat ? 1 - bat.mix : 1;
    context.drawImage(texture, 0, 0); context.globalAlpha = 1;
    const batKind = ({ open: 'batOpen', closed: 'batClosed', talking: 'bat', talkingClosed: 'batTalkingClosed' })[kind];
    if (bat) this.bat.render(context, this.images.bat, bat, width, height, this.images[batKind] || this.images.bat);
    this.canvas.dataset.batPose = bat ? (this.images[batKind] ? batKind : 'bat') : '';
    context.restore();
    this.canvas.dataset.pose = kind;
    this.canvas.dataset.asset = voice.urls.open;
    this.canvas.dataset.mirrored = String(mirrored);
    this.canvas.dataset.cloth = String(animated);
    this.canvas.dataset.phase = String(frame.elapsed);
  }
};
