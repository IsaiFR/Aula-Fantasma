'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { petLayout, bubbleLayout } = require('../web/layout.js');
const { DEFAULTS, sanitizeSettings } = require('../src/settings.cjs');

test('El globo de BOO queda dentro del lienzo en los cuatro bordes y distintos tamaños', () => {
  for (const [width, height] of [[1920,1080], [2560,1440], [320,180], [1080,1920], [1024,768]]) {
    for (const size of [60, 150, 300]) {
      for (const [x, y] of [[0,0], [1,0], [0,1], [1,1], [0.5,0.5], [0,0.5], [1,0.5]]) {
        const pet = petLayout(width, height, { ...DEFAULTS, size, margin: 0 }, { x, y, bob: -10 });
        const bubbleWidth = 110 * pet.scale, bubbleHeight = 52 * pet.scale;
        const bubble = bubbleLayout(width, height, pet, bubbleWidth, bubbleHeight);
        assert.ok(pet.x >= 0 && pet.x + pet.size <= width + 0.001);
        assert.ok(pet.y >= 0 && pet.y + pet.size <= height + 0.001);
        assert.ok(bubble.x >= 0 && bubble.x + bubbleWidth <= width + 0.001);
        assert.ok(bubble.y >= 0 && bubble.y + bubbleHeight <= height + 0.001);
      }
    }
  }
});

test('El globo cambia a debajo al llegar al borde superior y queda arriba en el inferior', () => {
  const top = petLayout(1920,1080,DEFAULTS,{x:0.5,y:0,bob:0});
  const bottom = petLayout(1920,1080,DEFAULTS,{x:0.5,y:1,bob:0});
  assert.equal(bubbleLayout(1920,1080,top,110,52).placement, 'below');
  assert.equal(bubbleLayout(1920,1080,bottom,110,52).placement, 'above');
});

test('El intervalo de BOO solo acepta segundos dentro del rango de los controles', () => {
  assert.equal(sanitizeSettings({ booInterval: 0 }).booInterval, 10);
  assert.equal(sanitizeSettings({ booInterval: 1000 }).booInterval, 120);
  assert.equal(sanitizeSettings({ booInterval: '25' }).booInterval, 25);
  assert.equal(sanitizeSettings({ booEnabled: 'false', blink: null }).booEnabled, true);
});
