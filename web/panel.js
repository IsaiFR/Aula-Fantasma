'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const controls = [...document.querySelectorAll('[data-setting]')];
  let state;
  let toastTimer;
  let displayKey = '';
  let devicesKey = '';
  let settingsQueue = Promise.resolve();
  let timerQueue = Promise.resolve();
  let timerState;
  let inspectorOverride = null;
  let renderedInspector;
  let inspectorRequest = 0;
  const timerPresets = [...document.querySelectorAll('[data-timer-seconds]')];
  const inspectorCopy = {
    voice: ['Mascota de voz', 'Elige la esquina y calibra el micrófono.'],
    companion: ['Mascota de recorrido', 'Configura el movimiento y el saludo.'],
    timer: ['Cronómetro', 'Cuenta regresiva para las actividades.'],
    outputs: ['Salidas', 'Conecta OBS y elige dónde aparecen tus mascotas.']
  };

  function renderInspector() {
    if (!state) return;
    const pane = inspectorOverride || state.activeType;
    if (pane === renderedInspector) return;
    renderedInspector = pane;
    for (const key of Object.keys(inspectorCopy)) {
      $('edit-' + key).setAttribute('aria-pressed', String(pane === key));
      $('mode-' + key)?.classList.toggle('editing', pane === key);
    }
    const [title, description] = inspectorCopy[pane];
    $('configuration-title').textContent = title;
    $('configuration-description').textContent = description;
    $('pet-settings').hidden = pane !== 'voice' && pane !== 'companion';
    $('timer-settings').hidden = pane !== 'timer';
    $('output-settings').hidden = pane !== 'outputs';
    document.querySelector('.panel-body').scrollTop = 0;
  }

  function showInspectorOnCompactLayout() {
    if (!matchMedia('(max-width: 820px)').matches) return;
    $('configuration-title').focus({ preventScroll: true });
    $('inspector').scrollIntoView({ block: 'start' });
  }
  function applyTimer(timer) {
    if (!timer) return;
    timerState = timer;
    $('timer-desktop').checked = timer.desktopEnabled;
    const format = window.AulaTime.formatTime;
    if (document.activeElement !== $('timer-duration')) $('timer-duration').value = format(timer.seconds);
    for (const key of ['x', 'y']) if (document.activeElement !== $(`timer-${key}`)) $(`timer-${key}`).value = String(timer[key]);
    for (const id of ['timer-duration', 'timer-minus', 'timer-plus', 'timer-start', 'timer-position']) $(id).disabled = timer.active;
    $('timer-minus').disabled ||= timer.seconds <= 10;
    $('timer-plus').disabled ||= timer.seconds >= 5999;
    $('timer-stop').disabled = !timer.active && timer.phase !== 'position';
    $('timer-position').setAttribute('aria-pressed', String(timer.phase === 'position'));
    $('timer-position').textContent = timer.phase === 'position' ? 'Ocultar posición' : 'Mostrar posición';
    const { phase, seconds, remaining, ready, active, visible } = timer;
    const running = phase === 'running';
    const done = phase === 'finished' || phase === 'done';
    const readout = format(running ? remaining : done ? 0 : seconds);
    const display = phase === 'ready' ? String(ready) : readout;
    const message = running ? (visible ? 'Visible en OBS' : 'Oculto en OBS · el tiempo sigue corriendo')
      : ({ ready: 'La actividad está por iniciar', finished: '¡Tiempo terminado!', done: 'Actividad finalizada', position: 'Posición visible en la escena' })[phase] || 'Listo para iniciar';
    const label = phase === 'ready' ? 'Preparación' : running || done ? 'Tiempo restante' : 'Duración';
    if ($('timer-display-label').textContent !== label) $('timer-display-label').textContent = label;
    if ($('timer-display').textContent !== display) $('timer-display').textContent = display;
    $('timer-console').style.setProperty('--progress', (running ? 100 * remaining / seconds : done ? 0 : 100) + '%');
    const layerStatus = done ? 'Finalizado' : phase === 'ready' ? 'Preparación' : readout;
    if ($('timer-layer-state').textContent !== layerStatus) $('timer-layer-state').textContent = layerStatus;
    $('mode-timer').dataset.active = String(active);
    timerPresets.forEach(button => {
      button.disabled = active;
      button.setAttribute('aria-pressed', String(Number(button.dataset.timerSeconds) === seconds));
    });
    if ($('timer-status').textContent !== message) $('timer-status').textContent = message;
  }
  window.addEventListener('aula:countdown-frame', event => applyTimer(event.detail));
  function timerAction(action, patch) {
    timerQueue = timerQueue.then(() => window.aula.countdown(action, patch)).then(apply).catch(() => toast('No se pudo actualizar el temporizador.'));
    return timerQueue;
  }
  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').classList.remove('visible'); $('toast').textContent = ''; }, 4500);
  }
  function apply(next) {
    state = next;
    $('inspector').setAttribute('aria-busy', 'false');
    applyTimer(next.countdown);
    $('timer-x').max = Math.max(0, next.canvas.width - 320);
    $('timer-y').max = Math.max(0, next.canvas.height - 156);
    const portrait = next.canvas.format === '9:16';
    $('preview').classList.toggle('portrait', portrait);
    $('canvas-landscape').setAttribute('aria-pressed', String(!portrait));
    $('canvas-portrait').setAttribute('aria-pressed', String(portrait));
    const dimensions = next.canvas.width + ' × ' + next.canvas.height;
    $('canvas-dimensions').textContent = dimensions;
    $('obs-dimensions').textContent = 'Lienzo ' + next.canvas.format + ' · ' + dimensions + ' px. Usa una fuente por formato.';
    const isVoice = next.activeType === 'voice';
    const ghostOpacity = isVoice && Boolean(next.effects?.ghostOpacity);
    $('ghost-opacity-card').hidden = !ghostOpacity;
    $('manual-opacity-controls').hidden = ghostOpacity;
    $('opacity').disabled = ghostOpacity;
    $('ghostSolidSeconds').disabled = $('ghostFadedSeconds').disabled = !ghostOpacity;
    const draculaBat = isVoice && Boolean(next.effects?.draculaBat);
    $('dracula-bat-card').hidden = !draculaBat;
    $('draculaBatEnabled').disabled = !draculaBat;
    $('draculaSeconds').disabled = $('draculaBatSeconds').disabled = !draculaBat || !next.settings.draculaBatEnabled;
    for (const type of ['voice', 'companion']) {
      const { name, id } = next.companions[type];
      const assetUrl = '/asset?slot=' + type + '&v=' + encodeURIComponent(id);
      $(type + '-choice-name').textContent = name;
      $(type + '-choice-name').title = name;
      const image = $(type + '-thumbnail');
      if (image.getAttribute('src') !== assetUrl) image.src = assetUrl;
    }
    const selected = next.companions[next.activeType];
    $('selected-pet-name').textContent = selected.name;
    if ($('selected-pet-thumbnail').getAttribute('src') !== next.assetUrl) $('selected-pet-thumbnail').src = next.assetUrl;
    $('choose-voice').hidden = !isVoice;
    $('choose-companion').hidden = isVoice;
    $('class-preset').hidden = isVoice;
    $('adjustment-label').textContent = isVoice ? 'Tamaño y posición' : 'Recorrido y tamaño';
    $('corner-field').hidden = !isVoice;
    document.querySelector('.character-card').hidden = isVoice;
    document.querySelector('.presence-card').hidden = isVoice;
    document.querySelector('.preview-toolbar').hidden = isVoice;
    document.querySelector('label[for="mode"]').hidden = $('mode').hidden = isVoice;
    $('speed').hidden = $('speed').previousElementSibling.hidden = $('speed').nextElementSibling.hidden = isVoice;
    const key = JSON.stringify(next.displays);
    if (key !== displayKey) {
      displayKey = key;
      $('monitor').replaceChildren();
      const primary = new Option('Monitor principal (automático)', 'primary');
      $('monitor').add(primary);
      next.displays.forEach(display => $('monitor').add(new Option(`${display.name} · ${display.width} × ${display.height}`, display.id)));
    }
    const microphones = next.microphone?.devices || [];
    const newDevicesKey = JSON.stringify([microphones, next.settings.micDeviceId]);
    if (newDevicesKey !== devicesKey) {
      devicesKey = newDevicesKey;
      $('micDeviceId').replaceChildren(new Option('Predeterminado del sistema', 'default'));
      microphones.filter(d => d.id && d.id !== 'default').forEach(d => $('micDeviceId').add(new Option(d.label, d.id)));
      if (![...$('micDeviceId').options].some(option => option.value === next.settings.micDeviceId)) $('micDeviceId').add(new Option('Micrófono guardado (no disponible)', next.settings.micDeviceId));
    }
    controls.forEach(control => {
      const value = next.settings[control.dataset.setting];
      if (control.type === 'checkbox') control.checked = value;
      else if (control.type !== 'number' || document.activeElement !== control) control.value = String(value);
    });
    if ($('monitor').selectedIndex === -1) $('monitor').value = 'primary';
    $('pause').textContent = next.settings.paused ? 'Reanudar' : 'Pausar';
    $('preview-status').textContent = !next.settings.obsEnabled ? 'Mascotas ocultas en OBS'
      : !next.settings.voiceEnabled && !next.settings.companionEnabled ? 'Sin mascotas visibles' : 'Salida transparente';
    $('obs-url').value = next.obsUrl;
    $('obs-status').textContent = next.connections > 0 ? `${next.connections} ${next.connections === 1 ? 'conexión' : 'conexiones'}` : 'OBS sin conectar';
    $('obs-status').className = `badge ${next.connections ? 'connected' : 'neutral'}`;
    $('connection-detail').textContent = next.connections > 0
      ? 'OBS está recibiendo la fuente.'
      : 'La URL está disponible mientras Aula Fantasma esté abierta.';
    const patrol = Boolean(next.behavior.cycle?.reverseAfterRest);
    $('shortcut-warning').hidden = next.shortcutsAvailable;
    $('speed').disabled = next.settings.mode === 'still';
    $('booInterval').disabled = !next.settings.booEnabled;
    $('visibleSeconds').disabled = $('awaySeconds').disabled = !next.settings.presenceEnabled;
    $('voice-card').hidden = next.petKind !== 'voice';
    $('mic-status').textContent = ({ off: 'Micrófono apagado.', starting: 'Conectando micrófono…', active: 'Escuchando · análisis local.', denied: 'Acceso denegado. Permite el micrófono para apps de escritorio en Configuración de Windows y reintenta.', missing: 'No se encontró ese micrófono. Elige otro o conecta uno y reintenta.', disconnected: 'El micrófono se desconectó. Reconéctalo y reintenta.', error: 'No se pudo iniciar el micrófono. Revisa el dispositivo y reintenta.' })[next.microphone?.status] || 'Micrófono apagado.';
    controls.filter(control => control.type === 'number').forEach(control => {
      control.disabled = $(control.dataset.setting).disabled;
    });
    const cycle = Boolean(next.behavior.cycle);
    const walkingOnly = cycle && next.behavior.cycle.sequence.every(entry => entry.stage === 'walk');
    $('boo-now').disabled = next.settings.paused || (!next.settings.booEnabled && !cycle);
    $('greeting-toggle-label').closest('label').hidden = cycle;
    $('booInterval').closest('details').hidden = cycle;
    $('patrol-description').hidden = !patrol;
    $('boo-now').closest('.character-card').querySelector('.eyebrow').textContent = patrol || walkingOnly ? 'CAMINATA' : cycle ? 'RESURRECCIÓN' : 'EL SALUDO';
    const greeting = next.behavior.greeting.text;
    $('greeting-toggle-label').textContent = `Detenerse y decir ${greeting}`;
    $('boo-now').textContent = patrol || walkingOnly ? 'Reiniciar ciclo' : cycle ? 'Resucitar ahora' : `${greeting} ahora`;
    $('boo-now').title = next.settings.paused ? 'Reanuda el recorrido para probar el saludo.' : cycle ? (next.behavior.cycle.sequence.some(entry=>entry.stage==='lightning') ? 'Adelantar el rayo y la resurrección.' : 'Adelantar la salida de la tierra.') : 'Detenerse y mostrar el globo.';
    if (walkingOnly) $('boo-now').title = 'Volver al primer paso de la caminata.';
    renderInspector();
  }

  function update(patch) {
    if (!state) return;
    const type = state.activeType;
    settingsQueue = settingsQueue.then(() => window.aula.setSettings(patch, type)).then(apply).catch(() => toast('No se pudo aplicar el cambio. Inténtalo otra vez.'));
  }
  controls.forEach(control => control.addEventListener(control.type === 'range' ? 'input' : 'change', () => {
    let value = control.type === 'checkbox' ? control.checked : ['range', 'number'].includes(control.type) ? control.valueAsNumber : control.value;
    if (control.type === 'number') {
      if (!Number.isFinite(value)) { control.value = String(state.settings[control.dataset.setting]); return; }
      value = Math.round(Math.max(Number(control.min), Math.min(Number(control.max), value)));
      control.value = String(value);
    }
    if (['range', 'number'].includes(control.type)) {
      controls.filter(other => other !== control && other.dataset.setting === control.dataset.setting).forEach(other => { other.value = String(value); });
    }
    update({ [control.dataset.setting]: value });
  }));
  controls.filter(control => control.type === 'number').forEach(control => {
    control.addEventListener('focus', () => control.select());
    control.addEventListener('keydown', event => {
      if (event.key === 'Escape') control.value = String(state.settings[control.dataset.setting]);
      if (event.key === 'Enter' || event.key === 'Escape') { event.preventDefault(); control.blur(); }
    });
  });
  $('pause').addEventListener('click', () => update({ paused: !state.settings.paused }));
  timerPresets.forEach(button => button.addEventListener('click', () => timerAction('configure', { seconds: Number(button.dataset.timerSeconds) })));
  $('preview-background').addEventListener('click', () => {
    const light = $('preview').classList.toggle('light');
    $('preview-background').setAttribute('aria-pressed', String(light));
  });
  for (const pane of ['timer', 'outputs']) $('edit-' + pane).addEventListener('click', () => {
    inspectorRequest++;
    inspectorOverride = pane;
    renderInspector();
    showInspectorOnCompactLayout();
  });
  $('timer-duration').addEventListener('change', () => {
    const seconds = window.AulaTime.parseTime($('timer-duration').value);
    if (!Number.isFinite(seconds) || seconds < 10 || seconds > 5999) {
      $('timer-duration').value = window.AulaTime.formatTime(timerState.seconds);
      toast('Escribe un tiempo entre 0:10 y 99:59, o entre 10 y 5999 segundos.');
      return;
    }
    timerAction('configure', { seconds });
  });
  for (const id of ['timer-duration', 'timer-x', 'timer-y']) $(id).addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      $(id).value = id === 'timer-duration' ? window.AulaTime.formatTime(timerState.seconds) : timerState[id.slice(-1)];
    }
    if (event.key === 'Enter' || event.key === 'Escape') { event.preventDefault(); $(id).blur(); }
  });
  for (const [id, delta] of [['timer-minus', -10], ['timer-plus', 10]]) $(id).addEventListener('click', () => {
    timerQueue = timerQueue.then(() => window.aula.countdown('configure', { seconds: Math.min(5999, Math.max(10, timerState.seconds + delta)) })).then(apply).catch(() => toast('No se pudo cambiar la duración.'));
  });
  for (const key of ['x', 'y']) $(`timer-${key}`).addEventListener('change', () => {
    const input = $(`timer-${key}`), value = input.valueAsNumber;
    if (!Number.isFinite(value)) { input.value = String(timerState[key]); return; }
    const clamped = Math.round(Math.max(0, Math.min(Number(input.max), value)));
    input.value = String(clamped);
    timerAction('configure', { [key]: clamped });
  });
  for (const action of ['start', 'stop', 'position']) $(`timer-${action}`).addEventListener('click', () => timerAction(action));
  $('timer-desktop').addEventListener('change', () => timerAction('configure', { desktopEnabled: $('timer-desktop').checked }));
  $('class-preset').addEventListener('click', () => {
    update({ mode: 'edges', size: 140, speed: 45, margin: 24, paused: false });
    toast('Modo clase: recorrido tranquilo por los bordes.');
  });
  function action(id, callback) {
    $(id).addEventListener('click', async () => {
      $(id).disabled = true;
      try { await callback(); }
      catch { toast('No se pudo completar la acción. Inténtalo otra vez.'); }
      finally { $(id).disabled = false; }
    });
  }
  action('reset-position', async () => apply(await window.aula.resetPosition()));
  action('boo-now', async () => apply(await window.aula.booNow()));
  action('copy-url', async () => { await window.aula.copyUrl(); toast('Dirección de OBS copiada.'); });
  action('open-guide', async () => { const error = await window.aula.openGuide(); if (error) toast('No se pudo abrir la guía. Está en la carpeta de la app.'); });
  action('quit', () => window.aula.quit());
  action('export-pet', async () => { const result = await window.aula.exportPet(); if (result.error) toast(result.error); else if (result.saved) toast(`Mascota guardada: ${result.name}`); });
  action('mic-retry', async () => { await window.aula.setSettings({ micEnabled: false }); apply(await window.aula.setSettings({ micEnabled: true })); });
  for (const type of ['voice', 'companion']) {
    action('edit-' + type, async () => {
      const request = ++inspectorRequest;
      const operation = settingsQueue.then(() => window.aula.editType(type));
      settingsQueue = operation.catch(() => {});
      const next = await operation;
      if (request === inspectorRequest) inspectorOverride = null;
      apply(next);
      if (request === inspectorRequest) showInspectorOnCompactLayout();
    });
    action('choose-' + type, async () => {
      await settingsQueue;
      await window.aula.editType(type);
      await window.aula.openPetSelector();
    });
  }
  for (const [id, format] of [['canvas-landscape', '16:9'], ['canvas-portrait', '9:16']]) action(id, async () => {
    const operation = settingsQueue.then(() => window.aula.setCanvasFormat(format)).then(apply);
    settingsQueue = operation.catch(() => {});
    await operation;
  });
  window.aula.onState(apply);
  window.aula.getState().then(next => {
    apply(next);
    if (sessionStorage.getItem('focus-layer-on-return')) {
      sessionStorage.removeItem('focus-layer-on-return');
      $('edit-' + next.activeType).focus({ preventScroll: true });
    }
  }).catch(() => toast('No se pudo cargar la app. Cierra y vuelve a abrir Aula Fantasma.'));
})();
