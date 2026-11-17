'use strict';
// Anima la ilustración original con cuatro apoyos desfasados; no redibuja el personaje.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const { createCanvas, loadImage } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');
const { gifInfo } = require('../src/gif.cjs');
const root = path.resolve(__dirname, '..'), assets = path.join(root, 'web', 'cuellilargo');
const size = 512, count = 24, seconds = .08, columns = 6, rows = 4;
const legs = [
  { name: 'trasera-cercana', phase: 0, polygon: [[205,1110],[337,1110],[313,1190],[260,1260],[227,1390],[203,1510],[253,1665],[74,1665],[88,1470],[123,1290],[170,1195]] },
  { name: 'trasera-lejana', phase: .5, polygon: [[337,1110],[423,1110],[399,1200],[370,1270],[377,1410],[407,1500],[422,1610],[285,1610],[300,1460],[293,1300],[315,1190]] },
  { name: 'delantera-cercana', phase: .75, polygon: [[423,1110],[553,1110],[519,1220],[496,1320],[489,1460],[501,1520],[553,1665],[385,1665],[391,1495],[401,1330],[400,1230]] },
  { name: 'delantera-lejana', phase: .25, polygon: [[594,1110],[711,1110],[697,1220],[715,1350],[749,1490],[833,1640],[652,1640],[653,1510],[620,1380],[603,1250]] }
];
function ffmpeg(args) {
  const result = spawnSync('ffmpeg.exe', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { windowsHide: true, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'No se pudo generar el GIF.');
}
async function main() {
  fs.mkdirSync(assets, { recursive: true });
  const source = path.join(assets, 'reference.png');
  if (process.argv[2]) fs.copyFileSync(path.resolve(process.argv[2]), source);
  const image = await loadImage(source), w = image.width, h = image.height;
  if (w !== 941 || h !== 1672) throw new Error('Se requiere el adjunto original de 941 × 1672.');
  const original = createCanvas(w, h), oc = original.getContext('2d'); oc.drawImage(image, 0, 0);
  // Los cuatro recortes empiezan bajo las placas del torso. La unión superior
  // permanece fija; rodillas, tobillos y pies siguen una trayectoria continua.
  const layers = legs.map(leg => {
    const canvas = createCanvas(w, h), c = canvas.getContext('2d');
    c.beginPath(); leg.polygon.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.closePath(); c.clip(); c.drawImage(image,0,0);
    return { ...leg, canvas };
  });
  const body = createCanvas(w,h), bc = body.getContext('2d'); bc.drawImage(image,0,0);
  bc.globalCompositeOperation = 'destination-out';
  for (const layer of layers) bc.drawImage(layer.canvas,0,0);
  const sheet = createCanvas(size * columns, size * rows), sc = sheet.getContext('2d');
  const build = fs.mkdtempSync(path.join(root, '.gif-build-cuellilargo-'));
  const scale = 486 / h, x = (size - w * scale) / 2, y = 13;
  try {
    const motion = [];
    for (let frame = 0; frame < count; frame++) {
      const canvas = createCanvas(size,size), c = canvas.getContext('2d'), phase = frame / count;
      c.translate(x,y); c.scale(scale,scale);
      const bob = 3 * (1 - Math.cos(phase * Math.PI * 4)), poses = [];
      c.translate(0,-bob);
      for (const layer of layers) {
        const t = (phase + layer.phase) % 1, stance = t < .72, swing = (t - .72) / .28;
        const shift = stance ? 32 * (1 - 2 * t / .72) : -32 * Math.cos(Math.PI * swing);
        const lift = stance ? 0 : 29 * Math.sin(Math.PI * swing);
        // Tres tramos unidos: cadera fija, rodilla flexible, pie rígido.
        const points = [[1110,0,0],[1270,shift * .45, -lift * .25 + bob * .3],[1495,shift,-lift + bob],[h,shift,-lift + bob]];
        for (let k = 0; k < points.length - 1; k++) {
          const [top,dx0,dy0] = points[k], [bottom,dx1,dy1] = points[k+1], height = bottom - top;
          c.save(); c.transform(1,0,(dx1-dx0)/height,1+(dy1-dy0)/height,dx0,top+dy0);
          c.drawImage(layer.canvas,0,top,w,height,0,0,w,height); c.restore();
        }
        poses.push({ name: layer.name, shift, lift, stance });
      }
      // El cuello se balancea muy suavemente sobre la cadera, sin cortar el disco.
      const sway = .006 * Math.sin(phase * 2 * Math.PI);
      c.save(); c.transform(1,0,sway,1,-1110*sway,0); c.drawImage(body,0,0); c.restore();
      sc.drawImage(canvas,frame % columns * size,Math.floor(frame / columns) * size);
      fs.writeFileSync(path.join(build,`frame-${String(frame).padStart(2,'0')}.png`),canvas.toBuffer('image/png'));
      if (!frame) fs.writeFileSync(path.join(assets,'open.png'),canvas.toBuffer('image/png'));
      motion.push(poses);
    }
    fs.writeFileSync(path.join(assets,'frames.png'),sheet.toBuffer('image/png'));
    const gif = path.join(assets,'walk.gif');
    ffmpeg(['-framerate','12.5','-i',path.join(build,'frame-%02d.png'),'-vf','palettegen=reserve_transparent=1:stats_mode=full','-frames:v','1',path.join(build,'palette.png')]);
    ffmpeg(['-framerate','12.5','-i',path.join(build,'frame-%02d.png'),'-i',path.join(build,'palette.png'),'-filter_complex','[0:v][1:v]paletteuse=alpha_threshold=64:dither=sierra2_4a','-gifflags','0','-loop','0',gif]);
    const images = Object.fromEntries([['open','open.png','image/png'],['frames','frames.png','image/png'],['cycle','walk.gif','image/gif']].map(([key,file,mime])=>[key,{mime,bytes:fs.readFileSync(path.join(assets,file))}]));
    const animation = animationProfile({float:{enabled:false},cloth:{enabled:false},blink:{enabled:false}});
    const behavior = behaviorProfile({cycle:{size,columns,rows,mirror:true,sequence:Array.from({length:count},(_,frame)=>({frame,seconds,stage:'walk'}))}});
    fs.writeFileSync(path.join(root,'pets','Cuellilargo.aulapet'),serializePet({name:'Cuellilargo',images,animation,behavior}));
    fs.writeFileSync(path.join(assets,'motion.json'),JSON.stringify({size,count,seconds,legs:motion},null,2)+'\n');
    console.log(JSON.stringify({pet:'pets/Cuellilargo.aulapet',...gifInfo(images.cycle.bytes)}));
  } finally {
    const resolved = path.resolve(build);
    if (path.dirname(resolved) !== root || !path.basename(resolved).startsWith('.gif-build-cuellilargo-')) throw new Error('Ruta temporal no válida.');
    fs.rmSync(resolved,{recursive:true,force:true});
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
