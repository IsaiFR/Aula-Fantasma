'use strict';
const fs = require('node:fs'), path = require('node:path');
const { parsePet, serializePet, animationProfile, EDUGHOST_ANIMATION } = require('../src/pet-package.cjs');
const file = path.join(__dirname, '..', 'pets', 'EduGhost-Voz.pet');
const pet = parsePet(fs.readFileSync(file));
pet.animation = animationProfile({
  ...pet.animation,
  float: { enabled: true, amplitude: 7, frequency: 1.7, tiltAmplitude: 1.2, tiltFrequency: 1.1, stretchAmplitude: .006, stretchPhase: .4 },
  cloth: { ...EDUGHOST_ANIMATION.cloth, amplitudeX: .018, amplitudeX2: .007, amplitudeY: .009, speedX: 1.8, speedX2: 1.3, speedY: 1.6,
    protectedRegions: [{ cx: .61, cy: .34, rx: .25, ry: .18 }, ...EDUGHOST_ANIMATION.cloth.protectedRegions] }
});
pet.effects = { ghostOpacity: { fadeSeconds: .8 } };
fs.writeFileSync(file, serializePet(pet));
console.log('EduGhost de voz actualizado: flotación, sábana y ciclo de transparencia sobre sus cuatro PNG originales.');
