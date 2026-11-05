'use strict';

const TRANSITION_SECONDS = 2;

// Un reloj compartido evita que escritorio y OBS salgan o regresen por separado.
class Presence {
  constructor() { this.reset(); }
  reset() {
    this.phase = 'visible';
    this.age = 0;
    this.side = 'right';
    this.configuration = '';
  }
  configure(settings) {
    const key = `${settings.presenceEnabled}:${settings.visibleSeconds}:${settings.awaySeconds}`;
    if (!settings.presenceEnabled) { this.phase = 'visible'; this.age = 0; }
    else if (key !== this.configuration && ['visible', 'away'].includes(this.phase)) this.age = 0;
    this.configuration = key;
  }
  advance(dt, settings, x, speaking) {
    if (!settings.presenceEnabled) return;
    this.age += dt;
    if (this.phase === 'visible') {
      // Terminar BOO antes de salir: el globo nunca queda flotando solo.
      if (this.age >= settings.visibleSeconds && !speaking) {
        this.phase = 'leaving'; this.age = 0;
        this.side = x < 0.5 ? 'left' : 'right';
      }
    } else if (this.phase === 'leaving' && this.age >= TRANSITION_SECONDS) {
      this.age -= TRANSITION_SECONDS; this.phase = 'away';
    } else if (this.phase === 'away' && this.age >= settings.awaySeconds) {
      this.age -= settings.awaySeconds; this.phase = 'entering';
    } else if (this.phase === 'entering' && this.age >= TRANSITION_SECONDS) {
      this.age -= TRANSITION_SECONDS; this.phase = 'visible';
    }
  }
  frame(settings) {
    if (!settings.presenceEnabled) return { phase: 'visible', progress: 0, side: this.side, secondsLeft: 0 };
    const progress = this.phase === 'visible' ? 0 : this.phase === 'away' ? 1
      : this.phase === 'leaving' ? this.age / TRANSITION_SECONDS : 1 - this.age / TRANSITION_SECONDS;
    const duration = this.phase === 'visible' ? settings.visibleSeconds
      : this.phase === 'away' ? settings.awaySeconds : TRANSITION_SECONDS;
    return { phase: this.phase, side: this.side, progress: Math.max(0, Math.min(1, progress)), secondsLeft: Math.ceil(Math.max(0, duration - this.age)) };
  }
}

module.exports = { Presence, TRANSITION_SECONDS };
