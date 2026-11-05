'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Motion } = require('../src/motion.cjs');
const { DEFAULTS: BASE_DEFAULTS, sanitizeSettings } = require('../src/settings.cjs');
// Estas pruebas aíslan recorrido/personaje. El ciclo de apariciones tiene su propia suite.
const DEFAULTS = { ...BASE_DEFAULTS, presenceEnabled: false };

test('Las preferencias rechazan claves, tipos y números no válidos', () => {
  const result = sanitizeSettings({ size: 900, speed: -4, opacity: NaN, desktopEnabled: 'false', mode: 'unknown', displayId: '../../file', exec: 'bad' });
  assert.equal(result.size, 300); assert.equal(result.speed, 10);
  assert.equal(result.opacity, DEFAULTS.opacity); assert.equal(result.desktopEnabled, true);
  assert.equal(result.mode, 'edges'); assert.equal(result.displayId, 'primary');
  assert.equal('exec' in result, false);
});

test('Pausar congela el recorrido y el balanceo; reanudar continúa', () => {
  const motion = new Motion(); const settings = { ...DEFAULTS, mode: 'free', bob: true };
  motion.advance(0.1, settings);
  const before = motion.frame(settings);
  for (let i = 0; i < 500; i++) motion.advance(0.1, { ...settings, paused: true });
  assert.deepEqual(motion.frame(settings), before);
  motion.advance(0.1, settings); assert.notEqual(motion.frame(settings).x, before.x);
});

test('Recorrer los bordes completa vueltas y mantiene siempre un borde', () => {
  const motion = new Motion(); const settings = { ...DEFAULTS, speed: 180 };
  const visited = new Set();
  for (let i = 0; i < 12000; i++) {
    const f = motion.advance(1 / 30, settings);
    assert.ok(f.x >= 0 && f.x <= 1 && f.y >= 0 && f.y <= 1);
    assert.ok(f.x === 0 || f.x === 1 || f.y === 0 || f.y === 1);
    if (f.x === 0) visited.add('left'); if (f.x === 1) visited.add('right');
    if (f.y === 0) visited.add('top'); if (f.y === 1) visited.add('bottom');
  }
  assert.equal(visited.size, 4);
});

test('Movimiento libre rebota y no sale de los límites incluso con cambios de tamaño', () => {
  const motion = new Motion();
  for (let i = 0; i < 30000; i++) {
    const frame = motion.advance(i % 17 === 0 ? 100 : 1 / 30, { ...DEFAULTS, mode: 'free', size: i % 2 ? 300 : 60, speed: 180 });
    assert.ok(frame.x >= 0 && frame.x <= 1 && frame.y >= 0 && frame.y <= 1);
  }
});

test('La posición quieta permanece en la esquina y reset restablece el motor', () => {
  const motion = new Motion(); const still = { ...DEFAULTS, mode: 'still' };
  const frame = motion.advance(0.1, still);
  assert.equal(frame.x, 1); assert.equal(frame.y, 1); assert.equal(frame.boo, false);
  motion.advance(0.1, { ...DEFAULTS, mode: 'free' });
  motion.reset(); assert.equal(motion.x, 0.78); assert.equal(motion.y, 1);
});

const advanceSeconds = (motion, settings, seconds) => {
  for (let i = 0; i < Math.round(seconds * 60); i++) motion.advance(1 / 60, settings);
};

test('La sábana pierde impulso durante BOO y recupera su ondulación al recorrer', () => {
  const motion = new Motion({ random: () => 0.5 });
  const settings = { ...DEFAULTS, mode: 'free', speed: 120 };
  advanceSeconds(motion, settings, 2);
  const traveling = motion.frame(settings).clothStrength;
  motion.booNow(settings);
  advanceSeconds(motion, settings, 1.5);
  const greeting = motion.frame(settings).clothStrength;
  assert.ok(greeting < traveling * 0.65);
  assert.ok(greeting > 0.4);
  advanceSeconds(motion, settings, 4);
  assert.ok(motion.frame(settings).clothStrength > greeting * 1.7);
});

test('La ondulación conserva la fase y amplitud al pausar; el perfil pertenece a la mascota', () => {
  const motion = new Motion();
  advanceSeconds(motion, DEFAULTS, 1);
  const before = motion.frame(DEFAULTS);
  advanceSeconds(motion, { ...DEFAULTS, paused: true }, 50);
  assert.equal(motion.frame(DEFAULTS).elapsed, before.elapsed);
  assert.equal(motion.frame(DEFAULTS).clothStrength, before.clothStrength);
  assert.equal('cloth' in sanitizeSettings({ cloth: false }), false);
  assert.equal('bob' in sanitizeSettings({ bob: false }), false);
  assert.equal('blink' in sanitizeSettings({ blink: false }), false);
  const profile = structuredClone(motion.animation);
  profile.float.enabled = false; profile.blink.enabled = false; profile.cloth.enabled = false;
  motion.setAnimation(profile);
  assert.equal(motion.frame(DEFAULTS).bob, 0);
  assert.equal(motion.frame(DEFAULTS).blink, 0);
  assert.equal(motion.animation.cloth.enabled, false);
});

test('BOO detiene el recorrido, conserva la flotación y continúa después del saludo', () => {
  const motion = new Motion({ random: () => 0.5 });
  const settings = { ...DEFAULTS, mode: 'free', booInterval: 10 };
  advanceSeconds(motion, settings, 10.1);
  const stopped = motion.frame(settings);
  assert.equal(stopped.boo, true);
  advanceSeconds(motion, settings, 2);
  const during = motion.frame(settings);
  assert.equal(during.x, stopped.x); assert.equal(during.y, stopped.y);
  assert.notEqual(during.bob, stopped.bob);
  advanceSeconds(motion, settings, 1.5);
  const after = motion.frame(settings);
  assert.equal(after.boo, false); assert.notEqual(after.x, stopped.x);
});

test('BOO se repite con el intervalo configurado y puede desactivarse durante el saludo', () => {
  const motion = new Motion({ random: () => 0.5 });
  const settings = { ...DEFAULTS, mode: 'free', booInterval: 10 };
  const starts = []; let wasSpeaking = false;
  for (let i = 0; i < 2400; i++) {
    const frame = motion.advance(1 / 60, settings);
    if (frame.boo && !wasSpeaking) starts.push(frame.elapsed);
    wasSpeaking = frame.boo;
  }
  assert.ok(starts.length >= 3);
  for (let i = 1; i < starts.length; i++) assert.ok(Math.abs(starts[i] - starts[i - 1] - 10) < 0.06);
  motion.booNow(settings);
  const before = motion.frame(settings);
  const after = motion.advance(0.1, { ...settings, booEnabled: false });
  assert.equal(after.boo, false); assert.notEqual(after.x, before.x);
});

test('Los parpadeos cierran y abren los ojos sin detener el recorrido', () => {
  const motion = new Motion({ random: () => 0.5 });
  const settings = { ...DEFAULTS, mode: 'free', booEnabled: false };
  advanceSeconds(motion, settings, 4.4);
  assert.equal(motion.frame(settings).blink, 0);
  let maxBlink = 0;
  const beforeX = motion.x;
  for (let i = 0; i < 20; i++) maxBlink = Math.max(maxBlink, motion.advance(1 / 60, settings).blink);
  assert.equal(maxBlink, 1); assert.notEqual(motion.x, beforeX);
  advanceSeconds(motion, settings, 0.2);
  assert.equal(motion.frame(settings).blink, 0);
});

test('La pausa manual congela flotación, parpadeo y temporizador de BOO', () => {
  const motion = new Motion({ random: () => 0.5 });
  const settings = { ...DEFAULTS, mode: 'free', booInterval: 10 };
  advanceSeconds(motion, settings, 4.55);
  motion.booNow(settings);
  const before = motion.frame(settings);
  advanceSeconds(motion, { ...settings, paused: true }, 120);
  assert.deepEqual(motion.frame(settings), before);
  advanceSeconds(motion, settings, 3.4);
  assert.equal(motion.frame(settings).boo, false);
});

test('En una esquina se mantiene quieto, pero sigue flotando, parpadeando y saludando', () => {
  const motion = new Motion({ random: () => 0.5 });
  const settings = { ...DEFAULTS, mode: 'still', booInterval: 10 };
  advanceSeconds(motion, settings, 4.55);
  const frame = motion.frame(settings);
  assert.equal(frame.x, 1); assert.equal(frame.y, 1);
  assert.ok(frame.blink > 0); assert.notEqual(frame.bob, 0);
  advanceSeconds(motion, settings, 5.6);
  assert.equal(motion.frame(settings).boo, true);
});
