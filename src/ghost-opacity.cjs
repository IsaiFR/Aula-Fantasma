'use strict';
// El reloj compartido mantiene la misma transparencia en escritorio, panel y OBS.
function ghostOpacityFrame(elapsed, settings, effects) {
  if (!effects?.ghostOpacity) return null;
  const solid = settings.ghostSolidSeconds, faded = settings.ghostFadedSeconds, fade = effects.ghostOpacity.fadeSeconds;
  let time = (Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0) % (solid + faded + fade * 2);
  const ease = t => t * t * (3 - 2 * t);
  if (time < solid) return { opacity: 1, phase: 'solid' };
  time -= solid;
  if (time < fade) return { opacity: 1 - .25 * ease(time / fade), phase: 'fading-out' };
  time -= fade;
  if (time < faded) return { opacity: .75, phase: 'faded' };
  time -= faded;
  return { opacity: .75 + .25 * ease(time / fade), phase: 'fading-in' };
}
module.exports = { ghostOpacityFrame };
