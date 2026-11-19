'use strict';

(() => {
  if (!window.tablet) return;
  const stage = document.getElementById('tablet-stage');
  const canvas = document.getElementById('tablet-screen');
  const waiting = document.getElementById('tablet-waiting');
  const slides = Object.fromEntries(['inicio', 'receso', 'despedida'].map(scene => [scene, document.getElementById('scene-' + scene)]));
  const context = canvas.getContext('2d', { alpha: false });
  let id, decoder, config, codecSettings, needsKey, painted, failed;
  let overlay, compositionEnabled, activeScene;

  function syncComposition() {
    const visible = activeScene === 'apuntes' && compositionEnabled && painted;
    if (visible && !overlay) {
      overlay = document.createElement('iframe');
      overlay.id = 'tablet-overlay';
      overlay.title = 'Mascotas y cronómetro de la clase';
      overlay.src = '/overlay?surface=tablet';
      overlay.tabIndex = -1;
      stage.append(overlay);
    } else if (!visible && overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  window.tablet.onComposition(enabled => { compositionEnabled = enabled; syncComposition(); });
  window.tablet.onScene(({ scene, recessStatus }) => {
    activeScene = scene;
    stage.hidden = scene !== 'apuntes';
    for (const [name, element] of Object.entries(slides)) element.hidden = name !== scene;
    slides.receso.textContent = recessStatus === 'error' ? 'No se pudo cargar el receso. Selecciona Receso de nuevo.' : 'Cargando la escena de receso…';
    slides.receso.hidden ||= recessStatus === 'ready';
    document.body.dataset.scene = scene;
    syncComposition();
  });

  function closeDecoder() {
    if (decoder && decoder.state !== 'closed') decoder.close();
    decoder = null;
    config = null;
    codecSettings = null;
    needsKey = true;
  }

  function reportError() {
    failed = true;
    painted = false;
    waiting.hidden = false;
    closeDecoder();
    context.clearRect(0, 0, canvas.width, canvas.height);
    syncComposition();
    window.tablet.report(id, 'error');
  }

  function avcCodec(bytes) {
    // An Annex B sequence parameter set begins with NAL type 7, then carries profile and level.
    for (let i = 2; i + 4 < bytes.length; i++) {
      if (bytes[i - 2] === 0 && bytes[i - 1] === 0 && bytes[i] === 1 && (bytes[i + 1] & 31) === 7) {
        return 'avc1.' + Array.from(bytes.subarray(i + 2, i + 5), value => value.toString(16).padStart(2, '0')).join('');
      }
    }
    throw new Error('Falta la configuración H.264');
  }

  function configure(bytes) {
    const next = new VideoDecoder({
      output(frame) {
        try {
          if (decoder !== next) return;
          const resized = !painted || canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight;
          if (resized) {
            canvas.width = frame.displayWidth;
            canvas.height = frame.displayHeight;
            stage.style.setProperty('--tablet-aspect', String(canvas.width / canvas.height));
          }
          context.drawImage(frame, 0, 0);
          if (resized) {
            painted = true;
            waiting.hidden = true;
            syncComposition();
            window.tablet.report(id, 'frame', canvas.width, canvas.height);
          }
        } catch { reportError(); }
        finally { frame.close(); }
      },
      error() { if (decoder === next) reportError(); }
    });
    decoder = next;
    codecSettings = { codec: avcCodec(bytes), optimizeForLatency: true };
    next.configure(codecSettings);
  }

  window.tablet.onSession(next => {
    id = next;
    painted = false;
    failed = false;
    waiting.hidden = false;
    closeDecoder();
    context.clearRect(0, 0, canvas.width, canvas.height);
    syncComposition();
  });

  window.tablet.onPacket((session, packet) => {
    if (id == null || id !== session || failed) return;
    if (packet.type === 'session') { closeDecoder(); return; }
    const bytes = packet.data;
    if (packet.type === 'config') {
      config = bytes;
      if (!decoder) {
        try { configure(bytes); } catch { reportError(); }
      }
      return;
    }
    const key = packet.type === 'key';
    if (needsKey && !key) return;
    try {
      if (!decoder && key) configure(bytes);
      if (decoder.decodeQueueSize > 8 && !needsKey) {
        decoder.reset();
        decoder.configure(codecSettings);
        needsKey = true;
        if (!key) return;
      }
      let data = bytes;
      if (key && config) {
        data = new Uint8Array(config.length + bytes.length);
        data.set(config);
        data.set(bytes, config.length);
      }
      decoder.decode(new EncodedVideoChunk({ data, type: packet.type, timestamp: packet.timestamp }));
      needsKey = false;
    } catch { reportError(); }
  });
})();
