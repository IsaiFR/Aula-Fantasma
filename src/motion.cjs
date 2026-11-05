'use strict';
const { Presence } = require('./presence.cjs');
const { animationProfile, EDUGHOST_ANIMATION } = require('./pet-package.cjs');
const { behaviorProfile, greetingDuration, greetingFrame } = require('./behavior.cjs');
const { cycleFrame } = require('./cycle.cjs');

// Una única simulación alimenta escritorio, vista previa y OBS.
// Las coordenadas 0..1 se adaptan al espacio disponible de cada lienzo.
class Motion {
  constructor({ random = Math.random, animation = EDUGHOST_ANIMATION, behavior } = {}) {
    this.random = random;
    this.animation = animationProfile(animation);
    this.behavior = behaviorProfile(behavior);
    this.reset();
  }

  reset() {
    this.presence = new Presence();
    this.x = 0.78;
    this.y = 1;
    this.directionX = -1;
    this.directionY = -1;
    this.elapsed = 0;
    this.cycleTime = 0;
    this.vehicle = { heading: -2.65, target: -2.65, wheelAngle: 0, steering: 0, moving: false };
    this.clothStrength = 0.8;
    this.walkPhase = 0; this.walkStrength = 0;
    this.edgeDistance = 0;
    this.previousMode = null;
    this.blinkIn = this.nextBlink();
    this.blinkRemaining = 0;
    this.booRemaining = 0;
    this.booIn = null;
    this.previousBooInterval = null;
    this.pixelDistance = 0;
    this.pixelStart = { x: this.x, y: this.y, directionX: this.directionX, directionY: this.directionY };
  }

  setAnimation(animation) {
    this.animation = animationProfile(animation);
    this.blinkIn = this.nextBlink(); this.blinkRemaining = 0;
  }
  setBehavior(behavior) {
    this.behavior = behaviorProfile(behavior);
    this.cycleTime = 0;
    this.vehicle = { heading: this.directionX < 0 ? -2.65 : -.49, target: this.directionX < 0 ? -2.65 : -.49, wheelAngle: 0, steering: 0, moving: false };
    if (this.behavior.cycle) this.y = 1;
    if (this.behavior.cycle?.reverseAfterRest) {
      this.x = .78; this.y = 1; this.directionX = -1; this.previousMode = null;
    }
    this.walkPhase = 0; this.walkStrength = 0;
    // Cambiar de personaje cancela el gesto anterior; no hereda una pose a mitad.
    this.booRemaining = 0; this.booIn = null; this.previousBooInterval = null;
  }
  nextBlink() { const b = this.animation.blink; return b.intervalMin + this.random() * (b.intervalMax - b.intervalMin); }
  nextBoo(settings) { return this.behavior.flipbook ? settings.booInterval : settings.booInterval * (0.85 + this.random() * 0.3); }
  booNow(settings) {
    if (this.behavior.cycle) {
      if (settings.paused || (settings.presenceEnabled && this.presence.phase !== 'visible')) return;
      const sequence = this.behavior.cycle.sequence;
      let strike = sequence.findIndex(entry => entry.stage === 'lightning');
      if (strike < 0) strike = sequence.findIndex(entry => entry.stage === 'rise');
      this.cycleTime = sequence.slice(0, Math.max(0, strike)).reduce((sum, entry) => sum + entry.seconds, 0);
      return;
    }
    if (!settings.booEnabled || settings.paused || (settings.presenceEnabled && this.presence.phase !== 'visible')) return;
    if (this.booRemaining > 0) return;
    this.booRemaining = greetingDuration(this.behavior);
    this.booIn = this.nextBoo(settings);
  }

  advanceCharacter(dt, settings, allowBoo = true) {
    if (this.animation.blink.enabled) {
      if (this.blinkRemaining > 0) {
        this.blinkRemaining = Math.max(0, this.blinkRemaining - dt);
      } else {
        this.blinkIn -= dt;
        if (this.blinkIn <= 0) {
          this.blinkRemaining = this.animation.blink.duration;
          this.blinkIn = this.nextBlink();
        }
      }
    } else this.blinkRemaining = 0;
    if (!allowBoo) return;
    if (this.previousBooInterval !== settings.booInterval) {
      this.booIn = this.nextBoo(settings);
      this.previousBooInterval = settings.booInterval;
    }
    if (!settings.booEnabled) {
      this.booRemaining = 0;
      this.booIn = this.nextBoo(settings);
    } else if (this.booRemaining > 0) {
      this.booRemaining = Math.max(0, this.booRemaining - dt);
      // El intervalo se mide entre inicios de BOO, incluido el tiempo detenido.
      this.booIn = Math.max(0, this.booIn - dt);
    } else {
      this.booIn -= dt;
      if (this.booIn <= 0) this.booNow(settings);
    }
  }

  advance(dt, settings) {
    dt = Number.isFinite(dt) ? Math.min(0.15, Math.max(0, dt)) : 0;
    this.presence.configure(settings);
    const width = Math.max(1, 1920 - settings.size - 2 * settings.margin);
    const height = Math.max(1, 1080 - settings.size - 2 * settings.margin);
    if (settings.mode !== this.previousMode) {
      this.pixelDistance = 0;
      this.pixelStart = { x: this.x, y: this.y, directionX: this.directionX, directionY: this.directionY };
      if (settings.mode === 'edges') {
        // Entrar en el borde inferior desde la posición horizontal actual.
        this.edgeDistance = width + height + (1 - this.x) * width;
        this.y = 1;
      }
      if (settings.mode === 'still') { this.x = 1; this.y = 1; }
      this.previousMode = settings.mode;
    }
    if (settings.paused) return this.frame(settings);
    this.presence.advance(dt, settings, this.x, this.booRemaining > 0 && settings.booEnabled);
    // Durante la ausencia no avanzan el recorrido ni los temporizadores del personaje.
    if (this.presence.phase === 'away') return this.frame(settings);
    this.elapsed += dt;
    if (this.behavior.cycle) {
      if (this.behavior.cycle.reverseAfterRest) {
        this.advancePatrol(dt, settings, width);
        return this.frame(settings);
      }
      const before = cycleFrame(this.cycleTime, this.behavior.cycle);
      this.cycleTime += dt;
      if (before.moving && cycleFrame(this.cycleTime, this.behavior.cycle).moving && this.presence.phase === 'visible' && settings.mode !== 'still') {
        // Variar el ritmo y el rumbo sin invertirlo a cada paso: progresa
        // por el lienzo y solo rebota cuando llega a un borde.
        const step = settings.speed * dt * (.85 + .15 * Math.abs(Math.sin(this.cycleTime * 7)));
        this.advanceRoute(step, settings, width, height, true);
      }
      return this.frame(settings);
    }
    if (this.behavior.vehicle) {
      this.advanceCharacter(dt, settings, this.presence.phase === 'visible');
      this.advanceVehicle(dt, settings, width, height);
      return this.frame(settings);
    }
    this.advanceCharacter(dt, settings, this.presence.phase === 'visible');
    if (this.presence.phase !== 'visible') this.booRemaining = 0;
    const walking = this.behavior.walk.enabled && settings.mode !== 'still' && this.booRemaining === 0;
    this.walkStrength += ((walking ? 1 : 0) - this.walkStrength) * (1 - Math.exp(-18 * dt));
    if (walking) this.walkPhase += dt * this.behavior.walk.frequency * Math.max(.55, Math.min(1.6, Math.sqrt(settings.speed / (this.behavior.flipbook ? 30 : 65))));
    // La tela pierde impulso suavemente al detenerse, también durante BOO.
    const clothTarget = settings.mode === 'still' || this.booRemaining > 0 ? 0.45 : 0.7 + settings.speed / 180 * 0.45;
    this.clothStrength += (clothTarget - this.clothStrength) * (1 - Math.exp(-3 * dt));
    if (this.presence.phase !== 'visible') return this.frame(settings);
    if (settings.mode === 'still' || this.booRemaining > 0) return this.frame(settings);
    this.advanceRoute(settings.speed * dt, settings, width, height);
    return this.frame(settings);
  }

  advanceVehicle(dt, settings, width, height) {
    const v = this.vehicle, config = this.behavior.vehicle;
    v.moving = settings.mode !== 'still' && this.presence.phase === 'visible' && this.booRemaining === 0;
    if (!v.moving) { v.steering = 0; return; }
    const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
    const distance = settings.speed * dt;
    if (settings.mode === 'edges') {
      const before = { x: this.x, y: this.y };
      this.advanceRoute(distance, settings, width, height);
      const dx = (this.x-before.x)*width, dy = (this.y-before.y)*height;
      if (Math.hypot(dx,dy) > .001) v.target = Math.atan2(dy,dx);
    } else {
      // Anticipar el borde permite describir una curva antes de tocarlo.
      const radius = Math.max(45, settings.speed / config.turnRate * 1.5);
      const bandX = Math.min(.3, radius/width), bandY = Math.min(.3, radius/height);
      if ((this.x < bandX && Math.cos(v.target)<0) || (this.x>1-bandX && Math.cos(v.target)>0)) v.target = wrap(Math.PI-v.target);
      if ((this.y < bandY && Math.sin(v.target)<0) || (this.y>1-bandY && Math.sin(v.target)>0)) v.target = wrap(-v.target);
    }
    const difference = wrap(v.target-v.heading), turn = Math.max(-config.turnRate*dt,Math.min(config.turnRate*dt,difference));
    v.heading = wrap(v.heading+turn);
    v.steering = dt ? turn/dt/config.turnRate : 0;
    if (settings.mode !== 'edges') {
      this.x = Math.max(0,Math.min(1,this.x+Math.cos(v.heading)*distance/width));
      this.y = Math.max(0,Math.min(1,this.y+Math.sin(v.heading)*distance/height));
    }
    this.directionX = Math.cos(v.heading)<0 ? -1 : 1;
    this.directionY = Math.sin(v.heading)<0 ? -1 : 1;
    v.wheelAngle = (v.wheelAngle + distance / (settings.size * config.wheelRadius)) % (Math.PI*2);
  }

  advancePatrol(dt, settings, width) {
    const sequence = this.behavior.cycle.sequence;
    const duration = Math.round(sequence.reduce((sum, entry) => sum + entry.seconds, 0) * 1e6) / 1e6;
    const walkSeconds = Math.round(sequence.filter(entry => entry.stage === 'walk').reduce((sum, entry) => sum + entry.seconds, 0) * 1e6) / 1e6;
    let remaining = dt;
    while (remaining > 1e-9) {
      const time = Math.round((this.cycleTime % duration) * 1e9) / 1e9;
      const walking = time < walkSeconds;
      const segment = Math.min(remaining, (walking ? walkSeconds : duration) - time);
      if (walking && this.presence.phase === 'visible' && settings.mode !== 'still') {
        this.x = Math.max(0, Math.min(1, this.x + this.directionX * settings.speed * segment / width));
        this.y = 1;
      }
      this.cycleTime = Math.round((this.cycleTime + segment) * 1e9) / 1e9;
      remaining -= segment;
      if (time + segment >= duration - 1e-9) this.directionX *= -1;
    }
  }

  advanceRoute(distance, settings, width, height, erratic = false) {
    this.pixelDistance += distance;
    if (settings.mode === 'edges') {
      const perimeter = 2 * (width + height);
      this.edgeDistance = (this.edgeDistance + distance) % perimeter;
      const d = this.edgeDistance;
      if (d < width) { this.x = d / width; this.y = 0; this.directionX = 1; }
      else if (d < width + height) { this.x = 1; this.y = (d - width) / height; }
      else if (d < 2 * width + height) {
        this.x = 1 - (d - width - height) / width; this.y = 1; this.directionX = -1;
      } else { this.x = 0; this.y = 1 - (d - 2 * width - height) / height; }
    } else {
      const angle = .55 + .22 * Math.sin(this.cycleTime * 1.2) + .1 * Math.sin(this.cycleTime * 3.4);
      this.x += this.directionX * distance * (erratic ? Math.cos(angle) : 1) / width;
      this.y += this.directionY * distance * (erratic ? Math.sin(angle) : .62) / height;
      if (this.x <= 0 || this.x >= 1) this.directionX *= -1;
      if (this.y <= 0 || this.y >= 1) this.directionY *= -1;
      this.x = Math.max(0, Math.min(1, this.x));
      this.y = Math.max(0, Math.min(1, this.y));
    }
  }

  frame(settings) {
    const f = this.animation.float, b = this.animation.blink;
    const walk = this.behavior.walk;
    const greeting = greetingFrame(this.booRemaining, settings.booEnabled && this.presence.phase === 'visible', this.behavior);
    const cycle = this.behavior.cycle ? cycleFrame(this.cycleTime, this.behavior.cycle) : null;
    const blinkAge = b.duration - this.blinkRemaining;
    const blink = this.blinkRemaining > 0
      ? Math.min(1, blinkAge / b.closeDuration, this.blinkRemaining / b.openDuration) : 0;
    return {
      x: this.x, y: this.y, facing: this.directionX,
      bob: (f.enabled ? Math.sin(this.elapsed * f.frequency) * f.amplitude : 0) - (walk.enabled ? Math.abs(Math.sin(this.walkPhase)) * walk.bob * this.walkStrength : 0),
      tilt: (f.enabled ? Math.sin(this.elapsed * f.tiltFrequency) * f.tiltAmplitude : 0) + (walk.enabled ? Math.sin(this.walkPhase) * walk.lean * this.walkStrength : 0),
      stretch: f.enabled ? 1 + Math.sin(this.elapsed * f.frequency + f.stretchPhase) * f.stretchAmplitude : 1,
      blink: b.enabled ? Math.max(0, blink) : 0,
      boo: settings.booEnabled && this.booRemaining > 0 && this.presence.phase === 'visible',
      elapsed: this.elapsed,
      ...(this.behavior.vehicle ? { vehicle: { ...this.vehicle, moving: this.vehicle.moving && !settings.paused } } : {}),
      ...(cycle ? { cycle } : {}),
      ...(this.behavior.flipbook ? { pixelRoute: { distance: this.pixelDistance, ...this.pixelStart } } : {}),
      clothStrength: this.clothStrength,
      walk: { phase: this.walkPhase, strength: this.walkStrength }, greeting,
      presence: this.presence.frame(settings)
    };
  }
}

module.exports = { Motion };
