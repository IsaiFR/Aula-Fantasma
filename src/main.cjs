'use strict';

const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, clipboard, dialog, shell, globalShortcut } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { DEFAULTS, sanitizeSettings } = require('./settings.cjs');
const { Motion } = require('./motion.cjs');
const { startServer } = require('./server.cjs');
const { MAX_FILE, MAX_IMAGE, parsePet, serializePet, fromImage, petId, safeFilename } = require('./pet-package.cjs');
const { bundledUpdate } = require('./pet-updates.cjs');
const { flipbookFrame } = require('./flipbook.cjs');
const { gifInfo } = require('./gif.cjs');
const { loadLibrary } = require('./pet-library.cjs');
const { VoiceGate } = require('./voice.cjs');
const { canvasInfo, isCanvasFormat } = require('./canvas.cjs');
const { ghostOpacityFrame } = require('./ghost-opacity.cjs');
const { draculaBatFrame } = require('./dracula-bat.cjs');

const root = path.join(__dirname, '..');
const webRoot = path.join(root, 'web');
const smoke = process.argv.includes('--smoke-test');
if (smoke && process.argv.includes('--smoke-voice') && !process.argv.includes('--real-microphone')) app.commandLine.appendSwitch('use-fake-device-for-media-stream');
const smokeRoot = app.isPackaged ? path.join(path.dirname(app.getPath('exe')), '.smoke-data') : path.join(root, '.smoke-data');
if (smoke) app.setPath('userData', smokeRoot);
app.setName('Aula Fantasma');
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();

let panel, desktop, tray, server, timer, microphoneWindow;
const voiceGate = new VoiceGate();
let micStatus = 'off', micDevices = [];
function microphoneConfig() { return { enabled: Boolean(voiceSettings.micEnabled && settings.voiceEnabled && voicePet), deviceId: voiceSettings.micDeviceId }; }
function syncMicrophone() {
  const config = microphoneConfig();
  if (!config.enabled) { voiceGate.reset(); micStatus = 'off'; }
  if (microphoneWindow && !microphoneWindow.isDestroyed()) microphoneWindow.webContents.send('aula:mic-config', config);
}
function voiceFrame(candidate, simulation, suffix = '', preview = false) {
  if (candidate.kind !== 'voice') return null;
  return {
    ...(preview ? { speaking: simulation.elapsed % 3 < 1.2, level: 0 } : voiceGate.frame(performance.now(), { ...voiceSettings, micEnabled: microphoneConfig().enabled && micStatus === 'active' })),
    blinking: simulation.blinkRemaining > 0,
    status: micStatus,
    urls: Object.fromEntries([['open', 'asset'], ['closed', 'asset-closed'], ['talking', 'asset-talking'], ['talkingClosed', 'asset-talking-closed'], ['bat', 'asset-bat'], ['batOpen', 'asset-bat-open'], ['batClosed', 'asset-bat-closed'], ['batTalkingClosed', 'asset-bat-talking-closed']].map(([kind, route]) => [kind, candidate.images[kind] ? `/${route}${suffix}` : null]))
  };
}
let quitting = false;
let settings = { ...DEFAULTS };
let canvasFormat = '16:9', canvasRevision = 0, canvasProfiles = {};
const canvasPetCache = new Map();
const AUDIO_SETTINGS = ['micEnabled', 'micDeviceId', 'micThreshold', 'micRelease'];
const audioSettings = () => Object.fromEntries(AUDIO_SETTINGS.map(key => [key, voiceSettings[key]]));
function captureCanvasProfile() { return { settings: { ...settings }, petFile: selectedPetFile, petKey: petId(pet), voice: { settings: { ...voiceSettings }, petFile: voiceSelectedFile, petKey: petId(voicePet) }, activeType }; }
let pet;
let voicePet, voiceSelectedFile = null, voiceRevision = 0, activeType = 'companion';
const voiceMotion = new Motion();
let ghostOpacityStart = 0;
let draculaBatStart = 0;
let voiceSettings = { ...DEFAULTS, mode: 'still', size: 256, presenceEnabled: false, booEnabled: false };
const GLOBAL_SETTINGS = ['desktopEnabled', 'obsEnabled', 'displayId', 'voiceEnabled', 'companionEnabled'];
const currentPet = () => activeType === 'voice' ? voicePet : pet;
const currentSettings = () => activeType === 'voice' ? { ...voiceSettings, ...Object.fromEntries(GLOBAL_SETTINGS.map(key => [key, settings[key]])) } : settings;
let selectedPetFile = null;
let petRevision = 0;
let settingsTimer;
let library = { entries: new Map(), unavailable: 0 };
const rendererErrors = [];
const motion = new Motion();
const paths = () => ({ settings: path.join(app.getPath('userData'), 'settings.json'), assets: path.join(app.getPath('userData'), 'assets'), pets: path.join(app.getPath('userData'), 'pets') });

function builtinPet() { return parsePet(fs.readFileSync(path.join(root, 'pets', 'EduGhost.aulapet'))); }
function activateVoicePet(candidate, persist = true) {
  const update = bundledUpdate(petId(candidate));
  if (update?.endsWith('.pet')) candidate = parsePet(fs.readFileSync(path.join(root, 'pets', update)));
  validateImages(candidate);
  if (candidate.kind !== 'voice') throw new Error('Elige una mascota de voz .pet.');
  let file = null;
  if (persist) {
    fs.mkdirSync(paths().pets, { recursive: true });
    file = `${petId(candidate)}.pet`;
    const target = path.join(paths().pets, file);
    fs.writeFileSync(`${target}.tmp`, serializePet(candidate)); fs.renameSync(`${target}.tmp`, target);
  }
  voicePet = candidate; voiceSelectedFile = file; voiceRevision++;
  ghostOpacityStart = voiceMotion.elapsed;
  draculaBatStart = voiceMotion.elapsed;
  canvasPetCache.set(petId(candidate), candidate);
  voiceGate.reset(); voiceMotion.setAnimation(candidate.animation); voiceMotion.setBehavior(candidate.behavior); syncMicrophone();
}
function validateImages(candidate) {
  let openSize, batSize;
  for (const [kind, resource] of Object.entries(candidate.images)) {
    let size;
    if (resource.mime === 'image/gif') size = gifInfo(resource.bytes);
    else {
      const decoded = nativeImage.createFromBuffer(resource.bytes);
      if (decoded.isEmpty()) throw new Error('No se pudo leer una imagen de la mascota.');
      size = decoded.getSize();
    }
    if (size.width > 8192 || size.height > 8192) throw new Error('Las imágenes no deben superar 8192 píxeles por lado.');
    if (candidate.behavior?.flipbook) {
      const config = candidate.behavior.flipbook;
      if (['walk', 'greeting'].includes(kind) && (size.width !== config.size || size.height !== config.size)) throw new Error('El tamaño del GIF no coincide con su perfil.');
      if (kind === 'walk' && size.frames !== config.walkFrames || kind === 'greeting' && size.frames !== config.raiseFrames * 2 - 1) throw new Error('El GIF no coincide con el número de fotogramas de su perfil.');
      if (kind === 'frames' && (size.width !== config.size * config.columns || size.height !== config.size * config.rows)) throw new Error('La hoja de fotogramas no coincide con su perfil.');
    }
    if (candidate.behavior?.cycle) {
      const config = candidate.behavior.cycle;
      if (kind === 'cycle' && (size.width !== config.size || size.height !== config.size || size.frames !== config.sequence.length)) throw new Error('El GIF no coincide con el ciclo.');
      if (kind === 'frames' && (size.width !== config.size * config.columns || size.height !== config.size * config.rows)) throw new Error('La hoja no coincide con el ciclo.');
    }
    if (kind === 'open') openSize = size;
    else if (!kind.startsWith('bat') && (kind === 'closed' || candidate.kind === 'voice') && (size.width !== openSize.width || size.height !== openSize.height)) throw new Error('Las imágenes de la mascota deben tener el mismo tamaño.');
    if (kind === 'bat') batSize = size;
    else if (kind.startsWith('bat') && (!batSize || size.width !== batSize.width || size.height !== batSize.height)) throw new Error('Las cuatro poses del murciélago deben tener el mismo tamaño.');
  }
}
function activatePet(candidate, persist = true, applyPreset = true) {
  if (candidate.kind === 'voice') { activateVoicePet(candidate, persist); activeType = 'voice'; return; }
  validateImages(candidate);
  activeType = 'companion';
  let file = null;
  if (persist) {
    if (applyPreset && candidate.kind === 'voice') settings = sanitizeSettings({ mode: 'still', presenceEnabled: false, booEnabled: false }, settings);
    if (applyPreset && candidate.behavior?.vehicle && candidate.name === 'EduF1' && petId(candidate) === petId(parsePet(fs.readFileSync(path.join(root, 'pets', 'EduF1.aulapet'))))) {
      settings = sanitizeSettings({ size: 300, speed: 130, mode: 'free', presenceEnabled: false, booEnabled: false }, settings);
    }
    if (applyPreset && candidate.behavior?.cycle?.reverseAfterRest && candidate.name === 'EduPiramyd') {
      settings = sanitizeSettings({ size: 256, speed: 18, mode: 'edges', presenceEnabled: false, booEnabled: false }, settings);
    }
    if (applyPreset && candidate.behavior?.cycle && candidate.name === 'EduFrankenstein' && petId(candidate) === petId(parsePet(fs.readFileSync(path.join(root, 'pets', 'EduFrankenstein.aulapet'))))) {
      settings = sanitizeSettings({ size: 256, speed: 55, mode: 'free', presenceEnabled: false, booEnabled: false }, settings);
    }
    if (applyPreset && candidate.behavior?.cycle && candidate.name === 'EduZombie' && petId(candidate) === petId(parsePet(fs.readFileSync(path.join(root, 'pets', 'EduZombie.aulapet'))))) {
      settings = sanitizeSettings({ size: 256, speed: 22, mode: 'free', presenceEnabled: false, booEnabled: false }, settings);
    }
    if (candidate.behavior?.flipbook && candidate.name === 'EduScream' && petId(candidate) === petId(parsePet(fs.readFileSync(path.join(root, 'pets', 'EduScream.aulapet'))))) {
      settings = sanitizeSettings({ size: 180, speed: 30, booInterval: 30, booEnabled: true, presenceEnabled: false }, settings);
    }
    fs.mkdirSync(paths().pets, { recursive: true });
    file = `${petId(candidate)}.${candidate.kind === 'voice' ? 'pet' : 'aulapet'}`;
    const target = path.join(paths().pets, file);
    fs.writeFileSync(`${target}.tmp`, serializePet(candidate)); fs.renameSync(`${target}.tmp`, target);
  }
  pet = candidate; selectedPetFile = file; petRevision++;
  canvasPetCache.set(petId(candidate), candidate);
  motion.setAnimation(pet.animation);
  motion.setBehavior(pet.behavior);
}

function loadPreferences() {
  canvasFormat = '16:9'; canvasProfiles = {};
  canvasPetCache.clear();
  fs.mkdirSync(paths().pets, { recursive: true });
  voiceSettings = { ...DEFAULTS, mode: 'still', size: 256, presenceEnabled: false, booEnabled: false };
  activateVoicePet(parsePet(fs.readFileSync(path.join(root, 'pets', 'EduWitch-Voz.pet'))), false);
  activatePet(builtinPet(), false);
  try {
    let saved = JSON.parse(fs.readFileSync(paths().settings, 'utf8'));
    if (saved.schemaVersion === 5) {
      canvasFormat = isCanvasFormat(saved.canvasFormat) ? saved.canvasFormat : '16:9';
      for (const format of ['16:9', '9:16']) if (saved.canvasProfiles?.[format] && typeof saved.canvasProfiles[format] === 'object') canvasProfiles[format] = saved.canvasProfiles[format];
      const audio = saved.voice?.settings;
      saved = { ...(canvasProfiles[canvasFormat] || saved), schemaVersion: 4 };
      saved.voice = { ...saved.voice, settings: { ...saved.voice?.settings, ...Object.fromEntries(AUDIO_SETTINGS.filter(key => audio && Object.hasOwn(audio, key)).map(key => [key, audio[key]])) } };
    }
    settings = sanitizeSettings(saved.settings);
    if ([3, 4].includes(saved.schemaVersion) && typeof saved.petFile === 'string' && /^[a-f0-9]{64}\.(pet|aulapet)$/.test(saved.petFile)) {
      const source = path.join(paths().pets, saved.petFile);
      if (fs.statSync(source).size > MAX_FILE) throw new Error('Mascota demasiado grande.');
      const candidate = parsePet(fs.readFileSync(source));
      if (petId(candidate) !== path.basename(saved.petFile, path.extname(saved.petFile))) throw new Error('La mascota guardada cambió.');
      const update = bundledUpdate(petId(candidate));
      if (update) {
        activatePet(parsePet(fs.readFileSync(path.join(root, 'pets', update))), true, !['EduFrankenstein.aulapet', 'EduPiramyd.aulapet', 'EduZombie.aulapet'].includes(update));
        scheduleSave();
      } else {
        activatePet(candidate, false);
        if (candidate.kind === 'voice') {
          voiceSelectedFile = saved.petFile;
          voiceSettings = { ...sanitizeSettings(saved.settings), mode: 'still', paused: false, presenceEnabled: false, booEnabled: false };
          settings = sanitizeSettings(Object.fromEntries(GLOBAL_SETTINGS.map(key => [key, settings[key]])));
        } else selectedPetFile = saved.petFile;
      }
      if (candidate.kind === 'voice' && update) {
        voiceSettings = { ...sanitizeSettings(saved.settings), mode: 'still', paused: false, presenceEnabled: false, booEnabled: false };
        settings = sanitizeSettings(Object.fromEntries(GLOBAL_SETTINGS.map(key => [key, settings[key]])));
      }
    } else if (saved.schemaVersion === 2 && saved.asset && ['png', 'webp', 'gif'].includes(saved.asset.extension)) {
      const imagePath = path.join(paths().assets, `pet.${saved.asset.extension}`);
      if (fs.existsSync(imagePath) && fs.statSync(imagePath).size <= MAX_IMAGE) activatePet(fromImage(fs.readFileSync(imagePath), saved.asset.name || 'Mascota'));
    }
    if (saved.schemaVersion === 4) {
      voiceSettings = { ...sanitizeSettings(saved.voice?.settings, voiceSettings), mode: 'still', paused: false, presenceEnabled: false, booEnabled: false };
      try {
        const file = saved.voice?.petFile;
        if (typeof file === 'string' && /^[a-f0-9]{64}\.pet$/.test(file)) {
          const source = path.join(paths().pets, file);
          if (fs.statSync(source).size > MAX_FILE) throw new Error('Mascota demasiado grande.');
          const candidate = parsePet(fs.readFileSync(source));
          if (petId(candidate) !== path.basename(file, '.pet')) throw new Error('La mascota guardada cambió.');
          const update = bundledUpdate(petId(candidate));
          if (update) activateVoicePet(parsePet(fs.readFileSync(path.join(root, 'pets', update))), true);
          else { activateVoicePet(candidate, false); voiceSelectedFile = file; }
        }
      } catch { /* Conservar la mascota de voz incluida si su copia ya no existe. */ }
      activeType = saved.activeType === 'voice' ? 'voice' : 'companion';
    }
  } catch { /* Primera ejecución o preferencias no válidas: usar valores por defecto. */ }
  syncMicrophone();
  canvasProfiles[canvasFormat] = captureCanvasProfile();
}

function profilePet(profile, kind) {
  const key = profile?.petKey;
  if (canvasPetCache.has(key)) {
    const candidate = canvasPetCache.get(key);
    if ((candidate.kind || 'companion') !== kind) throw new Error('El tipo de mascota guardada cambió.');
    return { pet: candidate, file: profile.petFile || null };
  }
  const file = profile?.petFile, extension = kind === 'voice' ? 'pet' : 'aulapet';
  if (typeof file === 'string' && new RegExp(`^[a-f0-9]{64}\\.${extension}$`).test(file)) {
    const source = path.join(paths().pets, file);
    if (fs.statSync(source).size > MAX_FILE) throw new Error('Mascota demasiado grande.');
    let candidate = parsePet(fs.readFileSync(source));
    if (petId(candidate) !== path.basename(file, `.${extension}`) || (candidate.kind || 'companion') !== kind) throw new Error('La mascota guardada cambió.');
    const update = bundledUpdate(petId(candidate));
    let restoredFile = file;
    if (update) {
      candidate = parsePet(fs.readFileSync(path.join(root, 'pets', update)));
      restoredFile = `${petId(candidate)}.${extension}`;
      const target = path.join(paths().pets, restoredFile);
      fs.writeFileSync(`${target}.tmp`, serializePet(candidate)); fs.renameSync(`${target}.tmp`, target);
    }
    canvasPetCache.set(petId(candidate), candidate);
    return { pet: candidate, file: restoredFile };
  }
  return { pet: kind === 'voice' ? parsePet(fs.readFileSync(path.join(root, 'pets', 'EduWitch-Voz.pet'))) : builtinPet(), file: null };
}
function changeCanvasFormat(format) {
  if (!isCanvasFormat(format)) throw new Error('Elige un lienzo 16:9 o 9:16.');
  if (format === canvasFormat) return snapshot();
  const previous = captureCanvasProfile(), target = canvasProfiles[format] || previous;
  const nextPet = profilePet(target, 'companion'), nextVoice = profilePet(target.voice, 'voice');
  validateImages(nextPet.pet); validateImages(nextVoice.pet);
  const audio = audioSettings();
  const nextSettings = sanitizeSettings(target.settings);
  const nextVoiceSettings = { ...sanitizeSettings(target.voice?.settings), ...audio, mode: 'still', paused: false, presenceEnabled: false, booEnabled: false };
  canvasProfiles[canvasFormat] = previous;
  settings = nextSettings; voiceSettings = nextVoiceSettings;
  if (petId(pet) !== petId(nextPet.pet)) { pet = nextPet.pet; petRevision++; motion.setAnimation(pet.animation); motion.setBehavior(pet.behavior); }
  if (petId(voicePet) !== petId(nextVoice.pet)) { voicePet = nextVoice.pet; voiceRevision++; voiceMotion.setAnimation(voicePet.animation); voiceMotion.setBehavior(voicePet.behavior); }
  selectedPetFile = nextPet.file; voiceSelectedFile = nextVoice.file;
  activeType = target.activeType === 'voice' ? 'voice' : 'companion';
  canvasFormat = format; canvasRevision++;
  ghostOpacityStart = voiceMotion.elapsed;
  draculaBatStart = voiceMotion.elapsed;
  motion.reset(); motion.advance(0, settings);
  canvasProfiles[format] = captureCanvasProfile();
  applyDesktop(); scheduleSave(); notify(); return snapshot();
}

function savePreferences() {
  const file = paths().settings;
  const temporary = `${file}.tmp`;
  try {
    canvasProfiles[canvasFormat] = captureCanvasProfile();
    fs.writeFileSync(temporary, JSON.stringify({ ...captureCanvasProfile(), schemaVersion: 5, canvasFormat, canvasProfiles }, null, 2));
    fs.renameSync(temporary, file);
  } catch (error) { console.error('No se pudieron guardar las preferencias:', error.message); }
}

function scheduleSave() {
  clearTimeout(settingsTimer);
  settingsTimer = setTimeout(savePreferences, 300);
}

function displays() {
  const primary = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((display, index) => ({
    id: String(display.id), name: `${display.label || `Monitor ${index + 1}`} ${display.id === primary ? '(principal)' : ''}`,
    width: display.bounds.width, height: display.bounds.height, scale: display.scaleFactor
  }));
}

function selectedDisplay() {
  return screen.getAllDisplays().find(d => String(d.id) === settings.displayId) || screen.getPrimaryDisplay();
}

function getFrame() {
  const frame = motion.frame(settings);
  return {
    ...frame, settings: { ...settings, desktopEnabled: settings.desktopEnabled && settings.companionEnabled, obsEnabled: settings.obsEnabled && settings.companionEnabled },
    assetUrl: `/asset?v=${petRevision}`,
    closedAssetUrl: pet.images.closed ? `/asset-closed?v=${petRevision}` : null,
    atlasUrl: pet.images.atlas ? `/asset-atlas?v=${petRevision}` : null,
    limbUrl: pet.images.limb ? `/asset-limb?v=${petRevision}` : null,
    walkGifUrl: pet.images.walk ? `/asset-walk?v=${petRevision}` : null,
    greetingGifUrl: pet.images.greeting ? `/asset-greeting?v=${petRevision}` : null,
    cycleGifUrl: pet.images.cycle ? `/asset-cycle?v=${petRevision}` : null,
    framesUrl: pet.images.frames ? `/asset-frames?v=${petRevision}` : null,
    ...(motion.behavior.flipbook ? { gifFrame: flipbookFrame(frame, motion.behavior.flipbook), viewport: canvasInfo(canvasFormat) } : {}),
    ...(frame.cycle ? { gifFrame: { clip: 'cycle', index: frame.cycle.index, sheetIndex: frame.cycle.sheetIndex } } : {}),
    animation: motion.animation,
    voice: voiceFrame(pet, motion, `?v=${petRevision}`),
    voiceCompanion: getVoiceFrame(),
    canvas: { ...canvasInfo(canvasFormat), revision: canvasRevision },
    behavior: motion.behavior,
    timestamp: Date.now()
  };
}

function getVoiceFrame() {
  const frame = voiceMotion.frame(voiceSettings), suffix = `?slot=voice&v=${voiceRevision}`;
  return { ...frame, x: voiceSettings.corner.endsWith('right') ? 1 : 0, y: voiceSettings.corner.startsWith('bottom') ? 1 : 0,
    bob: frame.bob, tilt: frame.tilt, stretch: frame.stretch, boo: false,
    canvas: { ...canvasInfo(canvasFormat), revision: canvasRevision },
    settings: { ...voiceSettings, desktopEnabled: settings.desktopEnabled && settings.voiceEnabled, obsEnabled: settings.obsEnabled && settings.voiceEnabled },
    assetUrl: `/asset${suffix}`, closedAssetUrl: voicePet.images.closed ? `/asset-closed${suffix}` : null,
    animation: voicePet.animation, behavior: voiceMotion.behavior, ghostOpacity: ghostOpacityFrame(voiceMotion.elapsed - ghostOpacityStart, voiceSettings, voicePet.effects), draculaBat: draculaBatFrame(voiceMotion.elapsed - draculaBatStart, voiceSettings, voicePet.effects), voice: { ...voiceFrame(voicePet, voiceMotion, suffix), mirrored: voiceSettings.corner.endsWith('right') }, timestamp: Date.now() };
}

function snapshot() {
  const candidate = currentPet(), selectedSettings = currentSettings();
  return {
    activePetId: petId(candidate), activeType, canvas: canvasInfo(canvasFormat),
    companions: { voice: { id: petId(voicePet), name: voicePet.name, enabled: settings.voiceEnabled }, companion: { id: petId(pet), name: pet.name, enabled: settings.companionEnabled } },
    settings: selectedSettings, displays: displays(), obsUrl: `${server?.url || ''}/overlay`,
    previewUrl: `${server?.url || ''}/overlay?surface=preview`,
    connections: server?.stats().obs || 0,
    assetName: candidate.name, animation: candidate.animation, effects: candidate.effects || {}, behavior: activeType === 'voice' ? voiceMotion.behavior : motion.behavior, petKind: activeType,
    microphone: { status: micStatus, devices: micDevices },
    assetUrl: activeType === 'voice' ? `/asset?slot=voice&v=${voiceRevision}` : `/asset?v=${petRevision}`,
    customImage: Boolean(activeType === 'voice' ? voiceSelectedFile : selectedPetFile), version: app.getVersion(),
    shortcutsAvailable: !smoke && globalShortcut.isRegistered('CommandOrControl+Alt+P') && globalShortcut.isRegistered('CommandOrControl+Alt+H')
  };
}

function notify() {
  syncMicrophone();
  if (panel && !panel.isDestroyed()) panel.webContents.send('aula:changed', snapshot());
  server?.publish(getFrame());
  updateTray();
}

function secureWindow(win) {
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.on('will-attach-webview', event => event.preventDefault());
  win.webContents.on('console-message', details => {
    if (details.level === 'error') {
      rendererErrors.push(details.message);
      console.error('RENDERER_ERROR', details.message, details.sourceId, details.lineNumber);
    }
  });
}

function createDesktop() {
  const display = selectedDisplay();
  desktop = new BrowserWindow({
    ...display.bounds, show: false, frame: false, transparent: true, hasShadow: false,
    resizable: false, movable: false, focusable: false, skipTaskbar: true,
    autoHideMenuBar: true, backgroundColor: '#00000000',
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false }
  });
  desktop.setIgnoreMouseEvents(true);
  desktop.setAlwaysOnTop(true, 'screen-saver');
  // Si se captura el monitor completo, la mascota llega a OBS por su fuente dedicada.
  desktop.setContentProtection(true);
  secureWindow(desktop);
  desktop.once('ready-to-show', () => { if (settings.desktopEnabled && !smoke) desktop.showInactive(); });
  desktop.loadURL(`${server.url}/overlay?surface=desktop`);
}

function applyDesktop() {
  if (!desktop || desktop.isDestroyed()) return;
  desktop.setBounds(selectedDisplay().bounds);
  if (settings.desktopEnabled && !smoke) desktop.showInactive(); else desktop.hide();
}

function showPanel() {
  if (!panel || panel.isDestroyed()) return;
  if (panel.isMinimized()) panel.restore();
  panel.show(); panel.focus();
}

function updateTray() {
  if (!tray || tray.isDestroyed()) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir Aula Fantasma', click: showPanel },
    { type: 'separator' },
    { label: 'Mascota en el escritorio', type: 'checkbox', checked: settings.desktopEnabled,
      click: item => changeSettings({ desktopEnabled: item.checked }) },
    { label: 'Mascota en OBS', type: 'checkbox', checked: settings.obsEnabled,
      click: item => changeSettings({ obsEnabled: item.checked }) },
    { label: settings.paused ? 'Reanudar recorrido' : 'Pausar recorrido', click: () => changeSettings({ paused: !settings.paused }, 'companion') },
    { label: 'Ocultar ambas salidas', click: () => changeSettings({ desktopEnabled: false, obsEnabled: false }) },
    { type: 'separator' },
    { label: 'Salir', click: () => app.quit() }
  ]));
}

function changeSettings(patch, type = activeType) {
  const previousDisplay = settings.displayId;
  const previousMicrophone = JSON.stringify(audioSettings());
  const previousGhostTimes = [voiceSettings.ghostSolidSeconds, voiceSettings.ghostFadedSeconds].join(':');
  const previousBatTimes = [voiceSettings.draculaBatEnabled, voiceSettings.draculaSeconds, voiceSettings.draculaBatSeconds].join(':');
  if (type === 'voice') {
    voiceSettings = { ...sanitizeSettings(patch, voiceSettings), mode: 'still', presenceEnabled: false, booEnabled: false };
    settings = sanitizeSettings(Object.fromEntries(GLOBAL_SETTINGS.filter(key => Object.hasOwn(patch || {}, key)).map(key => [key, patch[key]])), settings);
  } else settings = sanitizeSettings(patch, settings);
  if (previousMicrophone !== JSON.stringify(audioSettings())) voiceGate.reset();
  if (previousGhostTimes !== [voiceSettings.ghostSolidSeconds, voiceSettings.ghostFadedSeconds].join(':')) ghostOpacityStart = voiceMotion.elapsed;
  if (previousBatTimes !== [voiceSettings.draculaBatEnabled, voiceSettings.draculaSeconds, voiceSettings.draculaBatSeconds].join(':')) draculaBatStart = voiceMotion.elapsed;
  if (previousDisplay !== settings.displayId || typeof patch?.desktopEnabled === 'boolean') applyDesktop();
  scheduleSave(); notify(); return snapshot();
}

function refreshLibrary() {
  library = loadLibrary([path.join(root, 'pets'), path.join(app.isPackaged ? path.dirname(app.getPath('exe')) : root, 'pets'), paths().pets], pet);
  if (!library.entries.has(petId(voicePet))) library.entries.set(petId(voicePet), { id: petId(voicePet), pet: voicePet });
  for (const [id] of library.entries) {
    const update = bundledUpdate(id);
    if (update && id !== petId(pet)) library.entries.delete(id);
  }
  for (const entry of library.entries.values()) {
    entry.motion = new Motion();
    entry.motion.setAnimation(entry.pet.animation);
    entry.motion.setBehavior(entry.pet.behavior);
    entry.settings = { ...DEFAULTS, mode: 'free', size: 180, speed: 45, presenceEnabled: false, paused: false, booInterval: 10 };
    if (entry.pet.kind === 'voice') Object.assign(entry.settings, { mode: 'still', booEnabled: false });
    entry.motion.advance(0, entry.settings);
    if (entry.motion.behavior.cycle && !entry.motion.behavior.cycle.reverseAfterRest) entry.motion.cycleTime = 15.01;
    else if (entry.motion.behavior.cycle?.reverseAfterRest) entry.settings.speed = 18;
    else entry.motion.booIn = 3;
    entry.lastTime = performance.now();
  }
}

function getLibraryFrame(id) {
  const entry = library.entries.get(id);
  if (!entry) return null;
  const now = performance.now();
  entry.motion.advance(Math.min(.1, (now - entry.lastTime) / 1000), entry.settings);
  entry.lastTime = now;
  const frame = entry.motion.frame(entry.settings);
  const assetRoutes = { assetUrl: ['open', 'asset'], closedAssetUrl: ['closed', 'asset-closed'], atlasUrl: ['atlas', 'asset-atlas'], limbUrl: ['limb', 'asset-limb'], walkGifUrl: ['walk', 'asset-walk'], greetingGifUrl: ['greeting', 'asset-greeting'], framesUrl: ['frames', 'asset-frames'], cycleGifUrl: ['cycle', 'asset-cycle'] };
  const urls = Object.fromEntries(Object.entries(assetRoutes).map(([key, [kind, route]]) => [key, entry.pet.images[kind] ? `/${route}?pet=${id}` : null]));
  return { ...frame, ...urls, voice: voiceFrame(entry.pet, entry.motion, `?pet=${id}`, true), ghostOpacity: ghostOpacityFrame(entry.motion.elapsed, entry.settings, entry.pet.effects), draculaBat: draculaBatFrame(entry.motion.elapsed, entry.settings, entry.pet.effects), settings: entry.settings, animation: entry.pet.animation, behavior: entry.motion.behavior,
    ...(entry.motion.behavior.flipbook ? { gifFrame: flipbookFrame(frame, entry.motion.behavior.flipbook) } : {}),
    ...(frame.cycle ? { gifFrame: { clip: 'cycle', index: frame.cycle.index, sheetIndex: frame.cycle.sheetIndex } } : {}) };
}

function installIpc() {
  const fromMicrophone = event => microphoneWindow && event.sender === microphoneWindow.webContents && event.senderFrame === microphoneWindow.webContents.mainFrame;
  ipcMain.handle('aula:mic-config', event => { if (!fromMicrophone(event)) throw new Error('Solicitud no autorizada'); return microphoneConfig(); });
  ipcMain.on('aula:mic-level', (event, level) => { if (fromMicrophone(event) && microphoneConfig().enabled) voiceGate.sample(level, performance.now(), voiceSettings); });
  ipcMain.on('aula:mic-status', (event, value) => {
    if (!fromMicrophone(event) || !value || !['off', 'starting', 'active', 'denied', 'missing', 'disconnected', 'error'].includes(value.status)) return;
    micStatus = microphoneConfig().enabled ? value.status : 'off';
    if (Array.isArray(value.devices)) micDevices = value.devices.slice(0, 64).filter(d => typeof d.id === 'string' && d.id.length <= 256 && typeof d.label === 'string' && d.label.length <= 256);
    if (micStatus !== 'active') voiceGate.reset();
    if (panel && !panel.isDestroyed()) panel.webContents.send('aula:changed', snapshot());
  });
  const handle = (name, handler) => ipcMain.handle(`aula:${name}`, async (event, ...args) => {
    if (!panel || event.sender !== panel.webContents || event.senderFrame !== panel.webContents.mainFrame) {
      throw new Error('Solicitud no autorizada');
    }
    return handler(...args);
  });
  handle('state', snapshot);
  handle('canvas', changeCanvasFormat);
  handle('edit-type', type => {
    if (!['voice', 'companion'].includes(type)) throw new Error('Tipo de mascota no válido.');
    activeType = type; scheduleSave(); notify(); return snapshot();
  });
  handle('open-pets', () => { refreshLibrary(); panel.loadURL(`${server.url}/pets`); return true; });
  handle('open-panel', () => { panel.loadURL(`${server.url}/panel`); return true; });
  handle('pet-library', () => {
    refreshLibrary();
    return { pets: [...library.entries.values()].filter(entry => (entry.pet.kind || 'companion') === activeType).map(entry => ({ id: entry.id, name: entry.pet.name, kind: entry.pet.kind || 'companion' })), activeType, activePetId: petId(currentPet()), unavailable: library.unavailable };
  });
  handle('select-pet', id => {
    const entry = typeof id === 'string' && library.entries.get(id);
    if (!entry) return { error: 'Esta mascota ya no está disponible. Vuelve a abrir el selector.' };
    if ((entry.pet.kind || 'companion') !== activeType) return { error: activeType === 'voice' ? 'Elige una mascota de voz .pet.' : 'Elige una mascota de recorrido .aulapet.' };
    try { activatePet(entry.pet); scheduleSave(); notify(); return { state: snapshot() }; }
    catch (error) { return { error: `No se pudo elegir la mascota. ${error.message}` }; }
  });
  handle('settings', (patch, type = activeType) => {
    if (!['voice', 'companion'].includes(type)) throw new Error('Tipo de mascota no válido.');
    return changeSettings(patch, type);
  });
  handle('reset-position', () => { if (activeType === 'voice') { voiceMotion.reset(); ghostOpacityStart = 0; draculaBatStart = 0; } else { motion.reset(); motion.advance(0, settings); } notify(); return snapshot(); });
  handle('boo-now', () => { motion.booNow(settings); notify(); return snapshot(); });
  handle('copy-url', () => { clipboard.writeText(`${server.url}/overlay`); return true; });
  handle('guide', () => shell.openPath(path.join(app.isPackaged ? path.dirname(app.getPath('exe')) : root, 'GUIA-OBS.html')));
  handle('hide-panel', () => panel.hide());
  handle('quit', () => app.quit());
  handle('reset-image', () => { activatePet(builtinPet(), false); scheduleSave(); notify(); return snapshot(); });
  handle('export-pet', async () => {
    const currentPet = activeType === 'voice' ? voicePet : pet;
    const extension = currentPet.kind === 'voice' ? 'pet' : 'aulapet';
    const choice = await dialog.showSaveDialog(panel, { title: 'Guardar mascota con sus animaciones', defaultPath: safeFilename(currentPet.name, extension), filters: [{ name: 'Mascota de Aula Fantasma', extensions: [extension] }] });
    if (choice.canceled || !choice.filePath) return { canceled: true };
    try {
      const file = new RegExp(`\\.${extension}$`, 'i').test(choice.filePath) ? choice.filePath : `${choice.filePath}.${extension}`;
      fs.writeFileSync(file, serializePet(currentPet));
      return { saved: true, name: path.basename(file) };
    } catch { return { error: 'No se pudo guardar la mascota en esa carpeta.' }; }
  });
  handle('import', async () => {
    const type = activeType;
    const choice = await dialog.showOpenDialog(panel, {
      title: 'Elegir mascota', properties: ['openFile'],
      defaultPath: path.join(app.isPackaged ? path.dirname(app.getPath('exe')) : root, 'pets'),
      filters: type === 'voice' ? [{ name: 'Mascota de voz', extensions: ['pet'] }] : [{ name: 'Mascota de recorrido', extensions: ['aulapet'] }, { name: 'Crear desde imagen', extensions: ['png', 'webp', 'gif'] }]
    });
    if (choice.canceled) return { canceled: true };
    const file = choice.filePaths[0];
    try {
      const packaged = /\.(pet|aulapet)$/i.test(file);
      if (fs.statSync(file).size > (packaged ? MAX_FILE : MAX_IMAGE)) return { error: packaged ? 'La mascota debe pesar como máximo 32 MB.' : 'La imagen debe pesar como máximo 20 MB.' };
      const bytes = fs.readFileSync(file);
      const candidate = packaged ? parsePet(bytes) : bytes.equals(builtinPet().images.open.bytes) ? builtinPet() : fromImage(bytes, path.basename(file, path.extname(file)).slice(0, 80));
      if ((candidate.kind || 'companion') !== type || (packaged && path.extname(file).toLowerCase() !== (type === 'voice' ? '.pet' : '.aulapet'))) throw new Error(type === 'voice' ? 'Elige un archivo .pet de voz.' : 'Elige un archivo .aulapet de recorrido.');
      activatePet(candidate); scheduleSave(); notify(); return { state: snapshot() };
    } catch (error) { return { error: `No se pudo cargar la mascota. ${error.message}` }; }
  });
}

async function start() {
  loadPreferences();
  if (smoke) voiceSettings.micEnabled = false;
  motion.advance(0, settings);
  server = await startServer({ preferredPort: smoke ? 0 : 18747, webRoot, getFrame, getVoiceFrame, getLibraryFrame, getLibraryFrames: () => Object.fromEntries([...library.entries.keys()].map(id => [id, getLibraryFrame(id)])), getAsset: (kind, id, slot) => (id ? library.entries.get(id)?.pet : slot === 'voice' ? voicePet : pet)?.images[kind || 'open'] || null, onClients: () => {
    if (panel && !panel.isDestroyed()) panel.webContents.send('aula:changed', snapshot());
  } });
  createDesktop();
  panel = new BrowserWindow({
    width: 1080, height: 880, minWidth: 880, minHeight: 680, show: false,
    title: 'Aula Fantasma', backgroundColor: '#111019', autoHideMenuBar: true,
    icon: path.join(root, 'assets', 'app-icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: !smoke, offscreen: smoke }
  });
  secureWindow(panel);
  const allowMicrophone = (contents, permission, details) => contents === microphoneWindow?.webContents && microphoneConfig().enabled && permission === 'media' && details?.isMainFrame === true && details.requestingUrl === `${server.url}/microphone`;
  panel.webContents.session.setPermissionRequestHandler((contents, permission, callback, details) => callback(allowMicrophone(contents, permission, details) && details.mediaTypes?.length === 1 && details.mediaTypes[0] === 'audio'));
  panel.webContents.session.setPermissionCheckHandler((contents, permission, _origin, details) => allowMicrophone(contents, permission, details) && details.mediaType === 'audio');
  panel.on('close', event => { if (!quitting && tray) { event.preventDefault(); panel.hide(); } });
  panel.once('ready-to-show', () => { if (!smoke) panel.show(); });
  installIpc();
  microphoneWindow = new BrowserWindow({ width: 1, height: 1, show: false, skipTaskbar: true,
    webPreferences: { preload: path.join(__dirname, 'microphone-preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' } });
  secureWindow(microphoneWindow);
  microphoneWindow.webContents.on('render-process-gone', () => { voiceGate.reset(); micStatus = 'error'; if (panel && !panel.isDestroyed()) panel.webContents.send('aula:changed', snapshot()); });
  await microphoneWindow.loadURL(`${server.url}/microphone`);
  await panel.loadURL(`${server.url}/panel`);
  tray = new Tray(nativeImage.createFromPath(path.join(root, 'assets', 'tray-icon.png')));
  tray.setToolTip('Aula Fantasma · mascota de escritorio y OBS');
  tray.on('double-click', showPanel); tray.on('click', showPanel);
  updateTray();
  if (!smoke) {
    globalShortcut.register('CommandOrControl+Alt+P', () => changeSettings({ paused: !settings.paused }, 'companion'));
    globalShortcut.register('CommandOrControl+Alt+H', () => {
      const enable = !(settings.desktopEnabled || settings.obsEnabled);
      changeSettings({ desktopEnabled: enable, obsEnabled: enable });
    });
  }
  let previous = performance.now();
  timer = setInterval(() => {
    const now = performance.now();
    const dt = (now - previous) / 1000;
    motion.advance(dt, settings); voiceMotion.advance(dt, voiceSettings); previous = now;
    server.publish(getFrame());
  }, 1000 / 30);
  const onDisplayChanged = () => { applyDesktop(); notify(); };
  screen.on('display-added', onDisplayChanged);
  screen.on('display-removed', onDisplayChanged);
  screen.on('display-metrics-changed', onDisplayChanged);
  app.on('second-instance', showPanel);
  app.on('activate', showPanel);
  notify();
  console.log(`OBS_URL=${server.url}/overlay`);
  if (smoke) {
    if (process.argv.includes('--smoke-vehicle')) {
      const checks = await require('./vehicle-smoke.cjs')({ BrowserWindow, root, smokeRoot, panel, desktop, motion, parsePet, activatePet, changeSettings, getFrame, snapshot, notify, server });
      fs.writeFileSync(path.join(smokeRoot,'vehicle-result.json'),JSON.stringify({checks,rendererErrors},null,2));
      console.log('VEHICLE_SMOKE_RESULT='+JSON.stringify({checks,rendererErrors}));
      app.exit(Object.values(checks).every(Boolean) && rendererErrors.length===0 ? 0 : 1);
    } else if (process.argv.includes('--smoke-zombie')) {
      const checks = await require('./zombie-smoke.cjs')({ BrowserWindow, root, smokeRoot, panel, desktop, motion, parsePet, activatePet, changeSettings, getFrame, snapshot, notify, server });
      fs.writeFileSync(path.join(smokeRoot,'zombie-result.json'),JSON.stringify({checks,rendererErrors},null,2));
      console.log('ZOMBIE_SMOKE_RESULT='+JSON.stringify({checks,rendererErrors}));
      app.exit(Object.values(checks).every(Boolean) && rendererErrors.length===0 ? 0 : 1);
    } else if (process.argv.includes('--smoke-voice')) {
      const checks = await require('./voice-smoke.cjs')({ app, BrowserWindow, root, smokeRoot, panel, desktop, microphoneWindow, server, motion: voiceMotion, dialog, petId, parsePet, activatePet, changeSettings, getFrame: getVoiceFrame, getCompanionFrame: getFrame, snapshot, voiceGate, savePreferences, loadPreferences, notify });
      console.log('VOICE_SMOKE_RESULT=' + JSON.stringify({ checks, rendererErrors }));
      fs.writeFileSync(path.join(smokeRoot, 'voice-result.json'), JSON.stringify({ checks, rendererErrors }, null, 2));
      app.exit(Object.values(checks).every(Boolean) && rendererErrors.length === 0 ? 0 : 1);
    } else if (process.argv.includes('--smoke-panel')) {
      activeType = 'companion'; changeSettings({ voiceEnabled: false, companionEnabled: true });
      await new Promise(resolve => setTimeout(resolve, 500));
      const checks = await runPanelSmoke();
      console.log('PANEL_SMOKE_RESULT=' + JSON.stringify(checks));
      app.exit(checks.every(check => Object.values(check).every(Boolean)) && rendererErrors.length === 0 ? 0 : 1);
    } else await runSmoke();
  }
}

async function runSmoke() {
  console.log('SMOKE_STAGE=salidas-y-animacion');
  const checks = [];
  activatePet(builtinPet(), false);
  const originalAnimation = pet.animation;
  const setTestAnimation = patch => {
    motion.setAnimation(Object.fromEntries(Object.entries(motion.animation).map(([key, value]) => [key, { ...value, ...patch[key] }])));
    notify();
  };
  changeSettings({ presenceEnabled: false, voiceEnabled: false, companionEnabled: true });
  const paintSnapshot = async contents => {
    await contents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { contents.off('paint', painted); reject(new Error('No se produjo un fotograma de prueba.')); }, 2500);
      const painted = (_event, _rect, image) => { clearTimeout(timeout); resolve(image); };
      contents.once('paint', painted); contents.invalidate();
    });
  };
  const obsWindow = new BrowserWindow({ width: 960, height: 540, show: false, frame: false, transparent: true,
    backgroundColor: '#00000000', webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, offscreen: true } });
  secureWindow(obsWindow);
  await obsWindow.loadURL(`${server.url}/overlay`);
  await new Promise(resolve => setTimeout(resolve, 1500));
  checks.push(await panel.webContents.executeJavaScript(`({
    bridge: typeof window.aula?.getState === 'function',
    controls: document.querySelectorAll('[data-setting]').length,
    url: document.getElementById('obs-url').value,
    error: document.getElementById('toast').textContent,
    preview: document.getElementById('preview').dataset.surface
  })`));
  checks.push(await panel.webContents.executeJavaScript(`({
    connected: document.documentElement?.dataset.connected,
    visible: getComputedStyle(document.getElementById('pet')).visibility,
    loaded: document.getElementById('pet').naturalWidth > 0,
    background: getComputedStyle(document.body).backgroundColor
  })`));
  checks.push(await desktop.webContents.executeJavaScript(`({
    loaded: document.getElementById('pet').complete,
    width: document.getElementById('pet').naturalWidth,
    connected: document.documentElement?.dataset.connected,
    background: getComputedStyle(document.body).backgroundColor
  })`));
  // Invoca el puente real, recorre IPC, validación, simulación y respuesta.
  setTestAnimation({ float: { enabled: false } });
  checks.push(await panel.webContents.executeJavaScript(`window.aula.setSettings({ paused: true, speed: 90, mode: 'free' }).then(state => ({ paused: state.settings.paused, speed: state.settings.speed, mode: state.settings.mode }))`));
  await new Promise(resolve => setTimeout(resolve, 100));
  const before = getFrame();
  await new Promise(resolve => setTimeout(resolve, 200));
  const after = getFrame();
  checks.push({ pauseStopsMotion: before.x === after.x && before.y === after.y, nonFocusable: !desktop.isFocusable(), obsConnections: server.stats().obs, rendererErrors });
  const inspectPet = `(() => { const pet = document.getElementById('pet'); const style = getComputedStyle(pet); const rect = pet.getBoundingClientRect(); return { visible: style.visibility, loaded: pet.naturalWidth > 0, x: rect.x, y: rect.y, size: rect.width, canvasWidth: innerWidth, canvasHeight: innerHeight, connected: document.documentElement?.dataset.connected }; })()`;
  const desktopPet = await desktop.webContents.executeJavaScript(inspectPet);
  const obsPet = await obsWindow.webContents.executeJavaScript(inspectPet);
  const normalize = pet => {
    const scale = Math.min(pet.canvasWidth / 1920, pet.canvasHeight / 1080);
    const margin = settings.margin * scale;
    return { x: (pet.x - margin) / (pet.canvasWidth - pet.size - margin * 2), y: (pet.y - margin) / (pet.canvasHeight - pet.size - margin * 2) };
  };
  const desktopNormalized = normalize(desktopPet), obsNormalized = normalize(obsPet);
  checks.push({ obsLoaded: obsPet.loaded && obsPet.connected === 'true', positionsAgree: Math.abs(desktopNormalized.x - obsNormalized.x) < 0.01 && Math.abs(desktopNormalized.y - obsNormalized.y) < 0.01 });
  const waitForVisibility = async (win, expected) => {
    const deadline = performance.now() + 2000;
    do {
      if ((await win.webContents.executeJavaScript(inspectPet)).visible === expected) return true;
      await new Promise(resolve => setTimeout(resolve, 50));
    } while (performance.now() < deadline);
    return false;
  };
  await panel.webContents.executeJavaScript(`window.aula.setSettings({ desktopEnabled: false, obsEnabled: true })`);
  checks.push({ desktopHidden: await waitForVisibility(desktop, 'hidden'), obsVisible: await waitForVisibility(obsWindow, 'visible') });
  await panel.webContents.executeJavaScript(`window.aula.setSettings({ desktopEnabled: true, obsEnabled: false })`);
  checks.push({ desktopVisible: await waitForVisibility(desktop, 'visible'), obsHidden: await waitForVisibility(obsWindow, 'hidden') });
  setTestAnimation({ float: { enabled: true }, blink: { enabled: true } });
  await panel.webContents.executeJavaScript(`window.aula.setSettings({ desktopEnabled: true, obsEnabled: true, paused: false, mode: 'free', size: 240, speed: 65, booEnabled: true })`);
  await panel.webContents.executeJavaScript('window.aula.booNow()');
  const inspectCharacter = `(() => {
    const bubble = document.getElementById('boo'); const closed = document.getElementById('pet-closed');
    const r = bubble.getBoundingClientRect();
    return { boo: document.getElementById('pet-anchor').dataset.boo, bubbleVisible: getComputedStyle(bubble).visibility === 'visible', text: bubble.textContent, fits: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5, closedLoaded: closed.complete && closed.naturalWidth > 0, blinkOpacity: Number(getComputedStyle(closed).opacity), mask: getComputedStyle(closed).maskImage, placement: bubble.dataset.placement };
  })()`;
  await new Promise(resolve => setTimeout(resolve, 200));
  const booBefore = getFrame();
  await new Promise(resolve => setTimeout(resolve, 250));
  const booAfter = getFrame();
  const desktopCharacter = await desktop.webContents.executeJavaScript(inspectCharacter);
  const obsCharacter = await obsWindow.webContents.executeJavaScript(inspectCharacter);
  checks.push({ sharedBoo: desktopCharacter.boo === 'true' && obsCharacter.boo === 'true', bubbleVisible: desktopCharacter.bubbleVisible && obsCharacter.bubbleVisible, exactText: desktopCharacter.text === 'BOO!!' && obsCharacter.text === 'BOO!!', routeStopped: booBefore.x === booAfter.x && booBefore.y === booAfter.y, stillFloating: booBefore.bob !== booAfter.bob, closedLoaded: desktopCharacter.closedLoaded && obsCharacter.closedLoaded });
  // Congelar un parpadeo completo permite inspeccionar los ojos sin depender de capturar 200 ms.
  setTestAnimation({ float: { enabled: false } });
  motion.blinkRemaining = 0.12;
  changeSettings({ paused: true });
  const corners = [];
  for (const [x, y] of [[0,0], [1,0], [0,1], [1,1]]) {
    motion.x = x; motion.y = y; notify();
    await new Promise(resolve => setTimeout(resolve, 150));
    corners.push(await obsWindow.webContents.executeJavaScript(inspectCharacter));
  }
  checks.push({ bubbleFitsCorners: corners.every(c => c.fits && c.bubbleVisible), fullBlinkVisible: corners.every(c => c.blinkOpacity === 1 && c.mask !== 'none'), correctBubbleSide: corners[0].placement === 'below' && corners[2].placement === 'above', corners });
  const zoomCss = await obsWindow.webContents.insertCSS('#pet-anchor { width: 420px !important; height: 420px !important; transform: translate3d(250px,45px,0) !important; } #boo { visibility: hidden !important; }');
  await new Promise(resolve => setTimeout(resolve, 100));
  fs.writeFileSync(path.join(smokeRoot, 'edughost-blink.png'), (await paintSnapshot(obsWindow.webContents)).toPNG());
  await obsWindow.webContents.removeInsertedCSS(zoomCss);
  motion.blinkRemaining = 0;
  motion.x = 0.5; motion.y = 0.55;
  setTestAnimation({ float: { enabled: true } });
  changeSettings({ size: 280 });
  await new Promise(resolve => setTimeout(resolve, 150));
  fs.writeFileSync(path.join(smokeRoot, 'edughost-boo.png'), (await paintSnapshot(obsWindow.webContents)).toPNG());
  // Comparar píxeles de dos fases prueba deformación real de la tela, sin mover la cara.
  setTestAnimation({ float: { enabled: false }, cloth: { enabled: true }, blink: { enabled: false } });
  changeSettings({ paused: true, booEnabled: false, size: 300 });
  const clothZoom = await obsWindow.webContents.insertCSS('#pet-anchor { width: 420px !important; height: 420px !important; transform: translate3d(250px,45px,0) !important; }');
  motion.elapsed = 0; notify();
  await new Promise(resolve => setTimeout(resolve, 150));
  await obsWindow.webContents.executeJavaScript(`(() => { const c = document.getElementById('pet-cloth'); window.clothBefore = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; })()`);
  fs.writeFileSync(path.join(smokeRoot, 'edughost-wave-a.png'), (await paintSnapshot(obsWindow.webContents)).toPNG());
  motion.elapsed = 1.1; notify();
  await new Promise(resolve => setTimeout(resolve, 150));
  const clothPixels = await obsWindow.webContents.executeJavaScript(`(() => {
    const c = document.getElementById('pet-cloth'), data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let headChanges = 0, fabricChanges = 0;
    for (let i = 0; i < data.length; i++) if (data[i] !== window.clothBefore[i]) {
      if (Math.floor(i / (c.width * 4)) < Math.floor(c.height * .39)) headChanges++; else fabricChanges++;
    }
    window.clothPaused = data.slice();
    return { headStable: headChanges === 0, fabricMoves: fabricChanges > 1000, transparentCorners: data[3] === 0 && data[data.length - 1] === 0, canvasActive: document.getElementById('pet-body').classList.contains('cloth-active'), phase: c.dataset.phase, renderMs: Number(c.dataset.renderMs), headChanges, fabricChanges };
  })()`);
  fs.writeFileSync(path.join(smokeRoot, 'edughost-wave-b.png'), (await paintSnapshot(obsWindow.webContents)).toPNG());
  await new Promise(resolve => setTimeout(resolve, 200));
  const pauseCloth = await obsWindow.webContents.executeJavaScript(`(() => { const c = document.getElementById('pet-cloth'), data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; return data.every((v, i) => v === window.clothPaused[i]); })()`);
  const desktopPhase = await desktop.webContents.executeJavaScript(`document.getElementById('pet-cloth').dataset.phase`);
  setTestAnimation({ cloth: { enabled: false } });
  await new Promise(resolve => setTimeout(resolve, 150));
  const clothDisabled = await obsWindow.webContents.executeJavaScript(`!document.getElementById('pet-body').classList.contains('cloth-active') && Number(getComputedStyle(document.getElementById('pet')).opacity) === 1`);
  checks.push({ headStable: clothPixels.headStable, fabricMoves: clothPixels.fabricMoves, transparentCorners: clothPixels.transparentCorners, canvasActive: clothPixels.canvasActive, pauseCloth, sharedPhase: desktopPhase === clothPixels.phase, clothDisabled, details: clothPixels });
  await obsWindow.webContents.removeInsertedCSS(clothZoom);
  // Ciclo real: salir de ambos lienzos, esperar, volver; mantiene salidas independientes.
  motion.reset();
  motion.setAnimation(originalAnimation);
  changeSettings({ presenceEnabled: true, visibleSeconds: 5, awaySeconds: 5, paused: false, size: 240, booEnabled: false });
  motion.presence.age = 4.95;
  const waitForPresence = async phase => {
    const deadline = performance.now() + 7500;
    do {
      const phases = await Promise.all([desktop, obsWindow].map(win => win.webContents.executeJavaScript(`document.getElementById('pet-anchor').dataset.presence`)));
      if (phases.every(value => value === phase)) return;
      await new Promise(resolve => setTimeout(resolve, 40));
    } while (performance.now() < deadline);
    throw new Error('No se alcanzó la fase de aparición: ' + phase);
  };
  await waitForPresence('leaving');
  await new Promise(resolve => setTimeout(resolve, 450));
  changeSettings({ paused: true });
  const exiting = getFrame().presence;
  await new Promise(resolve => setTimeout(resolve, 150));
  const exitPause = JSON.stringify(exiting) === JSON.stringify(getFrame().presence);
  fs.writeFileSync(path.join(smokeRoot, 'edughost-exit.png'), (await paintSnapshot(obsWindow.webContents)).toPNG());
  changeSettings({ paused: false });
  await waitForPresence('away');
  const awayDesktop = await desktop.webContents.executeJavaScript(inspectPet);
  const awayObs = await obsWindow.webContents.executeJavaScript(inspectPet);
  const awayCharacter = await obsWindow.webContents.executeJavaScript(inspectCharacter);
  const awayScreenshot = await paintSnapshot(obsWindow.webContents);
  fs.writeFileSync(path.join(smokeRoot, 'edughost-away.png'), awayScreenshot.toPNG());
  const bitmap = awayScreenshot.toBitmap();
  let emptyAwayFrame = true;
  for (let i = 3; i < bitmap.length; i += 4) if (bitmap[i] !== 0) { emptyAwayFrame = false; break; }
  changeSettings({ paused: true });
  const absent = getFrame().presence;
  await new Promise(resolve => setTimeout(resolve, 150));
  const awayPause = JSON.stringify(absent) === JSON.stringify(getFrame().presence);
  changeSettings({ paused: false });
  await waitForPresence('entering');
  await new Promise(resolve => setTimeout(resolve, 800));
  changeSettings({ paused: true });
  const returning = getFrame().presence;
  await new Promise(resolve => setTimeout(resolve, 150));
  const entryPause = JSON.stringify(returning) === JSON.stringify(getFrame().presence);
  const entryVisible = await waitForVisibility(obsWindow, 'visible');
  fs.writeFileSync(path.join(smokeRoot, 'edughost-return.png'), (await paintSnapshot(obsWindow.webContents)).toPNG());
  changeSettings({ paused: false });
  await waitForPresence('visible');
  checks.push({ sharedExit: exiting.phase === 'leaving', exitPause, outsideBoth: (awayDesktop.x + awayDesktop.size < 0 || awayDesktop.x > awayDesktop.canvasWidth) && (awayObs.x + awayObs.size < 0 || awayObs.x > awayObs.canvasWidth), hiddenBoth: awayDesktop.visible === 'hidden' && awayObs.visible === 'hidden', noDetachedBubble: !awayCharacter.bubbleVisible, emptyAwayFrame, awayPause, entryPause, entryVisible, returnsBoth: await waitForVisibility(desktop, 'visible') && await waitForVisibility(obsWindow, 'visible') });
  // Usa los diálogos simulados para probar el puente y las rutas reales de importar/exportar.
  const exported = path.join(smokeRoot, 'EduGhost-exportado.aulapet');
  const imported = path.join(smokeRoot, 'Otra-mascota.aulapet');
  const invalid = path.join(smokeRoot, 'Invalida.aulapet');
  const realOpenDialog = dialog.showOpenDialog, realSaveDialog = dialog.showSaveDialog;
  try {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: exported });
    const saved = await panel.webContents.executeJavaScript('window.aula.exportPet()');
    const exportedPet = parsePet(fs.readFileSync(exported));
    const second = fromImage(pet.images.open.bytes, 'Otra mascota');
    second.animation.float.amplitude = 20;
    second.animation.blink = { ...pet.animation.blink, regions: [{ cx: .2, cy: .3, rx: .1, ry: .08 }] };
    second.images.closed = pet.images.closed;
    fs.writeFileSync(imported, serializePet(second));
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [imported] });
    const loaded = await panel.webContents.executeJavaScript('window.aula.importImage()');
    changeSettings({ presenceEnabled: false, paused: true });
    motion.blinkRemaining = .12; notify();
    await new Promise(resolve => setTimeout(resolve, 200));
    const customBehavior = await obsWindow.webContents.executeJavaScript(`({ clothOff: !document.getElementById('pet-body').classList.contains('cloth-active'), customMask: getComputedStyle(document.getElementById('pet-closed')).maskImage.includes('20% 30%'), noAnimationButtons: !document.querySelector('[data-setting="bob"], [data-setting="cloth"], [data-setting="blink"]') })`);
    const panelControls = await panel.webContents.executeJavaScript(`({ noAnimationButtons: !document.querySelector('[data-setting="bob"], [data-setting="cloth"], [data-setting="blink"]'), booControls: !!document.querySelector('[data-setting="booEnabled"]') && !!document.getElementById('boo-now'), exportAvailable: typeof window.aula.exportPet === 'function' })`);
    savePreferences();
    const storedFile = selectedPetFile;
    activatePet(builtinPet(), false); loadPreferences();
    const restartRestores = pet.name === 'Otra mascota' && selectedPetFile === storedFile && motion.animation.float.amplitude === 20;
    fs.writeFileSync(invalid, '{"format":"aula-fantasma-pet","version":999}');
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [invalid] });
    const rejected = await panel.webContents.executeJavaScript('window.aula.importImage()');
    const keepsCurrent = Boolean(rejected.error) && pet.name === 'Otra mascota';
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [exported] });
    const reloaded = await panel.webContents.executeJavaScript('window.aula.importImage()');
    await new Promise(resolve => setTimeout(resolve, 200));
    checks.push({ exported: saved.saved === true, imagesIntact: exportedPet.images.open.bytes.equals(builtinPet().images.open.bytes) && exportedPet.images.closed.bytes.equals(builtinPet().images.closed.bytes), animationIntact: JSON.stringify(exportedPet.animation) === JSON.stringify(originalAnimation), imported: loaded.state?.assetName === 'Otra mascota', ownBehavior: customBehavior.clothOff && customBehavior.customMask, simpleControls: Object.values(panelControls).every(Boolean), restartRestores, rejectsWithoutReplacing: keepsCurrent, reloadsEduGhost: reloaded.state?.assetName === 'EduGhost' && motion.animation.cloth.enabled });
  } finally { dialog.showOpenDialog = realOpenDialog; dialog.showSaveDialog = realSaveDialog; }
  // GIF completos: mismo reloj, dos salidas y alternativa PNG para OBS antiguo.
  const screamFixture = path.join(smokeRoot, 'EduScream-importado.aulapet');
  console.log('SMOKE_STAGE=eduscream');
  fs.writeFileSync(screamFixture, fs.readFileSync(path.join(root, 'pets', 'EduScream.aulapet')));
  const savedOpen = dialog.showOpenDialog;
  try {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [screamFixture] });
    const imported = await panel.webContents.executeJavaScript('window.aula.importImage()');
    if (imported.error) throw new Error(imported.error);
  } finally { dialog.showOpenDialog = savedOpen; }
  const preset = settings.size === 180 && settings.speed === 30 && settings.booInterval === 30 && settings.booEnabled && !settings.presenceEnabled;
  motion.reset(); changeSettings({ mode: 'edges', paused: true }); motion.advance(0, settings); notify();
  const inspectGif = `(() => { const c=document.getElementById('pet-flipbook'), b=document.getElementById('boo'), r=document.getElementById('pet-anchor').getBoundingClientRect(); return { active:document.getElementById('pet-body').classList.contains('flipbook-active'), decoder:c.dataset.decoder, phase:c.dataset.phase, lift:Number(c.dataset.lift), walk:c.dataset.walkPhase, frame:Number(c.dataset.frame), facing:Number(c.dataset.facing), text:b.textContent, bubbleVisible:getComputedStyle(b).visibility==='visible', x:r.x,y:r.y,size:r.width }; })()`;
  const waitGif = async predicate => {
    const deadline=performance.now()+4500;
    do {
      const views=await Promise.all([desktop,obsWindow].map(win=>win.webContents.executeJavaScript(inspectGif)));
      if(views.every(predicate))return views;
      await new Promise(resolve=>setTimeout(resolve,35));
    }while(performance.now()<deadline);
    throw new Error('No se alcanzó el fotograma GIF esperado.');
  };
  const saveGifCanvas = async name => {
    const url=await obsWindow.webContents.executeJavaScript("document.getElementById('pet-flipbook').toDataURL('image/png')");
    const bytes=Buffer.from(url.split(',')[1],'base64'); fs.writeFileSync(path.join(smokeRoot,name),bytes); return bytes;
  };
  const initial=await waitGif(view=>view.active && view.decoder==='gif');
  for(let i=0;i<30;i++)motion.advance(1/30,{...settings,paused:false}); notify();
  const moved=await waitGif(view=>view.walk===String(motion.walkPhase));
  const exactPixels=initial.every((before,i)=>Math.abs(before.size-180)<.01 && Math.abs(Math.hypot(moved[i].x-before.x,moved[i].y-before.y)-30)<.1);
  motion.walkStrength=1; motion.walkPhase=0; notify(); await waitGif(view=>view.frame===0 && view.phase==='idle');
  await obsWindow.webContents.executeJavaScript(`(() => {const c=document.getElementById('pet-flipbook');window.gifBefore=c.getContext('2d').getImageData(0,0,c.width,c.height).data;})()`);
  const walking=await saveGifCanvas('eduscream-gif-walk-a.png');
  motion.walkPhase=Math.PI/2;notify();await waitGif(view=>view.frame===2);
  const pixels=await obsWindow.webContents.executeJavaScript(`(() => {const c=document.getElementById('pet-flipbook'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let changes=0;for(let i=0;i<data.length;i++)if(data[i]!==window.gifBefore[i]&&Math.floor(i/(c.width*4))>c.height*.6)changes++;window.gifPaused=data.slice();return {feetMove:changes>100,transparent:data[3]===0&&data[data.length-1]===0};})()`);
  await saveGifCanvas('eduscream-gif-walk-b.png');
  await new Promise(resolve=>setTimeout(resolve,140));
  const frozen=await obsWindow.webContents.executeJavaScript(`(() => {const c=document.getElementById('pet-flipbook'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return data.every((v,i)=>v===window.gifPaused[i]);})()`);
  motion.booRemaining=0; changeSettings({paused:false}); await panel.webContents.executeJavaScript('window.aula.booNow()');
  await waitGif(view=>view.phase==='raise'); const start=getFrame();
  await waitGif(view=>view.phase==='hold'&&view.bubbleVisible&&view.frame===7); changeSettings({paused:true});
  const heldViews=await waitGif(view=>view.phase==='hold'&&view.lift===1);
  const held=getFrame(), holding=await saveGifCanvas('eduscream-gif-detras-de-ti.png');
  await new Promise(resolve=>setTimeout(resolve,150)); const pauseGesture=getFrame().elapsed===held.elapsed;
  changeSettings({paused:false});await waitGif(view=>view.phase==='lower'&&!view.bubbleVisible&&view.lift<.6);
  changeSettings({paused:true});await new Promise(resolve=>setTimeout(resolve,80));
  const lower=getFrame(), lowering=await saveGifCanvas('eduscream-gif-lowering.png');
  changeSettings({paused:false});await waitGif(view=>view.phase==='idle'&&view.lift===0);await new Promise(resolve=>setTimeout(resolve,200));
  const resumed=getFrame();
  changeSettings({paused:true});
  changeSettings({mode:'free'});motion.advance(0,settings);
  motion.pixelStart={x:.5,y:.5,directionX:1,directionY:1};motion.pixelDistance=0;motion.walkPhase=0;motion.walkStrength=1;notify();
  await waitGif(view=>view.facing===1&&view.frame===0);
  await obsWindow.webContents.executeJavaScript(`(() => {const c=document.getElementById('pet-flipbook');window.gifRight=c.getContext('2d').getImageData(0,0,c.width,c.height).data;})()`);
  await saveGifCanvas('eduscream-gif-right.png');motion.pixelStart.directionX=-1;notify();await waitGif(view=>view.facing===-1&&view.frame===0);
  const orientationCorrect=await obsWindow.webContents.executeJavaScript(`(() => {const c=document.getElementById('pet-flipbook'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)for(let k=0;k<4;k++)if(data[(y*c.width+x)*4+k]!==window.gifRight[(y*c.width+c.width-1-x)*4+k])return false;return true;})()`);
  await saveGifCanvas('eduscream-gif-left.png');
  await obsWindow.webContents.executeJavaScript('window.gifDecoder=window.ImageDecoder;window.ImageDecoder=undefined');
  petRevision++;notify();
  const fallbackDeadline=performance.now()+4500;let fallback;
  do {fallback=await obsWindow.webContents.executeJavaScript(inspectGif);if(fallback.active&&fallback.decoder==='png')break;await new Promise(resolve=>setTimeout(resolve,35));}while(performance.now()<fallbackDeadline);
  const pngFallback=Boolean(fallback.active&&fallback.decoder==='png');
  await saveGifCanvas('eduscream-gif-png-fallback.png');
  await obsWindow.webContents.executeJavaScript('window.ImageDecoder=window.gifDecoder;void 0');petRevision++;notify();await waitGif(view=>view.active&&view.decoder==='gif');
  checks.push({preset,decodedRealGif:initial.every(view=>view.decoder==='gif'),actualSizeAndSpeed:exactPixels,feetMove:pixels.feetMove,transparentCorners:pixels.transparent,frozenPixels:frozen,messageExact:heldViews.every(view=>view.text==='Detrás de ti'&&view.bubbleVisible),synchronizedPose:heldViews[0].frame===heldViews[1].frame,stopsDuringGreeting:held.pixelRoute.distance===start.pixelRoute.distance&&lower.pixelRoute.distance===held.pixelRoute.distance,raisedFully:held.greeting.lift===1,gesturePixelsChange:!holding.equals(walking)&&!lowering.equals(holding),pauseGesture,continuesAfterLowering:resumed.pixelRoute.distance>held.pixelRoute.distance,orientationCorrect,pngFallback});
  const legacyArg=process.argv.find(arg=>arg.startsWith('--smoke-legacy='));
  if(!legacyArg)throw new Error('Falta el paquete anterior para comprobar la actualización.');
  const legacy=parsePet(fs.readFileSync(legacyArg.slice('--smoke-legacy='.length))),correctedId=petId(pet);
  changeSettings({size:220,speed:70,booInterval:60,opacity:95,paused:true});
  activatePet(legacy);savePreferences();loadPreferences();notify();await waitGif(view=>view.active&&view.decoder==='gif');
  checks.push({knownLegacy:bundledUpdate(petId(legacy))==='EduScream.aulapet',upgradesSelectedPet:petId(pet)===correctedId&&selectedPetFile===correctedId+'.aulapet',appliesRequestedDefaults:settings.size===180&&settings.speed===30&&settings.booInterval===30&&settings.booEnabled&&!settings.presenceEnabled,keepsOtherPreferences:settings.opacity===95&&settings.paused});
  // Ciclo completo de resurrección, sin cambiar las preferencias de uso diario.
  console.log('SMOKE_STAGE=edufrankenstein');
  let frankImportPath = false;
  const frankOpen = dialog.showOpenDialog;
  try {
    dialog.showOpenDialog = async (_window, options) => {
      frankImportPath = path.basename(options.defaultPath) === 'pets';
      return { canceled: false, filePaths: [path.join(root,'pets','EduFrankenstein.aulapet')] };
    };
    const imported = await panel.webContents.executeJavaScript('window.aula.importImage()');
    if (imported.error) throw new Error(imported.error);
  } finally { dialog.showOpenDialog = frankOpen; }
  changeSettings({paused:true,desktopEnabled:true,obsEnabled:true,opacity:100});motion.reset();notify();
  const frankInitial = await waitGif(view=>view.active&&view.decoder==='gif'&&view.phase==='dead'&&view.frame===0);
  const frankDead = await saveGifCanvas('edufrankenstein-dead.png');
  const frankCorners = await obsWindow.webContents.executeJavaScript(`(() => {const c=document.getElementById('pet-flipbook'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return d[3]===0&&d[d.length-1]===0;})()`);
  const poses=[];
  for (const [time,phase,name] of [[10.1,'lightning','lightning'],[14.5,'rise','alive'],[15.1,'walk','walk'],[45.2,'fall','fall'],[45.75,'dead','dead-again']]) {
    motion.cycleTime=time;notify();const views=await waitGif(view=>view.active&&view.phase===phase&&view.frame===getFrame().cycle.index);
    poses.push(views[0].frame===views[1].frame);
    await saveGifCanvas(`edufrankenstein-${name}.png`);
  }
  motion.cycleTime=45.75;notify();await waitGif(view=>view.phase==='dead'&&view.frame===0);
  const frankLoop = (await saveGifCanvas('edufrankenstein-loop.png')).equals(frankDead);
  const frozenTime=motion.cycleTime;await new Promise(resolve=>setTimeout(resolve,150));
  const frankPaused = motion.cycleTime===frozenTime && (await saveGifCanvas('edufrankenstein-paused.png')).equals(frankDead);
  const checkFrankOrientation = async decoder => {
    const views = [desktop, obsWindow];
    const remember = `(() => {const c=document.getElementById('pet-flipbook');window.frankRight=c.getContext('2d').getImageData(0,0,c.width,c.height).data;})()`;
    const compare = mirrored => `(() => {const c=document.getElementById('pet-flipbook'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let different=false;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)for(let k=0;k<4;k++){const i=(y*c.width+x)*4+k,j=(y*c.width+${mirrored?'c.width-1-x':'x'})*4+k;if(d[i]!==window.frankRight[j])return false;if(d[i]!==window.frankRight[i])different=true;}return ${mirrored?'different':'true'};})()`;
    motion.cycleTime=15.1;motion.directionX=1;notify();await waitGif((view,index)=>view.decoder===(index===1?decoder:'gif')&&view.phase==='walk'&&view.facing===1&&view.frame===8);
    await Promise.all(views.map(win=>win.webContents.executeJavaScript(remember)));
    await saveGifCanvas(`edufrankenstein-${decoder}-right.png`);
    motion.directionX=-1;notify();await waitGif((view,index)=>view.decoder===(index===1?decoder:'gif')&&view.phase==='walk'&&view.facing===-1&&view.frame===8);
    const walk=(await Promise.all(views.map(win=>win.webContents.executeJavaScript(compare(true))))).every(Boolean);
    await saveGifCanvas(`edufrankenstein-${decoder}-left.png`);
    motion.cycleTime=14.5;motion.directionX=1;notify();await waitGif((view,index)=>view.decoder===(index===1?decoder:'gif')&&view.phase==='rise'&&view.facing===1&&view.frame===7);
    await Promise.all(views.map(win=>win.webContents.executeJavaScript(remember)));
    motion.directionX=-1;notify();await waitGif((view,index)=>view.decoder===(index===1?decoder:'gif')&&view.phase==='rise'&&view.facing===-1&&view.frame===7);
    const text=(await Promise.all(views.map(win=>win.webContents.executeJavaScript(compare(false))))).every(Boolean);
    return {walk,text};
  };
  const frankGifOrientation=await checkFrankOrientation('gif');
  await obsWindow.webContents.executeJavaScript('window.gifDecoder=window.ImageDecoder;window.ImageDecoder=undefined');
  petRevision++;notify();
  const frankFallbackDeadline=performance.now()+4500;let frankFallback;
  do {frankFallback=await obsWindow.webContents.executeJavaScript(inspectGif);if(frankFallback.active&&frankFallback.decoder==='png')break;await new Promise(resolve=>setTimeout(resolve,35));}while(performance.now()<frankFallbackDeadline);
  const frankPng=Boolean(frankFallback.active&&frankFallback.decoder==='png');
  await saveGifCanvas('edufrankenstein-png-fallback.png');
  const frankPngOrientation=await checkFrankOrientation('png');
  await obsWindow.webContents.executeJavaScript('window.ImageDecoder=window.gifDecoder;void 0');petRevision++;notify();await waitGif(view=>view.active&&view.decoder==='gif');
  const frankControls=await panel.webContents.executeJavaScript(`({button:document.getElementById('boo-now').textContent==='Resucitar ahora',frequencyHidden:document.getElementById('booInterval').closest('details').hidden,toggleHidden:document.getElementById('greeting-toggle-label').closest('label').hidden})`);
  motion.cycleTime=14.5;notify();await waitGif(view=>view.phase==='rise'&&view.frame===7);
  const frankBubbleClean=await obsWindow.webContents.executeJavaScript(`(() => {const c=document.getElementById('pet-flipbook'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let y=Math.ceil(c.height*48/256);y<c.height*62/256;y++)for(let x=Math.ceil(c.width*112/256);x<c.width*145/256;x++)if(d[(y*c.width+x)*4+3]!==0)return false;return true;})()`);
  motion.reset();motion.cycleTime=15.01;notify();const frankTravelStart=await waitGif(view=>view.phase==='walk'&&view.frame===getFrame().cycle.index);
  await paintSnapshot(obsWindow.webContents).then(image=>fs.writeFileSync(path.join(smokeRoot,'edufrankenstein-travel-start.png'),image.toPNG()));
  for(let step=0;step<200;step++)motion.advance(.1,{...settings,paused:false});notify();
  const frankTravelEnd=await waitGif(view=>view.phase==='walk'&&view.frame===getFrame().cycle.index);
  const frankTravels=frankTravelStart.every((start,index)=>Math.abs(frankTravelEnd[index].x-start.x)>150&&Math.abs(frankTravelEnd[index].y-start.y)>75);
  await paintSnapshot(obsWindow.webContents).then(image=>fs.writeFileSync(path.join(smokeRoot,'edufrankenstein-travel.png'),image.toPNG()));
  checks.push({frankImportPath,frankDecoded:frankInitial.every(view=>view.decoder==='gif'),frankActualSize:frankInitial.every(view=>Math.abs(view.size-256)<.01),frankCorners,frankStagesShared:poses.every(Boolean),frankLoop,frankPaused,frankPng,frankTravels,frankBubbleClean,frankGifOrientation:frankGifOrientation.walk,frankPngOrientation:frankPngOrientation.walk,frankTextUnmirrored:frankGifOrientation.text&&frankPngOrientation.text,frankText:motion.behavior.cycle.sequence.filter(entry=>entry.text).every(entry=>entry.text==='¡Está vivo!'),frankControls:Object.values(frankControls).every(Boolean)});
  const frankLegacyArg=process.argv.find(arg=>arg.startsWith('--smoke-frank-legacy='));
  if(!frankLegacyArg)throw new Error('Falta el paquete anterior de EduFrankenstein.');
  const oldFrank=parsePet(fs.readFileSync(frankLegacyArg.slice('--smoke-frank-legacy='.length)));
  changeSettings({mode:'edges',size:230,speed:75,opacity:85,presenceEnabled:true,visibleSeconds:90,awaySeconds:120,paused:true});
  const frankPreferences=JSON.stringify(settings),newFrankId=petId(pet);
  activatePet(oldFrank,true,false);savePreferences();loadPreferences();notify();await waitGif(view=>view.active&&view.decoder==='gif');
  checks.push({frankKnownLegacy:bundledUpdate(petId(oldFrank))==='EduFrankenstein.aulapet',frankUpgrade:petId(pet)===newFrankId,frankPreservesPreferences:JSON.stringify(settings)===frankPreferences,frankNewTimeline:motion.behavior.cycle.sequence.length===111});
  const previousFrank=parsePet(serializePet({...pet,behavior:{...pet.behavior,cycle:{...pet.behavior.cycle,mirror:false}}}));
  activatePet(previousFrank,true,false);savePreferences();loadPreferences();notify();await waitGif(view=>view.active&&view.decoder==='gif');
  checks.push({frankPreviousUpgrade:petId(pet)===newFrankId&&motion.behavior.cycle.mirror,frankPreviousPreservesPreferences:JSON.stringify(settings)===frankPreferences});
  motion.reset();await panel.webContents.executeJavaScript('window.aula.setSettings({desktopEnabled:true,obsEnabled:true,paused:false,mode:"free",size:256,speed:55,booEnabled:false,presenceEnabled:false,opacity:100})');
  checks.push(...await runPanelSmoke());
  // Cerrar el consumidor de prueba deja el panel en su estado real, sin afirmar conexión a OBS.
  obsWindow.destroy();
  await new Promise(resolve => setTimeout(resolve, 100));
  const screenshot = await paintSnapshot(panel.webContents);
  fs.writeFileSync(path.join(smokeRoot, 'panel.png'), screenshot.toPNG());
  await panel.webContents.executeJavaScript('document.querySelector(".character-card").scrollIntoView({block: "end"})');
  fs.writeFileSync(path.join(smokeRoot, 'panel-mascota.png'), (await paintSnapshot(panel.webContents)).toPNG());
  const overlayScreenshot = await desktop.webContents.capturePage();
  fs.writeFileSync(path.join(smokeRoot, 'overlay.png'), overlayScreenshot.toPNG());
  fs.writeFileSync(path.join(smokeRoot, 'result.json'), JSON.stringify(checks, null, 2));
  console.log('SMOKE_RESULT=' + JSON.stringify(checks));
  const valid = checks[0].bridge && checks[0].controls >= 12 && checks[0].url.startsWith('http://127.0.0.1:') && checks[1].connected === 'true' && checks[1].visible === 'visible' && checks[2].loaded && checks[2].width > 0 && checks[2].connected === 'true' && checks[3].paused && checks[4].pauseStopsMotion && checks[5].obsLoaded && checks[5].positionsAgree && checks[6].desktopHidden && checks[6].obsVisible && checks[7].desktopVisible && checks[7].obsHidden && Object.values(checks[8]).every(Boolean) && Object.values(checks[9]).every(Boolean) && rendererErrors.length === 0;
  app.exit(valid && checks.slice(10).every(check => Object.values(check).every(Boolean)) ? 0 : 1);
}


async function runPanelSmoke() {
  console.log('SMOKE_STAGE=controles-y-selectores');
  const checks = [];
  // Comprueba la edición del panel a través de sus eventos e IPC reales.
  checks.push(await panel.webContents.executeJavaScript(`(async () => {
    const $ = id => document.getElementById(id);
    const wait = async predicate => {
      for (let attempt = 0; attempt < 60; attempt++) {
        if (await predicate()) return true;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      return false;
    };
    await window.aula.setSettings({ mode: 'free', presenceEnabled: true, booEnabled: true });
    const numericKeys = ['size', 'speed', 'opacity', 'margin', 'booInterval', 'visibleSeconds', 'awaySeconds'];
    await wait(() => numericKeys.every(key => !$(key + '-value').disabled));
    let keyboardEdits = true, sliderEdits = true;
    for (const key of numericKeys) {
      const number = $(key + '-value'), slider = $(key), target = Number(number.min) + 7;
      number.value = String(target);
      number.dispatchEvent(new Event('change', { bubbles: true }));
      keyboardEdits = await wait(async () => (await window.aula.getState()).settings[key] === target && slider.value === String(target)) && keyboardEdits;
      slider.value = String(target + 1);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      sliderEdits = await wait(async () => (await window.aula.getState()).settings[key] === target + 1 && number.value === String(target + 1)) && sliderEdits;
    }
    const size = $('size-value');
    size.value = '21'; size.dispatchEvent(new Event('change', { bubbles: true }));
    const clampsMinimum = await wait(async () => (await window.aula.getState()).settings.size === 60 && $('size').value === '60' && size.value === '60');
    size.value = '999'; size.dispatchEvent(new Event('change', { bubbles: true }));
    const clampsMaximum = await wait(async () => (await window.aula.getState()).settings.size === 300 && size.value === '300');
    size.value = ''; size.dispatchEvent(new Event('change', { bubbles: true }));
    const emptyRestoresValue = size.value === '300' && (await window.aula.getState()).settings.size === 300;
    size.focus(); size.value = '123';
    size.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const escapeCancels = size.value === '300' && (await window.aula.getState()).settings.size === 300;
    await window.aula.setSettings({ mode: 'still', presenceEnabled: false, booEnabled: false });
    const disabledPairs = await wait(() => ['speed', 'visibleSeconds', 'awaySeconds', 'booInterval'].every(key => $(key).disabled && $(key + '-value').disabled));
    const singlePetAction = !document.querySelector('.pet-card') && !document.getElementById('import-image') && Boolean($('choose-voice') && $('choose-companion') && $('export-pet'));
    const favicon = document.querySelector('link[rel="icon"]');
    const response = await fetch(favicon.href);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const faviconLoaded = response.ok && bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && bytes[3] === 0;
    await window.aula.setSettings({ mode: 'free', size: 256, speed: 55, booEnabled: false, presenceEnabled: false, opacity: 100 });
    return { keyboardEdits, sliderEdits, clampsMinimum, clampsMaximum, emptyRestoresValue, escapeCancels, disabledPairs, singlePetAction, faviconLoaded };
  })()`));
  await panel.webContents.executeJavaScript(`document.getElementById('size-value').focus()`);
  panel.webContents.focus();
  panel.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'A', modifiers: ['control'] });
  panel.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'A', modifiers: ['control'] });
  await new Promise(resolve => setTimeout(resolve, 50));
  await panel.webContents.insertText('21');

  changeSettings({ opacity: 99 });
  await new Promise(resolve => setTimeout(resolve, 80));
  const draftSurvivesNotifications = await panel.webContents.executeJavaScript(`document.getElementById('size-value').value === '21'`);
  panel.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' });
  panel.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Enter' });
  await new Promise(resolve => setTimeout(resolve, 100));
  const enterCommitsNumber = settings.size === 60 && await panel.webContents.executeJavaScript(`document.getElementById('size-value').value === '60' && document.getElementById('size').value === '60'`);
  checks.push({ draftSurvivesNotifications, enterCommitsNumber });
  changeSettings({ size: 256, opacity: 100 });
  checks.push(await runSelectorSmoke());
  checks.push(await runPiramydSmoke());
  return checks;
}

async function runPiramydSmoke() {
  const initialPet = pet, initialSettings = { ...settings };
  const candidate = parsePet(fs.readFileSync(path.join(root, 'pets', 'EduPiramyd.aulapet')));
  const selected = await panel.webContents.executeJavaScript(`window.aula.selectPet(${JSON.stringify(petId(candidate))})`);
  const preset = !selected.error && settings.speed === 18 && settings.size === 256 && !settings.presenceEnabled && !settings.booEnabled;
  changeSettings({ paused: true, desktopEnabled: true, obsEnabled: true });
  const observer = new BrowserWindow({ width: 960, height: 540, show: false, frame: false, transparent: true,
    backgroundColor: '#00000000', webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, offscreen: true, backgroundThrottling: false } });
  secureWindow(observer);
  await observer.loadURL(`${server.url}/overlay`);
  const inspect = `(() => { const canvas=document.getElementById('pet-flipbook'); return { active:document.getElementById('pet-body').classList.contains('flipbook-active'), decoder:canvas.dataset.decoder, stage:canvas.dataset.phase, frame:Number(canvas.dataset.frame), facing:Number(canvas.dataset.facing) }; })()`;
  const wait = async (window, predicate) => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const view = await window.webContents.executeJavaScript(inspect);
      if (view.active && predicate(view)) return true;
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    return false;
  };
  const saveCanvas = async name => {
    const url = await observer.webContents.executeJavaScript(`document.getElementById('pet-flipbook').toDataURL()`);
    fs.writeFileSync(path.join(smokeRoot, name), Buffer.from(url.split(',')[1], 'base64'));
    return url;
  };
  motion.cycleTime = 1.01; motion.directionX = 1; motion.x = .5; notify();
  const gifLoaded = await wait(observer, view => view.decoder === 'gif' && view.frame === 2 && view.facing === 1);
  const right = await saveCanvas('piramyd-walk-right.png');
  await observer.webContents.executeJavaScript(`(() => { const c=document.getElementById('pet-flipbook'); window.piramydRight=c.getContext('2d').getImageData(0,0,c.width,c.height).data; })()`);
  motion.directionX = -1; notify();
  const facingLeft = await wait(observer, view => view.frame === 2 && view.facing === -1);
  const mirrorCorrect = await observer.webContents.executeJavaScript(`(() => {
    const c=document.getElementById('pet-flipbook'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let different=0;
    for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) {
      const a=(y*c.width+x)*4, b=(y*c.width+c.width-1-x)*4;
      if(Math.abs(d[a+3]-window.piramydRight[b+3])>3) return false;
      for(let k=0;k<3;k++) if(Math.abs(d[a+k]*d[a+3]/255-window.piramydRight[b+k]*window.piramydRight[b+3]/255)>3) return false;
      if(d[a+3]!==window.piramydRight[a+3]) different++;
    }
    return different>100;
  })()`);
  await saveCanvas('piramyd-walk-left.png');
  motion.directionX = 1; motion.cycleTime = 2.01; notify();
  await wait(observer, view => view.frame === 5 && view.facing === 1);
  const stepsAnimate = right !== await saveCanvas('piramyd-next-step.png');
  const inspectRig = `(() => {
    const c=document.getElementById('pet-flipbook'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, before=window.piramydRight;
    let swordStable=true, far=0, near=0, front=0;
    for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) {
      const offset=(y*c.width+x)*4, px=x*256/c.width, py=y*256/c.height;
      const different=[0,1,2,3].some(k=>d[offset+k]!==before[offset+k]);
      if(different && (px<175 || py<220)) swordStable=false;
      if(different && py>=236 && py<249) {
        if(px>=176&&px<199) far++; if(px>=199&&px<218) near++; if(px>=218&&px<251) front++;
      }
    }
    return {swordStable,frontLegMoves:front>25,hindLegsMove:far>25&&near>25};
  })()`;
  const gifRig = await observer.webContents.executeJavaScript(inspectRig);
  motion.cycleTime = 35; notify();
  const rests = await wait(observer, view => view.stage === 'idle' && view.frame === 75);
  const idle = await saveCanvas('piramyd-rest.png');
  await new Promise(resolve => setTimeout(resolve, 150));
  const pauseFreezes = idle === await observer.webContents.executeJavaScript(`document.getElementById('pet-flipbook').toDataURL()`);
  await observer.webContents.executeJavaScript('window.ImageDecoder=undefined'); petRevision++; notify();
  const pngFallback = await wait(observer, view => view.decoder === 'png' && view.stage === 'idle');
  motion.cycleTime = 1.01; motion.directionX = 1; notify();
  await wait(observer, view => view.decoder === 'png' && view.frame === 2 && view.facing === 1);
  await saveCanvas('piramyd-png-walk.png');
  await observer.webContents.executeJavaScript(`(() => { const c=document.getElementById('pet-flipbook'); window.piramydRight=c.getContext('2d').getImageData(0,0,c.width,c.height).data; })()`);
  motion.cycleTime = 2.01; notify();
  await wait(observer, view => view.decoder === 'png' && view.frame === 5 && view.facing === 1);
  const pngRig = await observer.webContents.executeJavaScript(inspectRig);
  motion.cycleTime = 1.01; notify();
  const controls = await panel.webContents.executeJavaScript(`document.querySelector('.character-card .eyebrow').textContent==='CAMINATA' && document.getElementById('boo-now').textContent==='Reiniciar ciclo' && !document.getElementById('patrol-description').hidden`);
  const synchronized = await wait(desktop, view => view.stage === 'walk' && view.frame === 2 && view.facing === 1);
  observer.destroy(); activatePet(initialPet, false); changeSettings(initialSettings);
  return { preset, gifLoaded, facingLeft, mirrorCorrect, stepsAnimate, rests, pauseFreezes, pngFallback, controls, synchronized,
    gifSwordStable:gifRig.swordStable,gifFrontLegMoves:gifRig.frontLegMoves,gifHindLegsMove:gifRig.hindLegsMove,
    pngSwordStable:pngRig.swordStable,pngFrontLegMoves:pngRig.frontLegMoves,pngHindLegsMove:pngRig.hindLegsMove };
}

async function runSelectorSmoke() {
  const initialPet = pet, initialSettings = { ...settings };
  const waitPanel = async predicate => {
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if (await panel.webContents.executeJavaScript(predicate)) return true; } catch { /* Cargando la página. */ }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return false;
  };
  const savePanel = async name => {
    await panel.webContents.executeJavaScript('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    const image = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('No se pudo capturar el selector.')), 3000);
      panel.webContents.once('paint', (_event, _rect, image) => { clearTimeout(timeout); resolve(image); });
      panel.webContents.invalidate();
    });
    fs.writeFileSync(path.join(smokeRoot, name), image.toPNG());
  };
  const columns = await panel.webContents.executeJavaScript(`(() => {
    const greeting = document.querySelector('.character-card'), obs = document.querySelector('.obs-card');
    const g = greeting.getBoundingClientRect(), o = obs.getBoundingClientRect();
    return !document.querySelector('.pet-card') && greeting.closest('.visual-column') && g.top >= o.bottom && Math.abs(g.width - o.width) < 1;
  })()`);
  await panel.webContents.executeJavaScript(`document.querySelector('.companion-actions').scrollIntoView({block:'end'}); true`);
  await savePanel('panel-controls.png');
  const beforeBrowse = JSON.stringify(settings), activeBeforeBrowse = petId(pet);
  await panel.webContents.executeJavaScript(`document.getElementById('choose-companion').click(); true`);
  const opensSelector = await waitPanel(`location.pathname === '/pets' && document.documentElement?.dataset.libraryReady === 'true'`);
  const libraryNames = opensSelector && await panel.webContents.executeJavaScript(`['EduGhost','EduScream','EduFrankenstein','EduPiramyd'].every(name => [...document.querySelectorAll('.pet-choice h2')].some(heading => heading.textContent === name))`);
  const previewsLoaded = opensSelector && await waitPanel(`(() => {
    const frames = [...document.querySelectorAll('.pet-preview iframe')];
    return frames.length >= 3 && frames.every(frame => { const doc=frame.contentDocument, pet=doc?.getElementById('pet'); return doc?.documentElement?.dataset.connected==='true' && pet?.naturalWidth>0 && getComputedStyle(doc.getElementById('pet-anchor')).visibility==='visible'; });
  })()`);
  const includedIds = ['EduGhost', 'EduScream', 'EduFrankenstein', 'EduPiramyd'].map(name => petId(parsePet(fs.readFileSync(path.join(root, 'pets', name + '.aulapet')))));
  const rememberPreviews = `(() => [...document.querySelectorAll('.pet-choice')].filter(card => ${JSON.stringify(includedIds)}.includes(card.dataset.petId)).map(card => { const doc=card.querySelector('iframe').contentDocument; const canvas=doc.querySelector('#pet-body.flipbook-active #pet-flipbook, #pet-body.cloth-active #pet-cloth'); return canvas ? canvas.toDataURL() : doc.getElementById('pet-body').style.transform; }))()`;
  const firstFrames = previewsLoaded ? await panel.webContents.executeJavaScript(rememberPreviews) : [];
  await new Promise(resolve => setTimeout(resolve, 450));
  const nextFrames = previewsLoaded ? await panel.webContents.executeJavaScript(rememberPreviews) : [];
  const previewsAnimate = firstFrames.length >= 3 && firstFrames.every((image, index) => image !== nextFrames[index]);
  const selectionMarked = opensSelector && await panel.webContents.executeJavaScript(`document.querySelectorAll('.pet-choice.selected').length === 1 && document.querySelector('.pet-choice.selected').dataset.petId === ${JSON.stringify(activeBeforeBrowse)}`);
  const browseKeepsSettings = JSON.stringify(settings) === beforeBrowse && petId(pet) === activeBeforeBrowse;
  const independentPreviews = server.stats().obs <= 1;
  if (opensSelector) await savePanel('pet-selector.png');
  const invalidChoiceRejected = opensSelector && await panel.webContents.executeJavaScript(`window.aula.selectPet('../pets/EduGhost.aulapet').then(result => Boolean(result.error))`);
  const targetName = pet.name === 'EduScream' ? 'EduGhost' : 'EduScream';
  const targetId = petId(parsePet(fs.readFileSync(path.join(root, 'pets', targetName + '.aulapet'))));
  if (opensSelector) await panel.webContents.executeJavaScript(`(() => { const card=[...document.querySelectorAll('.pet-choice')].find(card=>card.dataset.petId===${JSON.stringify(targetId)}); card.querySelector('button').click(); return true; })()`);
  const returnsToPanel = await waitPanel(`location.pathname === '/panel' && document.getElementById('companion-choice-name')?.textContent === ${JSON.stringify(targetName)}`);
  const selectsCharacter = returnsToPanel && pet.name === targetName && selectedPetFile === petId(pet) + '.aulapet';
  const catalogEntry = library.entries.get(petId(pet));
  const animationPreserved = selectsCharacter && JSON.stringify(pet.animation) === JSON.stringify(catalogEntry.pet.animation) && JSON.stringify(pet.behavior) === JSON.stringify(catalogEntry.pet.behavior);
  activatePet(initialPet, false); changeSettings(initialSettings);
  return { columns: Boolean(columns), opensSelector, libraryNames, previewsLoaded, previewsAnimate, selectionMarked, browseKeepsSettings, independentPreviews, invalidChoiceRejected, returnsToPanel, selectsCharacter, animationPreserved };
}

app.on('before-quit', () => {
  if (!gotLock) return;
  quitting = true;
  clearInterval(timer); clearTimeout(settingsTimer);
  globalShortcut.unregisterAll();
  savePreferences(); server?.close();
});
app.on('window-all-closed', () => { if (!tray) app.quit(); });
if (gotLock) app.whenReady().then(start).catch(error => {
  console.error(error);
  if (!smoke) dialog.showErrorBox('No se pudo iniciar Aula Fantasma', error.message);
  app.exit(1);
});
