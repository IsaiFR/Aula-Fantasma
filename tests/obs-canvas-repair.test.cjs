'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { repairCollection } = require('../scripts/fix-obs-pet-canvas.cjs');

test('La reparación separa la fuente vertical y corrige su encuadre sin cambiar otras fuentes ni la escena horizontal', () => {
  const item = { name: 'EduGhost', source_uuid: 'pet', visible: true, locked: false, bounds_type: 2, bounds: { x: 1752, y: 2800 }, pos: { x: 0, y: 0 }, scale_ref: { x: 1080, y: 1920 } };
  const original = { current_scene: 'Inicio', sources: [
    { name: 'EduGhost', uuid: 'pet', id: 'browser_source', settings: { url: 'http://127.0.0.1:18747/overlay', shutdown: false } },
    { name: 'Apuntes EduCat', settings: { items: [structuredClone(item)] } },
    { name: 'Apuntes EduCat Vertical', settings: { items: [structuredClone(item), { name: 'PDF', source_uuid: 'pdf' }] } },
    { name: 'PDF', uuid: 'pdf', settings: { width: 1752, height: 2800 } }
  ] }, before = structuredClone(original);
  const { collection, report } = repairCollection(original);
  assert.deepEqual(original, before);
  assert.equal(collection.sources[0].settings.width, 1920);
  assert.equal(collection.sources[0].settings.height, 1080);
  assert.deepEqual(collection.sources[1], original.sources[1]);
  assert.deepEqual(collection.sources[3], original.sources[3]);
  assert.deepEqual(collection.sources[2].settings.items[1], original.sources[2].settings.items[1]);
  const vertical = collection.sources.at(-1), updated = collection.sources[2].settings.items[0];
  assert.notEqual(vertical.uuid, 'pet'); assert.equal(updated.source_uuid, vertical.uuid);
  assert.equal(vertical.settings.width, 1080); assert.equal(vertical.settings.height, 1920);
  assert.equal(vertical.settings.url, original.sources[0].settings.url);
  assert.deepEqual(updated.bounds, { x: 1080, y: 1920 });
  assert.deepEqual(updated.pos_rel, { x: -.5625, y: -1 });
  assert.deepEqual(updated.bounds_rel, { x: 1.125, y: 2 });
  assert.equal(updated.visible, true); assert.equal(updated.locked, false);
  assert.deepEqual(report.scenes, ['Apuntes EduCat Vertical']);
  assert.deepEqual(repairCollection(collection).collection, collection);
});

test('La reparación rechaza colecciones que no corresponden a la fuente y escena esperadas', () => {
  assert.throws(() => repairCollection({ sources: [] }), /fuente local/);
  assert.throws(() => repairCollection({ sources: [{ name: 'EduGhost', id: 'browser_source', settings: { url: 'https://example.com' } }] }), /fuente local/);
});
