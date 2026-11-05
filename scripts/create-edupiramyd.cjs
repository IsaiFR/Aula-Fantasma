'use strict';
const fs = require('node:fs'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');
const { gifInfo } = require('../src/gif.cjs');
const root = path.join(__dirname, '..'), build = path.join(root, '.gif-build');
const assets = path.join(root, 'web', 'edupiramyd'), source = path.join(assets, 'source-sheet.png');
fs.mkdirSync(build, { recursive: true });
function ffmpeg(args) {
  const result = spawnSync('ffmpeg.exe', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd: build, windowsHide: true, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'No se pudo crear EduPiramyd.');
}
const inspection = spawnSync('python', [path.join(__dirname, 'inspect-sprite-sheet.py'), source, '4', '1'], { encoding: 'utf8', windowsHide: true });
if (inspection.status !== 0) throw new Error(inspection.stderr);
const cells = JSON.parse(inspection.stdout), size = 256;
const scale = 240 / cells[0].width;
const layerNames = ['rig-body.png', 'rig-hind-far.png', 'rig-hind-near.png', 'rig-front.png'];
const frameName = index => `piramyd-frame-${String(index).padStart(2, '0')}.png`;
for (const [index, cell] of cells.entries()) {
  const width = Math.round(cell.width * scale), height = Math.round(cell.height * scale);
  // Extraer cada silueta completa: sus límites pueden cruzar la cuadrícula
  // nominal de la hoja. La máscara evita incluir fragmentos de otra pose.
  const mask = Buffer.alloc(cell.width * cell.height);
  for (const [y, start, end] of cell.spans) {
    mask.fill(255, y * cell.width + start, y * cell.width + end + 1);
  }
  const maskName = `piramyd-mask-${index}.pgm`;
  fs.writeFileSync(path.join(build, maskName), Buffer.concat([Buffer.from(`P5\n${cell.width} ${cell.height}\n255\n`), mask]));
  const layerFilter = `[0:v]format=rgba,crop=${cell.width}:${cell.height}:${cell.x}:${cell.y},split[color][original];[original]alphaextract[a];[a][1:v]blend=all_expr='if(gt(B,128),A,0)'[clean];[color][clean]alphamerge,scale=${width}:${height}:flags=lanczos,format=rgba,lut=a='if(lt(val,64),0,val)'[out]`;
  ffmpeg(['-i', source, '-i', maskName, '-filter_complex', layerFilter, '-map', '[out]', '-frames:v', '1', path.join(assets, layerNames[index])]);
}
const rendered = spawnSync(process.execPath, [path.join(__dirname, 'render-piramyd-rig.cjs')], { encoding: 'utf8', windowsHide: true });
if (rendered.status !== 0) throw new Error(rendered.stderr || rendered.error?.message);
console.log(rendered.stdout.trim());
const sequence = Array.from({ length: 75 }, (_, index) => ({ frame: index % 8, seconds: .4, stage: 'walk' }));
sequence.push({ frame: 8, seconds: 10, stage: 'idle' });
ffmpeg(['-framerate', '10', '-i', 'piramyd-frame-%02d.png', '-vf', 'palettegen=reserve_transparent=1:stats_mode=full', '-frames:v', '1', 'piramyd-palette.png']);
const listing = sequence.map(entry => `file '${frameName(entry.frame)}'\noption framerate 100\nduration ${entry.seconds}`).join('\n');
fs.writeFileSync(path.join(build, 'piramyd-cycle.ffconcat'), `ffconcat version 1.0\n${listing}\nfile '${frameName(8)}'\noption framerate 100\n`);
const gif = path.join(root, 'pets', 'EduPiramyd.gif');
ffmpeg(['-f', 'concat', '-safe', '0', '-i', 'piramyd-cycle.ffconcat', '-i', 'piramyd-palette.png', '-filter_complex', '[0:v][1:v]paletteuse=alpha_threshold=64:dither=sierra2_4a', '-fps_mode', 'vfr', '-frames:v', String(sequence.length), '-final_delay', '1000', '-loop', '0', gif]);
ffmpeg(['-framerate', '2.5', '-i', 'piramyd-frame-%02d.png', '-i', 'piramyd-palette.png', '-filter_complex', '[0:v][1:v]paletteuse=alpha_threshold=64:dither=sierra2_4a', '-frames:v', '8', '-loop', '0', path.join(assets, 'walk-preview.gif')]);
const labels = Array.from({ length: 9 }, (_, i) => `[v${i}]`).join('');
const parts = Array.from({ length: 9 }, (_, i) => `[v${i}]select=eq(n\\,${i}),setpts=PTS-STARTPTS[s${i}]`).join(';');
const inputs = Array.from({ length: 9 }, (_, i) => `[s${i}]`).join('');
const layout = Array.from({ length: 9 }, (_, i) => `${i % 3 * size}_${Math.floor(i / 3) * size}`).join('|');
const sheet = path.join(assets, 'frames.png'), open = path.join(assets, 'open.png');
ffmpeg(['-framerate', '10', '-i', 'piramyd-frame-%02d.png', '-filter_complex', `[0:v]split=9${labels};${parts};${inputs}xstack=inputs=9:layout=${layout}:fill=none[out]`, '-map', '[out]', '-frames:v', '1', sheet]);
fs.copyFileSync(path.join(build, frameName(8)), open);
const images = Object.fromEntries([['open', open, 'image/png'], ['frames', sheet, 'image/png'], ['cycle', gif, 'image/gif']].map(([kind, file, mime]) => [kind, { mime, bytes: fs.readFileSync(file) }]));
const animation = animationProfile({ float: { enabled: false }, cloth: { enabled: false }, blink: { enabled: false } });
const behavior = behaviorProfile({ cycle: { size, columns: 3, rows: 3, mirror: true, reverseAfterRest: true, sequence } });
fs.writeFileSync(path.join(root, 'pets', 'EduPiramyd.aulapet'), serializePet({ name: 'EduPiramyd', images, animation, behavior }));
console.log(JSON.stringify({ pet: 'EduPiramyd.aulapet', ...gifInfo(images.cycle.bytes), walkSeconds: 30, restSeconds: 10, speed: 18 }, null, 2));
