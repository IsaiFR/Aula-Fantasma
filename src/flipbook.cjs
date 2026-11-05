'use strict';
function flipbookFrame(frame, profile) {
  const { walkFrames, raiseFrames } = profile, g = frame.greeting;
  if (g.phase === 'idle') return { clip: 'walk', index: frame.walk.strength > .05 ? Math.floor((((frame.walk.phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * walkFrames) : 0, sheetIndex: null };
  let index = Math.min(raiseFrames - 1, Math.max(0, Math.round(g.lift * (raiseFrames - 1))));
  if (g.phase === 'lower') index = Math.min(index, raiseFrames - 2);
  return { clip: 'greeting', index: g.phase === 'lower' ? 2 * raiseFrames - 2 - index : index, sheetIndex: walkFrames + index };
}
module.exports = { flipbookFrame };
