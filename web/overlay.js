'use strict';
(() => {
  const pet = document.getElementById('pet');
  const anchor = document.getElementById('pet-anchor');
  const body = document.getElementById('pet-body');
  const cloth = new window.AulaCloth(pet, body);
  const rig = new window.AulaRig(body);
  const flipbook = new window.AulaFlipbook(body);
  const vehicle = new window.AulaVehicle(body);
  const voice = new window.AulaVoice(body);
  const closed = document.getElementById('pet-closed');
  const bubble = document.getElementById('boo');
  const preview = document.getElementById('preview');
  const surface = preview ? 'preview' : new URLSearchParams(location.search).get('surface') || 'obs';
  const libraryPet = surface === 'library' ? new URLSearchParams(location.search).get('pet') : null;
  const voiceLayer = new URLSearchParams(location.search).get('slot') === 'voice';
  if (!libraryPet && !voiceLayer) {
    const layer = document.createElement('iframe'); layer.id = 'voice-layer'; layer.title = 'Mascota de voz en la esquina';
    layer.src = `/overlay?slot=voice&surface=${encodeURIComponent(surface)}`;
    layer.tabIndex = -1; (preview || document.body).append(layer);
  }
  document.documentElement.dataset.surface = surface;
  const events = libraryPet || voiceLayer ? new EventTarget() : new EventSource(`/events?surface=${encodeURIComponent(surface)}`);
  let disposed = false;
  window.addEventListener('pagehide', () => { disposed = true; events.close?.(); }, { once: true });
  if (voiceLayer) window.addEventListener('message', event => {
    if (event.source === parent && event.origin === location.origin && event.data?.type === 'aula:voice-frame') events.dispatchEvent(new MessageEvent('frame', { data: JSON.stringify(event.data.frame) }));
  });
  if (libraryPet) window.addEventListener('message', event => {
    if (event.source === parent && event.origin === location.origin && event.data?.type === 'aula:library-frame') {
      events.dispatchEvent(new MessageEvent('frame', { data: JSON.stringify(event.data.frame) }));
    }
  });
  let frame = null;
  let connected = false;
  let imageReady = false;
  let currentAsset = '';
  let currentClosedAsset = '';
  let closedReady = false;
  let maskKey = '';
  let x = null, y = null;
  let lastTime = performance.now();
  let canvasRevision = null;
  function updateVisibility() {
    const enabled = frame && (surface === 'desktop' ? frame.settings.desktopEnabled : frame.settings.obsEnabled);
    const visible = connected && imageReady && enabled && frame.presence?.phase !== 'away' && (!frame.behavior?.rig || rig.ready) && (!frame.behavior?.vehicle || vehicle.ready) && (!(frame.behavior?.flipbook || frame.behavior?.cycle) || flipbook.ready);
    anchor.style.visibility = visible ? 'visible' : 'hidden';
    bubble.style.visibility = visible && frame.boo && (frame.greeting?.visible ?? true) ? 'visible' : 'hidden';
  }
  pet.addEventListener('load', () => { imageReady = true; cloth.reset(); updateVisibility(); });
  pet.addEventListener('error', () => { imageReady = false; updateVisibility(); });
  closed.addEventListener('load', () => { closedReady = true; });
  closed.addEventListener('error', () => { closedReady = false; closed.style.opacity = '0'; });
  events.addEventListener('frame', event => {
    if (disposed || !document.documentElement) return;
    try { frame = JSON.parse(event.data); } catch { return; }
    if (canvasRevision !== frame.canvas?.revision) { canvasRevision = frame.canvas?.revision; x = null; y = null; }
    if (!voiceLayer && !libraryPet && frame.voiceCompanion) document.getElementById('voice-layer')?.contentWindow.postMessage({ type: 'aula:voice-frame', frame: frame.voiceCompanion }, location.origin);
    connected = true;
    rig.setAsset(frame.atlasUrl, frame.limbUrl);
    vehicle.setAsset(frame.behavior?.vehicle ? frame.atlasUrl : null);
    flipbook.setAssets(frame);
    voice.setAssets(frame.voice);
    const meter = voiceLayer && parent !== window ? parent.document.getElementById('mic-level') : document.getElementById('mic-level');
    if (meter) {
      meter.value = 20 * Math.log10(Math.max(frame.voice?.level || 0, .000001));
      (voiceLayer && parent !== window ? parent.document : document).getElementById('voice-pose').textContent = frame.voice?.speaking ? 'Hablando' : 'En silencio';
    }
    const greetingText = frame.greeting?.text || 'BOO!!';
    if (bubble.textContent !== greetingText) bubble.textContent = greetingText;
    document.documentElement.dataset.connected = 'true';
    if (currentAsset !== frame.assetUrl) {
      currentAsset = frame.assetUrl;
      imageReady = false;
      cloth.reset();
      pet.src = frame.assetUrl;
    }
    const closedUrl = frame.closedAssetUrl || '';
    const regions = frame.animation?.blink.regions || [];
    const nextMask = JSON.stringify(regions);
    if (maskKey !== nextMask) {
      maskKey = nextMask;
      closed.style.maskImage = regions.length ? regions.map(r => `radial-gradient(ellipse ${r.rx * 100}% ${r.ry * 100}% at ${r.cx * 100}% ${r.cy * 100}%, #000 90%, transparent 100%)`).join(', ') : 'none';
    }
    if (currentClosedAsset !== closedUrl) {
      currentClosedAsset = closedUrl;
      closedReady = false;
      closed.style.opacity = '0';
      if (closedUrl) closed.src = closedUrl;
      else closed.removeAttribute('src');
    }
    anchor.dataset.boo = String(Boolean(frame.boo));
    anchor.dataset.presence = frame.presence?.phase || 'visible';
    const booNow = document.getElementById('boo-now');
    if (booNow) {
      booNow.disabled = frame.settings.paused || (!frame.settings.booEnabled && !frame.behavior?.cycle) || frame.boo || frame.presence?.phase !== 'visible';
      booNow.title = frame.presence?.phase !== 'visible' ? 'El fantasma saluda cuando está en pantalla.' : frame.settings.paused ? 'Reanuda el recorrido para probar el saludo.' : frame.behavior?.cycle?.reverseAfterRest ? 'Comenzar otro recorrido de 30 segundos.' : frame.behavior?.cycle ? (frame.behavior.cycle.sequence.some(entry=>entry.stage==='lightning') ? 'Adelantar el rayo y la resurrección.' : 'Adelantar la salida de la tierra.') : 'Detenerse y mostrar el globo.';
    }
    const status = document.getElementById('presence-status');
    if (status) {
      const phase = frame.presence?.phase;
      const left = frame.presence?.secondsLeft || 0;
      status.textContent = !frame.settings.presenceEnabled ? 'Siempre visible'
        : phase === 'away' ? `Regresa en ${left} s`
        : phase === 'leaving' ? 'Saliendo de la pantalla…'
        : phase === 'entering' ? 'Regresando…' : `Sale en ${left} s`;
      if (frame.settings.paused) status.textContent += ' · En pausa';
    }
    const badge = document.getElementById('motion-status');
    if (badge) {
      const enabled = frame.settings.desktopEnabled || frame.settings.obsEnabled;
      badge.textContent = !enabled ? 'Oculto' : frame.settings.paused ? 'En pausa'
        : frame.presence?.phase === 'away' ? 'Fuera de pantalla'
        : frame.presence?.phase === 'leaving' ? 'Saliendo'
        : frame.presence?.phase === 'entering' ? 'Regresando'
        : frame.cycle?.reverseAfterRest ? (frame.settings.mode === 'still' ? 'En una esquina' : frame.cycle.stage === 'idle' ? 'Descansando' : 'Caminando lentamente')
        : frame.cycle ? ((frame.behavior.cycle.sequence.some(entry => entry.stage === 'lightning')
          ? {dead:'Esperando el rayo',lightning:'Resucitando',rise:'Se levanta',walk:'Caminata errática',fall:'Se desploma'}
          : {dead:'En la lápida',rise:'Sale de la tierra',walk:'Deambulando',fall:'Vuelve a la tierra'})[frame.cycle.stage])
        : frame.settings.mode === 'still' ? 'En una esquina' : 'En movimiento';
    }
    renderFrame(1 / 30);
    updateVisibility();
  });
  events.addEventListener('error', () => {
    if (disposed || !document.documentElement) return;
    connected = false;
    document.documentElement.dataset.connected = 'false';
    anchor.style.visibility = 'hidden';
    bubble.style.visibility = 'hidden';
  });

  function draw(time) {
    if (disposed) return;
    const dt = Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;
    renderFrame(dt);
    requestAnimationFrame(draw);
  }

  function renderFrame(dt) {
    if (frame) {
      const { settings } = frame;
      const width = preview ? preview.clientWidth : innerWidth;
      const height = preview ? preview.clientHeight : innerHeight;
      // Mismo tamaño relativo en escritorio, lienzo OBS y miniatura del panel.
      const layout = window.AulaLayout.petLayout(width, height, settings, frame, surface);
      if (surface === 'library') {
        layout.size = Math.min(200, width * .72, height * .74);
        layout.scale = layout.size / settings.size;
        layout.x = (width - layout.size) / 2;
        layout.y = (height - layout.size) / 2 + (frame.bob || 0) * layout.scale;
      }
      const { scale, size, x: targetX, y: targetY } = layout;
      const transitioning = frame.presence?.phase && frame.presence.phase !== 'visible';
      if (frame.pixelRoute || x === null || y === null || transitioning || settings.paused || settings.mode === 'still' || frame.boo) { x = targetX; y = targetY; }
      else {
        const smoothing = 1 - Math.exp(-28 * dt);
        x += (targetX - x) * smoothing;
        y += (targetY - y) * smoothing;
      }
      if (!transitioning) x = Math.max(0, Math.min(width - size, x));
      y = Math.max(0, Math.min(height - size, y));
      anchor.style.width = `${size}px`; anchor.style.height = `${size}px`;
      anchor.style.opacity = frame.ghostOpacity?.opacity ?? settings.opacity / 100;
      anchor.dataset.opacityPhase = frame.ghostOpacity?.phase || 'manual';
      anchor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      body.style.transform = `rotate(${frame.tilt || 0}deg) scaleY(${frame.stretch || 1})`;
      const enabled = surface === 'desktop' ? settings.desktopEnabled : settings.obsEnabled;
      cloth.render(frame, !frame.voice && connected && enabled && frame.presence?.phase !== 'away' && imageReady && Boolean(frame.animation?.cloth.enabled), frame.animation?.cloth);
      rig.render(frame, connected && enabled && frame.presence?.phase !== 'away' && imageReady);
      flipbook.render({ ...frame, facing: layout.facing ?? frame.facing }, connected && enabled && frame.presence?.phase !== 'away' && imageReady);
      vehicle.render(frame, connected && enabled && frame.presence?.phase !== 'away' && imageReady);
      voice.render(frame, connected && enabled && frame.presence?.phase !== 'away' && imageReady);
      closed.style.opacity = closedReady ? frame.blink || 0 : 0;
      if (frame.boo) {
        bubble.style.fontSize = `${Math.max(5, Math.min(24 * scale, size * 0.18, width * 0.12, height * 0.12))}px`;
        bubble.style.opacity = settings.opacity / 100;
        const position = window.AulaLayout.bubbleLayout(width, height, { ...layout, x, y }, bubble.offsetWidth, bubble.offsetHeight);
        bubble.dataset.placement = position.placement;
        bubble.style.setProperty('--tail-x', `${position.tailX}px`);
        bubble.style.setProperty('--tail-y', `${position.tailY}px`);
        bubble.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
      }
      updateVisibility();
    }
  }
  requestAnimationFrame(draw);
})();
