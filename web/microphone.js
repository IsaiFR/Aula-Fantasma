'use strict';
(() => {
  let stream, context, sampleTimer, key = '', revision = 0;
  const report = (status, devices) => window.microphone.status({ status, ...(devices ? { devices } : {}) });
  async function devices() {
    return (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audioinput').map((d, i) => ({ id: d.deviceId, label: d.label || `Micrófono ${i + 1}` }));
  }
  function stop() {
    clearInterval(sampleTimer); sampleTimer = null;
    if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
    if (context) { context.close().catch(() => {}); context = null; }
  }
  async function configure(config, force = false) {
    const next = JSON.stringify([config.enabled, config.deviceId]);
    if (!force && next === key) return;
    key = next; const current = ++revision; stop();
    if (!config.enabled) { const inputs = await devices().catch(() => []); if (current === revision) report('off', inputs); return; }
    report('starting');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: false, audio: { ...(config.deviceId === 'default' ? {} : { deviceId: { exact: config.deviceId } }), echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
      if (current !== revision) { media.getTracks().forEach(track => track.stop()); return; }
      stream = media; context = new AudioContext();
      const source = context.createMediaStreamSource(media), analyser = context.createAnalyser();
      analyser.fftSize = 1024; source.connect(analyser); // Sin conexión a altavoces.
      await context.resume();
      if (current !== revision) return;
      const buffer = new Float32Array(analyser.fftSize);
      sampleTimer = setInterval(() => {
        analyser.getFloatTimeDomainData(buffer); let sum = 0;
        for (const value of buffer) sum += value * value;
        window.microphone.level(Math.min(1, Math.sqrt(sum / buffer.length)));
      }, 30);
      media.getAudioTracks()[0].addEventListener('ended', () => { if (current === revision) { stop(); key = ''; report('disconnected'); } });
      const inputs = await devices();
      if (current === revision) report('active', inputs);
    } catch (error) {
      if (current !== revision) return;
      stop(); key = '';
      report(['NotAllowedError', 'SecurityError'].includes(error.name) ? 'denied' : ['NotFoundError', 'OverconstrainedError'].includes(error.name) ? 'missing' : 'error');
    }
  }
  window.microphone.onConfig(config => configure(config));
  navigator.mediaDevices.addEventListener('devicechange', async () => {
    const config = await window.microphone.config();
    if (config.enabled) configure(config, true);
    else report('off', await devices().catch(() => []));
  });
  window.addEventListener('pagehide', () => { revision++; stop(); });
  window.microphone.config().then(configure);
})();
