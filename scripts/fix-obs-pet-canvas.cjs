'use strict';
// Reparación puntual de la colección existente; sin tocar preferencias de Aula Fantasma.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { execFileSync } = require('node:child_process');

function repairCollection(collection) {
  const result = structuredClone(collection), sources = result.sources;
  if (!Array.isArray(sources)) throw new Error('La colección no contiene fuentes.');
  const original = sources.find(s => s.name === 'EduGhost' && s.id === 'browser_source');
  if (!original || !/^http:\/\/127\.0\.0\.1:\d+\/overlay(?:\?|$)/.test(original.settings?.url || '')) throw new Error('No se encontró la fuente local EduGhost esperada.');
  let vertical = sources.find(s => s.name === 'EduGhost Vertical');
  if (vertical && (vertical.id !== 'browser_source' || vertical.settings?.url !== original.settings.url)) throw new Error('Ya existe otra fuente llamada EduGhost Vertical.');
  const scenes = sources.filter(s => / Vertical$/.test(s.name) && s.settings?.items?.some(i => i.source_uuid === original.uuid || (vertical && i.source_uuid === vertical.uuid)));
  if (!scenes.length) throw new Error('No se encontraron escenas verticales que usen EduGhost.');
  if (!vertical) {
    vertical = structuredClone(original); vertical.name = 'EduGhost Vertical'; vertical.uuid = randomUUID();
    sources.push(vertical);
  }
  Object.assign(original.settings, { width: 1920, height: 1080 });
  Object.assign(vertical.settings, { width: 1080, height: 1920 });
  for (const scene of scenes) for (const item of scene.settings.items) {
    if (item.source_uuid !== original.uuid && item.source_uuid !== vertical.uuid) continue;
    Object.assign(item, {
      name: vertical.name, source_uuid: vertical.uuid, rot: 0, align: 5,
      scale_ref: { x: 1080, y: 1920 }, pos: { x: 0, y: 0 }, pos_rel: { x: -1080 / 1920, y: -1 },
      scale: { x: 1, y: 1 }, scale_rel: { x: 1, y: 1 },
      bounds_type: 2, bounds_align: 0, bounds_crop: false,
      bounds: { x: 1080, y: 1920 }, bounds_rel: { x: 1080 / 960, y: 2 },
      crop_left: 0, crop_top: 0, crop_right: 0, crop_bottom: 0
    });
  }
  return { collection: result, report: { horizontal: { name: original.name, width: 1920, height: 1080 }, vertical: { name: vertical.name, width: 1080, height: 1920 }, scenes: scenes.map(s => s.name) } };
}

if (require.main === module) {
  const argument = process.argv.find(a => a.startsWith('--collection='));
  const file = argument ? argument.slice('--collection='.length) : path.join(process.env.APPDATA, 'obs-studio', 'basic', 'scenes', 'Sin_Título.json');
  const before = fs.readFileSync(file), repaired = repairCollection(JSON.parse(before));
  const apply = process.argv.includes('--apply');
  if (apply) {
    const processes = execFileSync('tasklist.exe', ['/FI', 'IMAGENAME eq obs64.exe', '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true });
    if (/"obs64\.exe"/i.test(processes)) throw new Error('Cierra OBS antes de aplicar la reparación.');
    if (!fs.readFileSync(file).equals(before)) throw new Error('La colección cambió durante la preparación; vuelve a ejecutar.');
    fs.writeFileSync(file, JSON.stringify(repaired.collection, null, 4));
    if (JSON.stringify(JSON.parse(fs.readFileSync(file))) !== JSON.stringify(repaired.collection)) throw new Error('Falló la verificación de la colección guardada.');
  }
  console.log(JSON.stringify({ applied: apply, ...repaired.report }, null, 2));
}
module.exports = { repairCollection };
