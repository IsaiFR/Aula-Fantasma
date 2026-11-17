'use strict';
const { randomUUID } = require('node:crypto');

const DEFAULT_COUNTDOWN = Object.freeze({ seconds: 120, x: 48, y: 48, desktopEnabled: false });
const CARD = Object.freeze({ width: 320, height: 156 });
function sanitizeCountdown(input, current = DEFAULT_COUNTDOWN) {
  const next = { ...current };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return next;
  if (typeof input.desktopEnabled === 'boolean') next.desktopEnabled = input.desktopEnabled;
  for (const [key, min, max] of [['seconds', 10, 5999], ['x', 0, 10000], ['y', 0, 10000]]) {
    if (typeof input[key] === 'number' && Number.isFinite(input[key])) next[key] = Math.round(Math.max(min, Math.min(max, input[key])));
  }
  return next;
}

class Countdown {
  constructor(clock = () => performance.now()) {
    this.clock = clock;
    this.config = { ...DEFAULT_COUNTDOWN };
    this.startedAt = null;
    this.runId = 0;
    this.sessionId = randomUUID();
    this.positioning = false;
  }
  configure(patch) {
    const next = sanitizeCountdown(patch, this.config);
    if (this.frame().active) next.seconds = this.config.seconds;
    else if (this.startedAt !== null) this.stop();
    this.config = next;
  }
  start() {
    if (this.frame().active) return;
    this.startedAt = this.clock();
    this.runId++;
    this.positioning = false;
  }
  stop() { this.startedAt = null; this.positioning = false; }
  togglePosition() {
    if (this.frame().active) return;
    const next = !this.positioning;
    this.stop(); this.positioning = next;
  }
  frame(canvas = { width: 1920, height: 1080 }) {
    const elapsed = this.startedAt === null ? null : Math.max(0, (this.clock() - this.startedAt) / 1000);
    const duration = this.config.seconds;
    const remaining = elapsed === null ? duration : Math.max(0, duration - Math.max(0, elapsed - 3));
    const phase = elapsed === null ? (this.positioning ? 'position' : 'idle') : elapsed < 3 ? 'ready' : elapsed < duration + 3 ? 'running' : elapsed < duration + 6 ? 'finished' : 'done';
    const active = ['ready', 'running', 'finished'].includes(phase);
    return {
      ...this.config, runId: `${this.sessionId}:${this.runId}`, phase, active,
      x: Math.min(this.config.x, Math.max(0, canvas.width - CARD.width)),
      y: Math.min(this.config.y, Math.max(0, canvas.height - CARD.height)),
      remaining: Math.ceil(remaining), ready: phase === 'ready' ? Math.ceil(3 - elapsed) : 0,
      visible: phase === 'position' || phase === 'ready' || phase === 'finished' || (phase === 'running' && (elapsed < 8 || remaining <= 3)),
      // Una fuente que se conecta tarde no reproduce un aviso ya pasado.
      bell: phase === 'running' && remaining <= 10 && remaining > 8.5
    };
  }
}
module.exports = { Countdown, DEFAULT_COUNTDOWN, CARD, sanitizeCountdown };
