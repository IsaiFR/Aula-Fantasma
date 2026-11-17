'use strict';
// Campana original sintetizada: tres golpes de metal, sin recursos externos.
const fs = require('node:fs');
const path = require('node:path');
const rate = 44100, duration = 2.8, samples = Math.ceil(rate * duration);
const signal = new Float64Array(samples);
for (const strike of [0, .24, .48]) {
  for (let i = Math.floor(strike * rate); i < samples; i++) {
    const t = i / rate - strike;
    const attack = Math.min(1, t / .0015);
    for (const [frequency, amplitude, decay] of [[740, .43, 2.5], [1193, .26, 3], [1584, .16, 3.8], [2201, .10, 5], [3110, .05, 7]]) {
      signal[i] += attack * amplitude * Math.exp(-t * decay) * Math.sin(2 * Math.PI * frequency * t);
    }
  }
}
const peak = signal.reduce((max, n) => Math.max(max, Math.abs(n)), 0);
const wav = Buffer.alloc(44 + samples * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
for (let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(signal[i] / peak * .85 * 32767), 44 + i * 2);
fs.writeFileSync(path.join(__dirname, '..', 'web', 'boxing-bell.wav'), wav);
console.log('Campana creada: 3 golpes, 2.8 s, PCM mono a 44.1 kHz.');
