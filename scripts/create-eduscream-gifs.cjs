'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const build = path.join(root, '.gif-build'), assets = path.join(root, 'web', 'eduscream');
fs.mkdirSync(build, { recursive: true });
function ffmpeg(args) {
  const result = spawnSync('ffmpeg.exe', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { cwd: build, windowsHide: true, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'No se pudo convertir el GIF.');
}
const source = path.join(assets, 'gif-source-sheet-v2.png'), png = fs.readFileSync(source);
const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
for (let index = 0; index < 16; index++) {
  const col = index % 4, row = Math.floor(index / 4);
  const x = Math.round(col * width / 4), y = Math.round(row * height / 4);
  const w = Math.round((col + 1) * width / 4) - x, h = Math.round((row + 1) * height / 4) - y;
  ffmpeg(['-i', source, '-vf', `crop=${w}:${h}:${x}:${y},scale=180:180:flags=lanczos`, '-frames:v', '1', `frame-${String(index).padStart(2, '0')}.png`]);
}
// Una paleta común conserva el color de las sombras al cambiar de clip.
ffmpeg(['-framerate', '10', '-i', 'frame-%02d.png', '-vf', 'palettegen=reserve_transparent=1:stats_mode=full', '-frames:v', '1', 'palette.png']);
const palette = '[0:v][1:v]paletteuse=alpha_threshold=64:dither=sierra2_4a';
ffmpeg(['-framerate', '10', '-i', 'frame-%02d.png', '-i', 'palette.png', '-filter_complex', palette, '-frames:v', '8', '-loop', '0', path.join(assets, 'EduScream.gif')]);
const gesture = [...Array.from({ length: 8 }, (_, i) => i + 8), ...Array.from({ length: 7 }, (_, i) => 14 - i)];
const listing = gesture.map((index, position) => `file 'frame-${String(index).padStart(2, '0')}.png'\noption framerate 100\nduration ${position === 7 ? 2 : .1}`).join('\n');
fs.writeFileSync(path.join(build, 'greeting.ffconcat'), `ffconcat version 1.0\n${listing}\nfile 'frame-08.png'\noption framerate 100\n`);
ffmpeg(['-f', 'concat', '-safe', '0', '-i', 'greeting.ffconcat', '-i', 'palette.png', '-filter_complex', palette, '-fps_mode', 'vfr', '-t', '3.4', '-final_delay', '10', '-loop', '-1', path.join(assets, 'EduScream_Saludo.gif')]);
// Mismos fotogramas para navegadores que no implementan ImageDecoder.
const labels = Array.from({ length: 16 }, (_, i) => `[v${i}]`).join('');
const parts = Array.from({ length: 16 }, (_, i) => `[v${i}]select=eq(n\\,${i}),setpts=PTS-STARTPTS[s${i}]`).join(';');
const inputs = Array.from({ length: 16 }, (_, i) => `[s${i}]`).join('');
ffmpeg(['-framerate', '10', '-i', 'frame-%02d.png', '-filter_complex', `[0:v]split=16${labels};${parts};${inputs}xstack=inputs=16:layout=0_0|180_0|360_0|540_0|0_180|180_180|360_180|540_180|0_360|180_360|360_360|540_360|0_540|180_540|360_540|540_540:fill=none[out]`, '-map', '[out]', '-frames:v', '1', path.join(assets, 'gif-frames.png')]);
console.log('GIF transparentes 180 × 180 guardados:', path.join(assets, 'EduScream.gif'), path.join(assets, 'EduScream_Saludo.gif'));
