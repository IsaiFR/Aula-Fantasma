'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { animationProfile, serializePet } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');
const root = path.join(__dirname, '..'), assets = path.join(root, 'web', 'eduscream');
fs.copyFileSync(path.join(root, '.gif-build', 'frame-00.png'), path.join(assets, 'gif-open.png'));
const images = Object.fromEntries(Object.entries({ open: ['gif-open.png', 'image/png'], walk: ['EduScream.gif', 'image/gif'], greeting: ['EduScream_Saludo.gif', 'image/gif'], frames: ['gif-frames.png', 'image/png'] }).map(([kind, [file, mime]]) => [kind, { mime, bytes: fs.readFileSync(path.join(assets, file)) }]));
const behavior = behaviorProfile({
  walk: { enabled: true, frequency: 2 * Math.PI / .8, stepHeight: 0, stepWidth: 0, footAngle: 0, bob: 0, lean: 0 },
  greeting: { text: 'Detrás de ti', raiseSeconds: .7, holdSeconds: 2, lowerSeconds: .7 },
  flipbook: { mirror: true, size: 180, columns: 4, rows: 4, walkFrames: 8, raiseFrames: 8 }
});
fs.writeFileSync(path.join(root, 'pets', 'EduScream.aulapet'), serializePet({ name: 'EduScream', images, animation: animationProfile({ float: { enabled: false } }), behavior }));
console.log('EduScream.aulapet v4 guardado con ambos GIF y sus fotogramas.');
