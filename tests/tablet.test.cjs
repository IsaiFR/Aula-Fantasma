'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tabletError, videoPackets } = require('../src/tablet.cjs');

function session(width, height) {
  const header = Buffer.alloc(12);
  header[0] = 0x80;
  header.writeUInt32BE(width, 4);
  header.writeUInt32BE(height, 8);
  return header;
}

function media(flags, payload) {
  const header = Buffer.alloc(12);
  header.writeBigUInt64BE(flags);
  header.writeUInt32BE(payload.length, 8);
  return Buffer.concat([header, Buffer.from(payload)]);
}

async function* chunks(buffer, size) {
  for (let offset = 0; offset < buffer.length; offset += size) yield buffer.subarray(offset, offset + size);
}

test('tablet decodes headers fragmented across reads and starts a new video session on rotation', async () => {
  const bytes = Buffer.concat([
    Buffer.from('h264'), session(1920, 1200), media(1n << 62n, [1, 2, 3]),
    media((1n << 61n) | 10000n, [4, 5]), media(15000n, [6]),
    session(1200, 1920), media((1n << 61n) | 20000n, [7])
  ]);
  const actual = [];
  for await (const packet of videoPackets(chunks(bytes, 3))) actual.push(packet);
  assert.deepEqual(actual, [
    { type: 'session', width: 1920, height: 1200 }, { type: 'config', data: Buffer.from([1, 2, 3]) },
    { type: 'key', timestamp: 0, data: Buffer.from([4, 5]) }, { type: 'delta', timestamp: 5000, data: Buffer.from([6]) },
    { type: 'session', width: 1200, height: 1920 }, { type: 'key', timestamp: 0, data: Buffer.from([7]) }
  ]);
});

test('tablet rejects incomplete and oversized video packets', async () => {
  const invalid = media(0n, [1, 2]);
  const tooLarge = Buffer.from(invalid);
  tooLarge.writeUInt32BE(0xffffffff, 8);
  for (const input of [invalid.subarray(0, -1), tooLarge]) {
    const bytes = Buffer.concat([Buffer.from('h264'), session(1920, 1200), input]);
    await assert.rejects(async () => {
      for await (const packet of videoPackets(chunks(bytes, 15))) assert.equal(packet.type, 'session');
    }, /interrumpió|no válido/);
  }
});

test('tablet explains when Android requests USB authorization or no tablet is detected', () => {
  assert.match(tabletError(new Error('error: device unauthorized')), /Permitir depuración USB/);
  assert.match(tabletError(new Error('error: no devices/emulators found')), /No se detectó/);
  assert.match(tabletError(new Error('error: more than one device/emulator')), /varios dispositivos/);
});
