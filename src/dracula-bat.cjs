'use strict';
// Un solo reloj para la transformación, aleteo y humo en todas las salidas.
function draculaBatFrame(elapsed, settings, effects) {
  const effect = effects?.draculaBat;
  if (!effect) return null;
  const clock = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const base = { elapsed: clock, wingLeft: effect.wingLeft, wingRight: effect.wingRight, wingRootY: effect.wingRootY };
  if (!settings.draculaBatEnabled) return { ...base, phase: 'dracula', mix: 0, smoke: 0 };
  const normal = settings.draculaSeconds, bat = settings.draculaBatSeconds, transition = effect.transitionSeconds;
  let time = clock % (normal + bat + transition * 2);
  const ease = t => t * t * (3 - 2 * t);
  if (time < normal) return { ...base, phase: 'dracula', mix: 0, smoke: 0 };
  time -= normal;
  if (time < transition) return { ...base, phase: 'transforming', mix: ease(time / transition), smoke: Math.sin(Math.PI * time / transition) };
  time -= transition;
  if (time < bat) return { ...base, phase: 'bat', mix: 1, smoke: 0 };
  time -= bat;
  return { ...base, phase: 'returning', mix: 1 - ease(time / transition), smoke: Math.sin(Math.PI * time / transition) };
}
module.exports = { draculaBatFrame };
