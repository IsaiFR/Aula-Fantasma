'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Motion } = require('../src/motion.cjs');
const { DEFAULTS, sanitizeSettings } = require('../src/settings.cjs');
const { petLayout } = require('../web/layout.js');
const settings = { ...DEFAULTS, visibleSeconds: 5, awaySeconds: 5, booEnabled: false, mode: 'free' };
const advance = (motion, seconds, config = settings) => {
  for (let i = 0; i < Math.round(seconds * 100); i++) motion.advance(.01, config);
  return motion.frame(config);
};

test('Sale, permanece fuera el tiempo configurado, entra y repite el ciclo', () => {
  const motion = new Motion();
  assert.equal(advance(motion, 4.9).presence.phase, 'visible');
  assert.equal(advance(motion, .2).presence.phase, 'leaving');
  const stopped = motion.frame(settings);
  assert.equal(advance(motion, 2).presence.phase, 'away');
  const away = motion.frame(settings);
  assert.equal(away.presence.progress, 1);
  assert.equal(away.presence.secondsLeft, 5);
  assert.equal(advance(motion, 4.7).presence.phase, 'away');
  assert.equal(motion.x, stopped.x); assert.equal(motion.y, stopped.y);
  assert.equal(motion.elapsed, away.elapsed);
  assert.equal(advance(motion, .4).presence.phase, 'entering');
  assert.equal(advance(motion, 2).presence.phase, 'visible');
  const after = advance(motion, 1);
  assert.notEqual(after.x, stopped.x);
  assert.equal(advance(motion, 4).presence.phase, 'leaving');
});

test('Pausar congela salida, ausencia y regreso; reanudar conserva el tiempo restante', () => {
  for (const time of [5.5, 8, 12.5]) {
    const motion = new Motion(); advance(motion, time);
    const before = motion.frame(settings);
    advance(motion, 60, { ...settings, paused: true });
    assert.deepEqual(motion.frame(settings), before);
    advance(motion, .5);
    assert.notDeepEqual(motion.frame(settings).presence, before.presence);
  }
});

test('Desactivar apariciones recupera la mascota; modificar la espera reinicia su contador', () => {
  const motion = new Motion(); advance(motion, 8);
  const changed = { ...settings, awaySeconds: 20 };
  const rescheduled = motion.advance(0, changed);
  assert.equal(rescheduled.presence.phase, 'away');
  assert.equal(rescheduled.presence.secondsLeft, 20);
  const recovered = motion.advance(0, { ...settings, presenceEnabled: false });
  assert.equal(recovered.presence.phase, 'visible');
  assert.equal(recovered.presence.progress, 0);
  assert.equal(advance(motion, 100, { ...settings, presenceEnabled: false }).presence.phase, 'visible');
  assert.equal(motion.advance(0, settings).presence.secondsLeft, 5);
  motion.reset(); assert.equal(motion.frame(settings).presence.phase, 'visible');
});

test('Termina BOO antes de salir y no inicia saludos mientras está fuera', () => {
  const motion = new Motion({ random: () => .5 });
  const config = { ...settings, booEnabled: true, booInterval: 10 };
  advance(motion, 4.9, config); motion.booNow(config);
  assert.equal(advance(motion, 1, config).presence.phase, 'visible');
  assert.equal(advance(motion, 2.4, config).presence.phase, 'leaving');
  assert.equal(motion.frame(config).boo, false);
  motion.booNow(config); assert.equal(motion.frame(config).boo, false);
  const away = advance(motion, 2, config);
  const booIn = motion.booIn;
  motion.booNow(config); advance(motion, 3, config);
  assert.equal(motion.booIn, booIn);
  assert.equal(motion.frame(config).boo, false);
  assert.equal(away.presence.phase, 'away');
});

test('Funciona quieto en una esquina y elige el lateral más cercano', () => {
  const motion = new Motion();
  const still = { ...settings, mode: 'still' };
  const leaving = advance(motion, 5.5, still);
  assert.equal(leaving.presence.side, 'right');
  assert.equal(leaving.x, 1); assert.equal(leaving.y, 1);
  const left = new Motion(); left.x = .1;
  assert.equal(advance(left, 5.5).presence.side, 'left');
});

test('El personaje cruza completamente ambos bordes en diferentes tamaños de pantalla', () => {
  for (const [width, height] of [[1920,1080], [960,540], [320,180], [1080,1920]]) {
    for (const side of ['left', 'right']) {
      const frame = { x: .5, y: .7, bob: 0, presence: { progress: 0, side } };
      const inside = petLayout(width, height, settings, frame);
      const middle = petLayout(width, height, settings, { ...frame, presence: { progress: .5, side } });
      const outside = petLayout(width, height, settings, { ...frame, presence: { progress: 1, side } });
      assert.ok(inside.x >= 0 && inside.x + inside.size <= width);
      if (side === 'left') { assert.ok(outside.x + outside.size < 0); assert.ok(middle.x < inside.x); }
      else { assert.ok(outside.x > width); assert.ok(middle.x > inside.x); }
      assert.equal(outside.y, inside.y);
    }
  }
});

test('Valida intervalos, booleanos y conserva preferencias antiguas', () => {
  assert.equal(sanitizeSettings({ visibleSeconds: 0 }).visibleSeconds, 5);
  assert.equal(sanitizeSettings({ awaySeconds: 9999 }).awaySeconds, 600);
  assert.equal(sanitizeSettings({ awaySeconds: '60' }).awaySeconds, 60);
  assert.equal(sanitizeSettings({ visibleSeconds: NaN }).visibleSeconds, 35);
  assert.equal(sanitizeSettings({ presenceEnabled: 'false' }).presenceEnabled, true);
  assert.equal(sanitizeSettings({ presenceEnabled: false }).presenceEnabled, false);
  const old = sanitizeSettings({ size: 200, bob: false });
  assert.equal(old.presenceEnabled, true); assert.equal(old.size, 200); assert.equal('bob' in old, false);
});
