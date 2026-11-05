'use strict';
const CANVASES = Object.freeze({ '16:9': Object.freeze({ width: 1920, height: 1080 }), '9:16': Object.freeze({ width: 1080, height: 1920 }) });
function canvasInfo(format) { const key = Object.hasOwn(CANVASES, format) ? format : '16:9'; return { format: key, ...CANVASES[key] }; }
function isCanvasFormat(format) { return Object.hasOwn(CANVASES, format); }
module.exports = { canvasInfo, isCanvasFormat };
