'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { createCanvas, loadImage } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const root = path.join(__dirname, '..'), assets = path.join(root, 'web', 'edupiramyd'), build = path.join(root, '.gif-build');
const image = name => loadImage(path.join(assets, name));
async function render() {
const body = await image('rig-body.png');
const legs = [
  { image: await image('rig-hind-far.png'), x: 190, y: 220, width: 19, height: 28, phase: 0, stride: 5 },
  { image: await image('rig-hind-near.png'), x: 207, y: 220, width: 19, height: 28, phase: .5, stride: 5 },
  { image: await image('rig-front.png'), x: 230, y: 220, width: 21, height: 28, phase: .25, stride: 6 }
];
const buffers = [], motion = [];
for (let frame = 0; frame < 9; frame++) {
  const canvas = createCanvas(256, 256), context = canvas.getContext('2d'), poses = [];
  for (const leg of legs) {
    const phase = (frame / 8 + leg.phase) % 1, stance = phase < .65, returning = (phase - .65) / .35;
    const shift = frame === 8 ? 0 : leg.stride * (stance ? 1 - 2 * phase / .65 : -1 + 2 * returning);
    const lift = frame === 8 || stance ? 0 : 4 * Math.sin(Math.PI * returning);
    // El extremo superior permanece unido al cuerpo. El pie retrocede durante
    // el apoyo y vuelve hacia delante levantado, sin mover el agarre ni el arma.
    context.save();
    context.setTransform(1, 0, shift / leg.height, (leg.height - lift) / leg.height, leg.x - leg.width / 2, leg.y);
    context.drawImage(leg.image, 0, 0, leg.width, leg.height);
    context.restore(); poses.push({ shift, lift });
  }
  context.drawImage(body, 8, 248 - body.height);
  const pixels = context.getImageData(0, 0, 256, 256).data;
  if (!pixels.some((value, offset) => offset % 4 === 3 && value > 200)) throw new Error('El fotograma está vacío.');
  // Una región fija contiene la hoja entera. La región superior incluye
  // empuñadura y pata de agarre; ninguna pata móvil entra en ambas regiones.
  if (frame) for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    if (x >= 175 && y >= 220) continue;
    const offset = (y * 256 + x) * 4;
    for (let channel = 0; channel < 4; channel++) if (pixels[offset + channel] !== buffers[0][offset + channel]) throw new Error('La espada, cuerpo o agarre cambiaron de píxeles.');
  }
  buffers.push(Buffer.from(pixels)); motion.push(poses);
  fs.writeFileSync(path.join(build, `piramyd-frame-${String(frame).padStart(2, '0')}.png`), canvas.toBuffer('image/png'));
}
for (let leg = 0; leg < 3; leg++) if (new Set(motion.slice(0, 8).map(poses => poses[leg].shift.toFixed(3))).size < 6) throw new Error('Una pata de apoyo no camina.');
for (const [left, right] of [[176, 199], [199, 218], [218, 251]]) {
  const crops = buffers.slice(0, 8).map(pixels => {
    const rows = []; for (let y = 236; y < 249; y++) rows.push(pixels.subarray((y * 256 + left) * 4, (y * 256 + right) * 4));
    return Buffer.concat(rows).toString('base64');
  });
  if (new Set(crops).size < 6) throw new Error('Los píxeles de una pata de apoyo están inmóviles.');
}
console.log('Rig: espada y agarre idénticos en 9 poses; las tres patas de apoyo caminan.');
}
render().catch(error => { console.error(error); process.exitCode = 1; });
