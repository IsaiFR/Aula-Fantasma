'use strict';

const VOICE_CYCLES = Object.freeze({
  EduStrading: { action: 'scan', idleSeconds: 20, activeSeconds: 5.5 },
  EduZero: { action: 'freeze', idleSeconds: 20, activeSeconds: 6 },
  EduScorpion: { action: 'flame', idleSeconds: 20, activeSeconds: 6 },
  EduSnow: { action: 'melt', idleSeconds: 20, activeSeconds: 7 },
  EduFast: { action: 'helmet', idleSeconds: 20, activeSeconds: 6 },
  Edu007: { action: 'agent', idleSeconds: 20, activeSeconds: 5.5 }
});
const RETIRED_ACTION = 'parasites';
// Mantiene la lectura de archivos v15 anteriores y permite migrar las selecciones guardadas.
const ACTIONS = Object.freeze([...Object.values(VOICE_CYCLES).map(cycle => cycle.action), RETIRED_ACTION]);

function voiceCycleFrame(elapsed, cycle) {
  if (!cycle || cycle.action === RETIRED_ACTION || !Number.isFinite(elapsed) || elapsed < cycle.idleSeconds) return null;
  const activeTime = elapsed % (cycle.idleSeconds + cycle.activeSeconds) - cycle.idleSeconds;
  if (activeTime < 0) return null;
  return { action: cycle.action, time: activeTime, progress: activeTime / cycle.activeSeconds };
}

module.exports = { ACTIONS, VOICE_CYCLES, voiceCycleFrame };
