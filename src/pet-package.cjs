'use strict';
const crypto = require('node:crypto');
const { behaviorProfile } = require('./behavior.cjs');
const FORMAT = 'aula-fantasma-pet';
const VERSION = 11;
const MAX_FILE = 32 * 1024 * 1024;
const MAX_IMAGE = 20 * 1024 * 1024;
const FLOAT = { enabled: true, amplitude: 10, frequency: 2.1, tiltAmplitude: 1.8, tiltFrequency: 1.25, stretchAmplitude: 0.008, stretchPhase: 0.4 };
const CLOTH = { enabled: false, startY: 0.4, fullY: 0.87, tail: null, protectedRegions: [], amplitudeX: 0.022, amplitudeX2: 0.009, amplitudeY: 0.011, frequencyY: 13, speedX: 2.7, frequencyX2: 17, frequencyY2: 8, speedX2: 1.9, frequencyX: 18, speedY: 2.3, frequencyY3: 3 };
const BLINK = { enabled: false, intervalMin: 3, intervalMax: 6, duration: 0.2, closeDuration: 0.04, openDuration: 0.06, regions: [] };
const EDUGHOST_ANIMATION = {
  float: { ...FLOAT },
  cloth: { ...CLOTH, enabled: true, tail: { startX: 0.25, endX: 0.35, startY: 0.64, endY: 0.8 }, protectedRegions: [{ cx: 0.588, cy: 0.737, rx: 0.075, ry: 0.061 }, { cx: 0.711, cy: 0.733, rx: 0.074, ry: 0.063 }] },
  blink: { ...BLINK, enabled: true, regions: [{ cx: 0.533, cy: 0.297, rx: 0.062, ry: 0.051 }, { cx: 0.693, cy: 0.285, rx: 0.048, ry: 0.05 }] }
};
function fail(message) { throw new Error(message); }
function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label}: se esperaba un objeto.`);
  return value;
}
function keys(value, allowed, label) {
  object(value, label);
  if (Object.keys(value).some(key => !allowed.includes(key))) fail(`${label}: contiene campos no admitidos.`);
}
function number(value, min, max, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(`${label}: valor fuera del rango admitido.`);
  return value;
}
function regions(value, label) {
  if (!Array.isArray(value) || value.length > 16) fail(`${label}: se admiten hasta 16 regiones.`);
  return value.map(region => {
    keys(region, ['cx', 'cy', 'rx', 'ry'], label);
    return { cx: number(region.cx, 0, 1, label), cy: number(region.cy, 0, 1, label), rx: number(region.rx, 0.001, 1, label), ry: number(region.ry, 0.001, 1, label) };
  });
}
function animationProfile(input = {}) {
  keys(input, ['float', 'cloth', 'blink'], 'Animación');
  const result = {};
  for (const [section, defaults] of Object.entries({ float: FLOAT, cloth: CLOTH, blink: BLINK })) {
    const source = input[section] ?? {};
    keys(source, Object.keys(defaults), section);
    const value = { ...defaults, ...source };
    if (typeof value.enabled !== 'boolean') fail(`${section}: enabled debe ser booleano.`);
    result[section] = value;
  }
  const f = result.float, c = result.cloth, b = result.blink;
  for (const key of ['amplitude', 'tiltAmplitude']) number(f[key], 0, key === 'amplitude' ? 30 : 15, `float.${key}`);
  for (const key of ['frequency', 'tiltFrequency']) number(f[key], 0.1, 10, `float.${key}`);
  number(f.stretchAmplitude, 0, 0.1, 'float.stretchAmplitude'); number(f.stretchPhase, -10, 10, 'float.stretchPhase');
  number(c.startY, 0, 0.99, 'cloth.startY'); number(c.fullY, c.startY + 0.001, 1, 'cloth.fullY');
  for (const key of ['amplitudeX', 'amplitudeX2', 'amplitudeY']) number(c[key], 0, 0.08, `cloth.${key}`);
  for (const key of ['frequencyY', 'frequencyX2', 'frequencyY2', 'frequencyX', 'frequencyY3']) number(c[key], 0, 50, `cloth.${key}`);
  for (const key of ['speedX', 'speedX2', 'speedY']) number(c[key], 0, 10, `cloth.${key}`);
  c.protectedRegions = regions(c.protectedRegions, 'cloth.protectedRegions');
  if (c.tail !== null) {
    keys(c.tail, ['startX', 'endX', 'startY', 'endY'], 'cloth.tail');
    c.tail = { ...c.tail };
    number(c.tail.startX, 0, 0.99, 'tail.startX'); number(c.tail.endX, c.tail.startX + 0.001, 1, 'tail.endX');
    number(c.tail.startY, 0, 0.99, 'tail.startY'); number(c.tail.endY, c.tail.startY + 0.001, 1, 'tail.endY');
  }
  number(b.intervalMin, 0.5, 60, 'blink.intervalMin'); number(b.intervalMax, b.intervalMin, 120, 'blink.intervalMax');
  number(b.duration, 0.05, 2, 'blink.duration');
  number(b.closeDuration, 0.01, b.duration / 2, 'blink.closeDuration'); number(b.openDuration, 0.01, b.duration / 2, 'blink.openDuration');
  b.regions = regions(b.regions, 'blink.regions');
  return result;
}
function imageMime(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString())) return 'image/gif';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  fail('Usa una imagen PNG, WebP o GIF válida.');
}
function image(value) {
  keys(value, ['mime', 'dataBase64'], 'Imagen');
  if (typeof value.dataBase64 !== 'string' || value.dataBase64.length > Math.ceil(MAX_IMAGE / 3) * 4 || value.dataBase64.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(value.dataBase64)) fail('La imagen contiene datos no válidos o supera 20 MB.');
  const bytes = Buffer.from(value.dataBase64, 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE || bytes.toString('base64') !== value.dataBase64 || imageMime(bytes) !== value.mime) fail('El formato de la imagen no coincide con sus datos.');
  return { mime: value.mime, bytes };
}
function parsePet(data) {
  if (Buffer.byteLength(data) > MAX_FILE) fail('La mascota debe pesar como máximo 32 MB.');
  let manifest;
  try { manifest = JSON.parse(data.toString()); } catch { fail('No se pudo leer el archivo de mascota.'); }
  if (manifest?.format !== FORMAT || ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, VERSION].includes(manifest.version) || (manifest.version >= 6 && manifest.version <= 10 && manifest.kind !== 'voice') || (manifest.version === 11 && manifest.kind !== 'companion')) fail('El formato o la versión de esta mascota no es compatible.');
  const isVoice = manifest.version >= 6 && manifest.version <= 10;
  keys(manifest, manifest.version === 1 ? ['format', 'version', 'name', 'images', 'animation'] : ['format', 'version', 'name', 'images', 'animation', 'behavior', ...(manifest.version >= 6 ? ['kind'] : []), ...(isVoice && manifest.version >= 8 ? ['effects'] : [])], 'Mascota');
  if (typeof manifest.name !== 'string' || !manifest.name.trim() || manifest.name.length > 80 || /[\x00-\x1f]/.test(manifest.name)) fail('La mascota necesita un nombre válido de hasta 80 caracteres.');
  keys(manifest.images, manifest.version === 11 ? ['open', 'atlas'] : isVoice ? ['open', 'closed', 'talking', 'talkingClosed', ...(manifest.version >= 9 ? ['bat'] : []), ...(manifest.version >= 10 ? ['batOpen', 'batClosed', 'batTalkingClosed'] : [])] : manifest.version === 1 ? ['open', 'closed'] : manifest.version === 2 ? ['open', 'closed', 'atlas'] : manifest.version === 3 ? ['open', 'closed', 'atlas', 'limb'] : manifest.version === 4 ? ['open', 'closed', 'atlas', 'limb', 'walk', 'greeting', 'frames'] : ['open', 'closed', 'atlas', 'limb', 'walk', 'greeting', 'frames', 'cycle'], 'Imágenes');
  const images = { open: image(manifest.images.open) };
  if (manifest.images.closed !== undefined) images.closed = image(manifest.images.closed);
  if (manifest.images.atlas !== undefined) images.atlas = image(manifest.images.atlas);
  if (manifest.images.limb !== undefined) images.limb = image(manifest.images.limb);
  for (const kind of ['walk', 'greeting', 'frames', 'cycle', 'talking', 'talkingClosed', 'bat', 'batOpen', 'batClosed', 'batTalkingClosed']) if (manifest.images[kind] !== undefined) images[kind] = image(manifest.images[kind]);
  const animation = animationProfile(manifest.animation);
  if (animation.blink.enabled && !images.closed) fail('Para parpadear se necesita la imagen de ojos cerrados.');
  if (animation.cloth.enabled && images.open.mime === 'image/gif') fail('La ondulación necesita una imagen PNG o WebP estática.');
  const result = { name: manifest.name.trim(), images, animation };
  if (manifest.effects !== undefined) {
    keys(manifest.effects, ['ghostOpacity', ...(manifest.version >= 9 ? ['draculaBat'] : [])], 'Efectos');
    result.effects = {};
    if (manifest.effects.ghostOpacity !== undefined) {
      keys(manifest.effects.ghostOpacity, ['fadeSeconds'], 'ghostOpacity');
      result.effects.ghostOpacity = { fadeSeconds: number(manifest.effects.ghostOpacity.fadeSeconds, .1, 3, 'ghostOpacity.fadeSeconds') };
    }
    if (manifest.effects.draculaBat !== undefined) {
      const bat = manifest.effects.draculaBat;
      keys(bat, ['transitionSeconds', 'wingLeft', 'wingRight', 'wingRootY'], 'draculaBat');
      if (images.bat?.mime !== 'image/png') fail('La transformación necesita una imagen bat PNG.');
      result.effects.draculaBat = {
        transitionSeconds: number(bat.transitionSeconds, .1, 3, 'draculaBat.transitionSeconds'),
        wingLeft: number(bat.wingLeft, .15, .45, 'draculaBat.wingLeft'),
        wingRight: number(bat.wingRight, .55, .85, 'draculaBat.wingRight'),
        wingRootY: number(bat.wingRootY, .2, .8, 'draculaBat.wingRootY')
      };
    }
    if (!Object.keys(result.effects).length) fail('Efectos: declara al menos un efecto.');
  }
  if (images.bat && !result.effects?.draculaBat) fail('La imagen bat necesita el efecto draculaBat.');
  if (['batOpen', 'batClosed', 'batTalkingClosed'].some(kind => images[kind]) || manifest.version >= 10 && result.effects?.draculaBat) {
    if (!result.effects?.draculaBat || ['batOpen', 'batClosed', 'batTalkingClosed'].some(kind => images[kind]?.mime !== 'image/png')) fail('El murciélago de voz necesita sus cuatro poses PNG.');
  }
  if (isVoice) {
    if (!images.talking) fail('Una mascota de voz necesita la imagen hablando.');
    if (animation.blink.enabled && (!images.closed || !images.talkingClosed)) fail('El parpadeo de voz necesita ojos cerrados en silencio y hablando.');
    if (animation.blink.regions.length) fail('Las mascotas de voz usan imágenes completas sin máscara de ojos.');
    if (animation.cloth.enabled && (manifest.version < 7 || Object.values(images).some(resource => resource.mime !== 'image/png'))) fail('La sábana de voz necesita formato v7 y poses PNG.');
    result.kind = 'voice';
  }
  if (manifest.version >= 2) {
    result.behavior = behaviorProfile(object(manifest.behavior, 'Comportamiento'));
    if (result.kind === 'voice' && (result.behavior.rig || result.behavior.flipbook || result.behavior.cycle || result.behavior.vehicle)) fail('La voz no se puede combinar con otro motor de animación.');
    if (manifest.version === 11 && !result.behavior.vehicle) fail('El formato v11 necesita un vehículo.');
    if (result.behavior.vehicle && (manifest.version !== 11 || images.atlas?.mime !== 'image/png' || images.open.mime !== 'image/png' || animation.float.enabled || animation.cloth.enabled || animation.blink.enabled)) fail('El vehículo necesita formato v11, atlas PNG y su propio movimiento.');
    if (result.behavior.rig && (!images.atlas || images.atlas.mime !== 'image/png')) fail('Las capas necesitan un atlas PNG transparente.');
    if (result.behavior.rig?.layers.some(layer => layer.role === 'freeFoot') && (manifest.version < 3 || !images.limb || images.limb.mime !== 'image/png')) fail('La cuarta pata necesita una imagen limb PNG y formato v3.');
    if (result.behavior.rig && (animation.cloth.enabled || animation.blink.enabled || animation.float.enabled)) fail('Las capas articuladas usan su propio movimiento; desactiva flotación, sábana y parpadeo.');
    if (result.behavior.flipbook) {
      if (manifest.version < 4 || images.walk?.mime !== 'image/gif' || images.greeting?.mime !== 'image/gif' || images.frames?.mime !== 'image/png') fail('Los fotogramas necesitan formato v4, dos GIF y la hoja PNG.');
      if (animation.cloth.enabled || animation.blink.enabled || animation.float.enabled) fail('El GIF incluye su movimiento; desactiva flotación, sábana y parpadeo.');
    }
    if (result.behavior.cycle) {
      if (manifest.version < 5 || images.cycle?.mime !== 'image/gif' || images.frames?.mime !== 'image/png') fail('El ciclo necesita formato v5, GIF y hoja PNG.');
      if (animation.cloth.enabled || animation.blink.enabled || animation.float.enabled) fail('El ciclo incluye su movimiento; desactiva flotación, sábana y parpadeo.');
      const { gifInfo } = require('./gif.cjs');
      const config = result.behavior.cycle, info = gifInfo(images.cycle.bytes);
      if (info.width !== config.size || info.height !== config.size || info.frames !== config.sequence.length || Math.abs(info.duration - config.sequence.reduce((sum, entry) => sum + entry.seconds, 0)) > .011) fail('El GIF no coincide con el ciclo.');
      if (images.frames.bytes.length < 24 || images.frames.bytes.readUInt32BE(16) !== config.size * config.columns || images.frames.bytes.readUInt32BE(20) !== config.size * config.rows) fail('La hoja no coincide con el ciclo.');
    }
  }
  return result;
}
function serializePet(pet) {
  const images = Object.fromEntries(Object.entries(pet.images).map(([key, value]) => [key, { mime: value.mime, dataBase64: value.bytes.toString('base64') }]));
  const bytes = Buffer.from(JSON.stringify({ format: FORMAT, version: pet.kind === 'voice' ? (pet.effects?.draculaBat ? (pet.images.batOpen ? 10 : 9) : pet.effects ? 8 : pet.animation.cloth.enabled ? 7 : 6) : pet.behavior ? (pet.behavior.vehicle ? 11 : pet.behavior.cycle ? 5 : pet.behavior.flipbook ? 4 : pet.images.limb ? 3 : 2) : 1, ...(pet.kind === 'voice' ? { kind: 'voice' } : pet.behavior?.vehicle ? { kind: 'companion' } : {}), name: pet.name, images, animation: pet.animation, ...(pet.behavior ? { behavior: pet.behavior } : {}), ...(pet.effects ? { effects: pet.effects } : {}) }, null, 2) + '\n');
  parsePet(bytes); // Exportar solamente archivos que se puedan volver a cargar.
  return bytes;
}
function fromImage(bytes, name) {
  return parsePet(serializePet({ name, images: { open: { bytes, mime: imageMime(bytes) } }, animation: animationProfile() }));
}
function petId(pet) { return crypto.createHash('sha256').update(serializePet(pet)).digest('hex'); }
function safeFilename(name, extension = 'aulapet') {
  let safe = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/g, '').slice(0, 80) || 'Mascota';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(safe)) safe = `Mascota_${safe}`;
  return `${safe}.${extension === 'pet' ? 'pet' : 'aulapet'}`;
}
module.exports = { FORMAT, VERSION, MAX_FILE, MAX_IMAGE, EDUGHOST_ANIMATION, animationProfile, imageMime, parsePet, serializePet, fromImage, petId, safeFilename };
