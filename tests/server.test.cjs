'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const { startServer } = require('../src/server.cjs');

const fixture = { x: 0.5, y: 1, settings: { obsEnabled: true }, assetUrl: '/mascota.svg' };
test('Sirve imágenes del paquete en memoria sin exponer su contenido o rutas locales', async t => {
  const fs = require('node:fs');
  const { parsePet } = require('../src/pet-package.cjs');
  const pet = parsePet(fs.readFileSync(path.join(__dirname, '..', 'pets', 'EduGhost.aulapet')));
  const server = await startServer({ webRoot: path.join(__dirname, '..', 'web'), getFrame: () => fixture, getAsset: kind => pet.images[kind], preferredPort: 0 });
  t.after(() => server.close());
  for (const [route, kind] of [['/asset', 'open'], ['/asset-closed', 'closed']]) {
    const response = await fetch(server.url + route);
    assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(Buffer.from(await response.arrayBuffer()).equals(pet.images[kind].bytes));
  }
  assert.equal((await fetch(server.url + '/pets/EduGhost.aulapet')).status, 404);
});
async function setup(t) {
  const server = await startServer({ webRoot: path.join(__dirname, '..', 'web'), getFrame: () => fixture, getAsset: () => null, preferredPort: 0 });
  t.after(() => server.close()); return server;
}

test('Las animaciones del selector son independientes y no cuentan como OBS; rechaza mascotas desconocidas', async t => {
  const id = 'a'.repeat(64), image = Buffer.from([1, 2, 3]);
  const server = await startServer({ webRoot: path.join(__dirname, '..', 'web'), getFrame: () => fixture,
    getLibraryFrame: pet => pet === id ? { ...fixture, library: true } : null,
    getLibraryFrames: () => ({ [id]: { ...fixture, library: true } }),
    getAsset: (kind, pet) => pet === id && kind === 'open' ? { mime: 'image/png', bytes: image } : null, preferredPort: 0 });
  t.after(() => server.close());
  const abort = new AbortController(); t.after(() => abort.abort());
  const response = await fetch(`${server.url}/events?surface=library&pet=${id}`, { signal: abort.signal });
  const reader = response.body.getReader();
  assert.match(new TextDecoder().decode((await reader.read()).value), /"library":true/);
  assert.equal(server.stats().obs, 0);
  assert.deepEqual(await (await fetch(`${server.url}/library-frames`)).json(), { [id]: { ...fixture, library: true } });
  server.publish({ ...fixture, activeOnly: true });
  const published = new TextDecoder().decode((await reader.read()).value);
  assert.match(published, /"library":true/); assert.doesNotMatch(published, /activeOnly/);
  const resource = await fetch(`${server.url}/asset?pet=${id}`);
  assert.deepEqual(Buffer.from(await resource.arrayBuffer()), image);
  for (const route of ['/events?pet=unknown', '/asset?pet=unknown']) assert.equal((await fetch(server.url + route)).status, 404);
  assert.equal((await fetch(`${server.url}/pets`)).status, 200);
  abort.abort();
});
test('El atlas y la cuarta pata se sirven por rutas dedicadas; la pata ausente devuelve 404', async t => {
  const fs = require('node:fs'), { parsePet } = require('../src/pet-package.cjs');
  const pet = parsePet(fs.readFileSync(path.join(__dirname, 'fixtures', 'EduScream-v3.aulapet')));
  const server = await startServer({ webRoot: path.join(__dirname, '..', 'web'), getFrame: () => fixture, getAsset: kind => pet.images[kind], preferredPort: 0 });
  t.after(() => server.close());
  for (const [route, kind] of [['/asset-atlas', 'atlas'], ['/asset-limb', 'limb']]) {
    const response = await fetch(server.url + route);
    assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(Buffer.from(await response.arrayBuffer()).equals(pet.images[kind].bytes));
  }
  assert.equal((await fetch(server.url + '/asset-closed')).status, 404);
  assert.equal((await fetch(server.url + '/web/eduscream/free-foot.png')).status, 404);
});

test('La salida OBS, la imagen y el estado se sirven sin caché y con transparencia', async t => {
  const server = await setup(t);
  const html = await fetch(`${server.url}/overlay`);
  assert.equal(html.status, 200); assert.match(await html.text(), /overlay\.js/);
  assert.equal(html.headers.get('cache-control'), 'no-store');
  const css = await fetch(`${server.url}/overlay.css`);
  assert.match(await css.text(), /background: transparent/);
  assert.equal((await fetch(`${server.url}/mascota.svg`)).headers.get('content-type'), 'image/svg+xml');
  assert.deepEqual(await (await fetch(`${server.url}/state`)).json(), fixture);
  for (const resource of ['/edughost/open.png', '/edughost/closed.png']) {
    const image = await fetch(server.url + resource);
    assert.equal(image.status, 200); assert.equal(image.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await image.arrayBuffer()).subarray(0,8), Buffer.from([137,80,78,71,13,10,26,10]));
  }
});

test('El servidor rechaza escritura y recursos fuera de la lista permitida', async t => {
  const server = await setup(t);
  assert.equal((await fetch(`${server.url}/state`, { method: 'POST' })).status, 405);
  for (const route of ['/src/main.cjs', '/package.json', '/asset', '/..%2fpackage.json']) {
    assert.equal((await fetch(server.url + route)).status, 404);
  }
});

test('Un Host externo no puede acceder al servidor local', async t => {
  const server = await setup(t);
  const response = await new Promise((resolve, reject) => {
    http.get(`${server.url}/state`, { headers: { Host: 'example.com' } }, res => {
      res.resume(); resolve(res.statusCode);
    }).on('error', reject);
  });
  assert.equal(response, 403);
});

test('OBS recibe el mismo estado por SSE y libera la conexión al cerrar', async t => {
  const server = await setup(t);
  const abort = new AbortController();
  const response = await fetch(`${server.url}/events`, { signal: abort.signal });
  assert.equal(response.headers.get('content-type'), 'text/event-stream');
  const reader = response.body.getReader();
  let first = new TextDecoder().decode((await reader.read()).value);
  assert.match(first, /event: frame/); assert.match(first, /"x":0.5/);
  assert.equal(server.stats().obs, 1);
  server.publish({ ...fixture, x: 0.75 });
  const next = new TextDecoder().decode((await reader.read()).value);
  assert.match(next, /"x":0.75/);
  abort.abort();
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(server.stats().obs, 0);
});

test('Vista previa y escritorio no se cuentan como conexiones OBS', async t => {
  const server = await setup(t);
  const abort = new AbortController();
  await fetch(`${server.url}/events?surface=preview`, { signal: abort.signal });
  await fetch(`${server.url}/events?surface=desktop`, { signal: abort.signal });
  assert.equal(server.stats().obs, 0); abort.abort();
});

test('Si el puerto está ocupado, la segunda app elige el siguiente', async t => {
  const first = await setup(t);
  const port = Number(new URL(first.url).port);
  const second = await startServer({ webRoot: path.join(__dirname, '..', 'web'), getFrame: () => fixture, getAsset: () => null, preferredPort: port });
  t.after(() => second.close());
  assert.equal(Number(new URL(second.url).port), port + 1);
  assert.equal((await fetch(`${second.url}/overlay`)).status, 200);
});
