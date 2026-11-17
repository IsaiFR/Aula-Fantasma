'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Countdown, sanitizeCountdown, DEFAULT_COUNTDOWN } = require('../src/countdown.cjs');
const { parseTime, formatTime } = require('../web/countdown.js');

function fixture() {
  let now = 0;
  const timer = new Countdown(() => now);
  return { timer, at: seconds => { now = seconds * 1000; return timer.frame(); } };
}
test('Cuenta de preparación, cinco segundos visibles, ocultamiento, campana, últimos tres y cierre de tres segundos', () => {
  const { timer, at } = fixture();
  assert.deepEqual(timer.config, DEFAULT_COUNTDOWN);
  assert.equal(timer.frame().visible, false);
  timer.start();
  for (const [time, number] of [[0, 3], [1, 2], [2, 1], [2.999, 1]]) {
    const frame = at(time);
    assert.equal(frame.phase, 'ready'); assert.equal(frame.ready, number);
    assert.equal(frame.visible, true); assert.equal(frame.remaining, 120);
  }
  assert.equal(at(3).remaining, 120); assert.equal(at(3).phase, 'running');
  assert.equal(at(7.999).visible, true);
  assert.equal(at(8).remaining, 115); assert.equal(at(8).visible, false);
  assert.equal(at(112.999).bell, false);
  assert.equal(at(113).bell, true); assert.equal(at(113).remaining, 10); assert.equal(at(113).visible, false);
  assert.equal(at(115).bell, false);
  assert.equal(at(119.999).visible, false);
  assert.equal(at(120).remaining, 3); assert.equal(at(120).visible, true);
  assert.equal(at(122.99).remaining, 1);
  assert.equal(at(123).phase, 'finished'); assert.equal(at(123).visible, true);
  assert.equal(at(125.999).active, true); assert.equal(at(126).phase, 'done');
  assert.equal(at(126).visible, false); assert.equal(at(126).active, false);
});
test('Saltar fotogramas conserva el tiempo real; una reconexión tardía no recibe campana antigua', () => {
  const { timer, at } = fixture(); timer.start();
  assert.equal(at(48).remaining, 75);
  assert.equal(at(121).remaining, 2); assert.equal(at(121).bell, false);
  assert.equal(at(300).phase, 'done');
});
test('Duración mínima, reinicio, cancelación y protección de la duración activa', () => {
  const { timer, at } = fixture(); timer.configure({ seconds: 10 }); timer.start();
  const id = timer.frame().runId;
  at(1); timer.start(); assert.equal(at(2).ready, 1);
  timer.configure({ seconds: 80, x: 120 });
  assert.equal(timer.config.seconds, 10); assert.equal(timer.config.x, 120);
  assert.equal(at(3).bell, true); assert.equal(at(8).visible, false);
  assert.equal(at(10).remaining, 3); assert.equal(at(10).visible, true);
  assert.equal(at(13).phase, 'finished'); assert.equal(at(16).phase, 'done');
  timer.start(); assert.notEqual(timer.frame().runId, id);
  timer.stop(); assert.equal(timer.frame().active, false); assert.equal(timer.frame().visible, false);
  timer.configure({ seconds: 80 }); assert.equal(timer.config.seconds, 80);
});
test('Coordenadas desde abajo a la izquierda y contención en ambos formatos, sin perder la configuración', () => {
  const { timer } = fixture(); timer.configure({ x: 1900, y: 1900 }); timer.positioning = true;
  const landscape = timer.frame({ width: 1920, height: 1080 }), portrait = timer.frame({ width: 1080, height: 1920 });
  assert.equal(landscape.x, 1600); assert.equal(landscape.y, 924);
  assert.equal(portrait.x, 760); assert.equal(portrait.y, 1764);
  assert.equal(timer.config.x, 1900); assert.equal(timer.frame().visible, true);
  timer.start(); assert.equal(timer.positioning, false);
});
test('Valida límites y descarta parches no válidos', () => {
  assert.deepEqual(sanitizeCountdown({ seconds: -3, x: -10, y: Infinity }), { seconds: 10, x: 0, y: 48, desktopEnabled: false });
  assert.deepEqual(sanitizeCountdown({ seconds: 99999, x: 20000, y: 19.6 }), { seconds: 5999, x: 10000, y: 20, desktopEnabled: false });
  for (const input of [null, [], 'abc', { seconds: '120', x: NaN }]) assert.deepEqual(sanitizeCountdown(input), DEFAULT_COUNTDOWN);
});
test('Editar la duración después del cierre no resucita la actividad anterior', () => {
  const { timer, at } = fixture(); timer.start(); at(126);
  timer.configure({ seconds: 300 });
  assert.equal(timer.frame().phase, 'idle'); assert.equal(timer.frame().visible, false);
  assert.equal(timer.frame().remaining, 300);
});
test('Se puede ubicar el contador después de terminar y cada sesión identifica sus avisos', () => {
  const { timer, at } = fixture(); timer.start(); at(126); timer.togglePosition();
  assert.equal(timer.frame().phase, 'position'); assert.equal(timer.frame().visible, true);
  timer.togglePosition(); assert.equal(timer.frame().visible, false);
  const other = new Countdown(() => 0); other.start();
  assert.notEqual(other.frame().runId, timer.frame().runId);
});
test('El teclado admite minutos:segundos o segundos y rechaza formatos ambiguos', () => {
  for (const [text, seconds] of [['2:00', 120], ['150', 150], ['2:30', 150], [' 0:10 ', 10], ['99:59', 5999]]) {
    assert.equal(parseTime(text), seconds); assert.equal(parseTime(formatTime(seconds)), seconds);
  }
  for (const text of ['', '2:99', '2:3', '-10', '1.5', 'a', '1:20:10']) assert.ok(Number.isNaN(parseTime(text)));
});
