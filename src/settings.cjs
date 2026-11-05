'use strict';

const DEFAULTS = Object.freeze({
  desktopEnabled: true, obsEnabled: true, paused: false,
  mode: 'edges', size: 150, speed: 65, opacity: 100, margin: 24,
  displayId: 'primary', booEnabled: true, booInterval: 25,
  presenceEnabled: true, visibleSeconds: 35, awaySeconds: 60,
  micEnabled: false, micDeviceId: 'default', micThreshold: -38, micRelease: 180,
  voiceEnabled: true, companionEnabled: true, corner: 'bottom-right',
  ghostSolidSeconds: 20, ghostFadedSeconds: 8,
  draculaBatEnabled: true, draculaSeconds: 20, draculaBatSeconds: 8
});
const RANGES = { size: [60, 300], speed: [10, 180], opacity: [20, 100], margin: [0, 100], booInterval: [10, 120], visibleSeconds: [5, 300], awaySeconds: [5, 600], micThreshold: [-70, -5], micRelease: [0, 1000], ghostSolidSeconds: [1, 600], ghostFadedSeconds: [1, 600], draculaSeconds: [1, 600], draculaBatSeconds: [1, 600] };

function sanitizeSettings(input, current = DEFAULTS) {
  const next = { ...current };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return next;
  for (const key of ['desktopEnabled', 'obsEnabled', 'paused', 'booEnabled', 'presenceEnabled', 'micEnabled', 'voiceEnabled', 'companionEnabled', 'draculaBatEnabled']) {
    if (typeof input[key] === 'boolean') next[key] = input[key];
  }
  for (const [key, [min, max]] of Object.entries(RANGES)) {
    if (typeof input[key] === 'number' && Number.isFinite(input[key])) {
      next[key] = Math.round(Math.max(min, Math.min(max, input[key])));
    }
  }
  if (['edges', 'free', 'still'].includes(input.mode)) next.mode = input.mode;
  if (['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(input.corner)) next.corner = input.corner;
  if (typeof input.micDeviceId === 'string' && input.micDeviceId.length <= 256 && !/[\x00-\x1f]/.test(input.micDeviceId)) next.micDeviceId = input.micDeviceId || 'default';
  if (typeof input.displayId === 'string' && /^(primary|-?\d+)$/.test(input.displayId)) {
    next.displayId = input.displayId;
  }
  return next;
}

module.exports = { DEFAULTS, sanitizeSettings };
