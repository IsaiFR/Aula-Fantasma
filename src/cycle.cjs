'use strict';
function cycleFrame(elapsed, profile) {
  const duration = profile.sequence.reduce((sum, entry) => sum + entry.seconds, 0);
  let time = ((elapsed % duration) + duration) % duration;
  for (let index = 0; index < profile.sequence.length; index++) {
    const entry = profile.sequence[index];
    if (time < entry.seconds - 1e-9 || index === profile.sequence.length - 1) {
      return { index, sheetIndex: entry.frame, stage: entry.stage, moving: entry.stage === 'walk', text: entry.text || '', duration };
    }
    time -= entry.seconds;
  }
}
module.exports = { cycleFrame };
