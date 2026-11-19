'use strict';

const modifiers = new Map(Object.entries({ CTRL: 'Ctrl', CONTROL: 'Ctrl', COMMANDORCONTROL: 'Ctrl', CMDORCTRL: 'Ctrl',
  ALT: 'Alt', SHIFT: 'Shift', SUPER: 'Super', WIN: 'Super', WINDOWS: 'Super', META: 'Super' }));
const modifierOrder = ['Ctrl', 'Alt', 'Shift', 'Super'];
const keys = new Map(Object.entries({ ESC: 'Escape', ESCAPE: 'Escape', ENTER: 'Enter', RETURN: 'Enter', SPACE: 'Space', TAB: 'Tab',
  BACKSPACE: 'Backspace', DELETE: 'Delete', INSERT: 'Insert', HOME: 'Home', END: 'End', PAGEUP: 'PageUp', PAGEDOWN: 'PageDown',
  UP: 'Up', DOWN: 'Down', LEFT: 'Left', RIGHT: 'Right', ARROWUP: 'Up', ARROWDOWN: 'Down', ARROWLEFT: 'Left', ARROWRIGHT: 'Right' }));

function normalizeShortcut(value) {
  if (typeof value !== 'string' || value.length > 64) return null;
  if (!value.trim()) return '';
  const parts = value.toUpperCase().trim().split(/\s*\+\s*/);
  const last = parts.pop();
  const functionKey = /^F(?:[1-9]|1\d|2[0-4])$/.test(last);
  const key = functionKey || /^[A-Z0-9]$/.test(last) ? last : keys.get(last);
  const prefix = parts.map(part => modifiers.get(part));
  if (!key || prefix.includes(undefined) || new Set(prefix).size !== prefix.length) return null;
  if (!functionKey && !prefix.length) return null;
  return [...modifierOrder.filter(modifier => prefix.includes(modifier)), key].join('+');
}

function numpadShortcut(shortcut) {
  return /\+\d$/.test(shortcut) ? shortcut.replace(/(\d)$/, 'num$1') : null;
}

function createSceneShortcuts(globalShortcut, scenes, onScene, reservedShortcut) {
  const reserved = normalizeShortcut(reservedShortcut);
  const saved = new Map(), registered = new Map();

  function register(scene, shortcut, accelerator = shortcut) {
    try { return globalShortcut.register(accelerator, () => onScene(scene, shortcut)); }
    catch { return false; }
  }

  function registerNumpad(scene, shortcut, accelerators) {
    const numpad = numpadShortcut(shortcut);
    if (numpad && !accelerators.includes(numpad) && register(scene, shortcut, numpad)) accelerators.push(numpad);
  }

  function registerBinding(scene, shortcut) {
    if (!register(scene, shortcut)) return null;
    const accelerators = [shortcut];
    registerNumpad(scene, shortcut, accelerators);
    return accelerators;
  }

  function unregister(accelerators) {
    for (const accelerator of accelerators) globalShortcut.unregister(accelerator);
  }

  function restore(values) {
    for (const accelerators of registered.values()) unregister(accelerators);
    registered.clear();
    saved.clear();
    for (const scene of scenes) {
      const shortcut = normalizeShortcut(values?.[scene]);
      if (!shortcut || shortcut === reserved || [...saved.values()].includes(shortcut)) continue;
      saved.set(scene, shortcut);
      const accelerators = registerBinding(scene, shortcut);
      if (accelerators) registered.set(scene, accelerators);
    }
  }

  function change(scene, value) {
    const shortcut = normalizeShortcut(value);
    if (!scenes.includes(scene) || shortcut === null) return 'Pulsa una combinación como Ctrl+Alt+1 o una tecla de función como F8.';
    if (shortcut === reserved) return 'Ese atajo está reservado para el cronómetro.';
    if (shortcut && [...saved].some(([name, existing]) => name !== scene && existing === shortcut)) return 'Ese atajo ya está asignado a otra escena.';
    const previous = registered.get(scene);
    if (previous && shortcut === saved.get(scene)) {
      registerNumpad(scene, shortcut, previous);
      return null;
    }
    const accelerators = shortcut ? registerBinding(scene, shortcut) : null;
    if (shortcut && !accelerators) return 'Windows no pudo registrar ese atajo. Prueba otra combinación.';
    if (previous) unregister(previous);
    if (accelerators) {
      saved.set(scene, shortcut);
      registered.set(scene, accelerators);
    } else {
      saved.delete(scene);
      registered.delete(scene);
    }
    return null;
  }

  return {
    restore, change,
    values: () => Object.fromEntries(saved),
    snapshot: () => Object.fromEntries(scenes.map(scene => {
      const shortcut = saved.get(scene) || '';
      const accelerators = registered.get(scene);
      const numpad = numpadShortcut(shortcut);
      return [scene, { shortcut, active: Boolean(accelerators), ...(numpad && accelerators ? { numpadActive: accelerators.includes(numpad) } : {}) }];
    }))
  };
}

module.exports = { createSceneShortcuts, normalizeShortcut };
