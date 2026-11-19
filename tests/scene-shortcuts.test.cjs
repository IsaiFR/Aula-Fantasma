'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSceneShortcuts, normalizeShortcut } = require('../src/scene-shortcuts.cjs');

test('scene shortcuts keep Shift as a modifier and reject unmodified letters', () => {
  assert.equal(normalizeShortcut(' alt + CONTROL + 1 '), 'Ctrl+Alt+1');
  assert.equal(normalizeShortcut('shift+a'), 'Shift+A');
  assert.equal(normalizeShortcut('win+shift+f8'), 'Shift+Super+F8');
  assert.equal(normalizeShortcut('f11'), 'F11');
  assert.equal(normalizeShortcut(''), '');
  for (const invalid of ['A', 'Shift', 'Ctrl+Ctrl+A', 'Ctrl++A', 'Ctrl+F25', {}]) assert.equal(normalizeShortcut(invalid), null);
});

test('scene shortcuts keep the current binding when another scene or Windows owns the new one', () => {
  const shortcuts = new Map([['Alt+F9', () => {}]]);
  const globalShortcut = {
    register(key, callback) {
      if (shortcuts.has(key)) return false;
      shortcuts.set(key, callback);
      return true;
    },
    unregister: key => shortcuts.delete(key)
  };
  const selected = [];
  const scenes = createSceneShortcuts(globalShortcut, ['inicio', 'apuntes'], (name, shortcut) => selected.push([name, shortcut]), 'CommandOrControl+Shift+C');
  assert.equal(scenes.change('inicio', 'Ctrl+Alt+1'), null);
  assert.equal(scenes.snapshot().inicio.numpadActive, true);
  assert.match(scenes.change('apuntes', 'Alt+Control+1'), /otra escena/);
  assert.match(scenes.change('inicio', 'Ctrl+Shift+C'), /cronómetro/);
  assert.match(scenes.change('inicio', 'Alt+F9'), /Windows/);
  shortcuts.get('Ctrl+Alt+1')();
  shortcuts.get('Ctrl+Alt+num1')();
  assert.deepEqual(selected, [['inicio', 'Ctrl+Alt+1'], ['inicio', 'Ctrl+Alt+1']]);
  assert.equal(scenes.change('inicio', ''), null);
  assert.equal(shortcuts.has('Ctrl+Alt+1'), false);
  assert.equal(shortcuts.has('Ctrl+Alt+num1'), false);
  scenes.restore({ inicio: 'F8', apuntes: 'Alt+F9' });
  assert.deepEqual(scenes.snapshot(), { inicio: { shortcut: 'F8', active: true }, apuntes: { shortcut: 'Alt+F9', active: false } });
  assert.deepEqual(scenes.values(), { inicio: 'F8', apuntes: 'Alt+F9' });
  const occupied = () => {};
  shortcuts.set('Ctrl+Alt+num2', occupied);
  scenes.restore({ apuntes: 'Ctrl+Alt+2' });
  assert.deepEqual(scenes.snapshot().apuntes, { shortcut: 'Ctrl+Alt+2', active: true, numpadActive: false });
  assert.equal(shortcuts.get('Ctrl+Alt+num2'), occupied);
  shortcuts.delete('Ctrl+Alt+num2');
  assert.equal(scenes.change('apuntes', 'Ctrl+Alt+2'), null);
  assert.deepEqual(scenes.snapshot().apuntes, { shortcut: 'Ctrl+Alt+2', active: true, numpadActive: true });
});
