'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const controls = [...document.querySelectorAll('[data-setting]')];
  let state;
  let toastTimer;
  let displayKey = '';
  let devicesKey = '';
  let settingsQueue = Promise.resolve();
  function fitPortraitPreview() {
    const stage = $('preview');
    if (!stage.classList.contains('portrait')) return;
    const top = stage.getBoundingClientRect().top + scrollY;
    stage.style.setProperty('--portrait-height', `${Math.max(200, innerHeight - top - 28)}px`);
  }
  window.addEventListener('resize', fitPortraitPreview);

  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').classList.remove('visible'); $('toast').textContent = ''; }, 4500);
  }
  function apply(next) {
    state = next;
    const portrait = next.canvas.format === '9:16';
    $('preview').classList.toggle('portrait', portrait);
    $('preview').style.aspectRatio = portrait ? '9 / 16' : '16 / 9';
    $('canvas-landscape').setAttribute('aria-pressed', String(!portrait));
    $('canvas-portrait').setAttribute('aria-pressed', String(portrait));
    $('canvas-dimensions').textContent = `${next.canvas.width} × ${next.canvas.height} · ajustes guardados por formato`;
    $('obs-dimensions').textContent = `Fuente Navegador ${next.canvas.format}: ${next.canvas.width} × ${next.canvas.height}. Crea una fuente distinta por formato.`;
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
      $(`mode-${type}`).classList.toggle('editing', next.activeType === type);
      $(`edit-${type}`).setAttribute('aria-pressed', String(next.activeType === type));
      $(`${type}-choice-name`).textContent = next.companions[type].name;
    }
    $('configuration-title').textContent = isVoice ? 'Configurar voz en una esquina' : 'Configurar recorrido y saludo';
    $('adjustment-label').textContent = isVoice ? 'TAMAÑO Y POSICIÓN' : 'EL RECORRIDO';
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
    $('pause').textContent = next.settings.paused ? 'Reanudar recorrido' : 'Pausar recorrido';
    const enabled = next.settings.obsEnabled || next.settings.desktopEnabled;
    $('motion-status').textContent = !enabled ? 'Oculto' : next.settings.paused ? 'En pausa' : next.settings.mode === 'still' ? 'En una esquina' : 'En movimiento';
    $('obs-url').value = next.obsUrl;
    $('obs-status').textContent = next.connections > 0 ? `${next.connections} ${next.connections === 1 ? 'conexión' : 'conexiones'}` : 'Sin conectar';
    $('obs-status').className = `badge ${next.connections ? 'connected' : 'neutral'}`;
    $('connection-detail').textContent = next.connections > 0
      ? 'La fuente está conectada. Comprueba su visibilidad en la vista previa de OBS.'
      : 'La dirección estará disponible mientras la app permanezca abierta.';
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
    $('boo-now').disabled = next.settings.paused || (!next.settings.booEnabled && !cycle);
    $('greeting-toggle-label').closest('label').hidden = cycle;
    $('booInterval').closest('details').hidden = cycle;
    $('patrol-description').hidden = !patrol;
    $('boo-now').closest('.character-card').querySelector('.eyebrow').textContent = patrol ? 'CAMINATA' : cycle ? 'RESURRECCIÓN' : 'EL SALUDO';
    const greeting = next.behavior.greeting.text;
    $('greeting-toggle-label').textContent = `Detenerse y decir ${greeting}`;
    $('boo-now').textContent = patrol ? 'Reiniciar ciclo' : cycle ? 'Resucitar ahora' : `${greeting} ahora`;
    $('boo-now').title = next.settings.paused ? 'Reanuda el recorrido para probar el saludo.' : cycle ? (next.behavior.cycle.sequence.some(entry=>entry.stage==='lightning') ? 'Adelantar el rayo y la resurrección.' : 'Adelantar la salida de la tierra.') : 'Detenerse y mostrar el globo.';
    fitPortraitPreview();
  }

  function update(patch) {
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
    action(`edit-${type}`, async () => { await settingsQueue; apply(await window.aula.editType(type)); });
    action(`choose-${type}`, async () => { await settingsQueue; await window.aula.editType(type); await window.aula.openPetSelector(); });
  }
  for (const [id, format] of [['canvas-landscape', '16:9'], ['canvas-portrait', '9:16']]) action(id, async () => {
    const operation = settingsQueue.then(() => window.aula.setCanvasFormat(format)).then(apply);
    settingsQueue = operation.catch(() => {});
    await operation;
  });
  window.aula.onState(apply);
  window.aula.getState().then(apply).catch(() => toast('No se pudo cargar la app. Cierra y vuelve a abrir Aula Fantasma.'));
})();
