'use strict';
// Solo conserva el nivel de señal; nunca recibe ni almacena muestras de audio.
class VoiceGate {
  constructor() { this.reset(); }
  reset() { this.level = 0; this.sampleTime = -Infinity; this.lastLoud = -Infinity; this.speaking = false; }
  sample(level, now, settings) {
    if (typeof level !== 'number' || !Number.isFinite(level) || level < 0 || level > 1) return false;
    this.level = level; this.sampleTime = now;
    const db = 20 * Math.log10(Math.max(level, 0.000001));
    if (db >= settings.micThreshold - (this.speaking ? 6 : 0)) { this.lastLoud = now; this.speaking = true; }
    return true;
  }
  frame(now, settings) {
    if (!settings.micEnabled || now - this.sampleTime > 500) { this.reset(); return { speaking: false, level: 0 }; }
    if (this.level < 10 ** ((settings.micThreshold - 6) / 20) && now - this.lastLoud > settings.micRelease) this.speaking = false;
    return { speaking: this.speaking, level: this.level };
  }
}
module.exports = { VoiceGate };
