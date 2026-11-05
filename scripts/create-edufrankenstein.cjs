'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { gifInfo } = require('../src/gif.cjs');
const root = path.join(__dirname, '..'), build = path.join(root, '.gif-build');
const source = path.join(root, 'web', 'edufrankenstein-source.png');
fs.mkdirSync(build, { recursive: true });
function ffmpeg(args) {
  const result = spawnSync('ffmpeg.exe', ['-hide_banner','-loglevel','error','-y',...args], { cwd: build, windowsHide: true, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'No se pudo crear el GIF.');
}
const text = '¡Está vivo!';
fs.writeFileSync(path.join(build, 'frankenstein-text.txt'), text);
const png = fs.readFileSync(source), width = png.readUInt32BE(16), height = png.readUInt32BE(20);
const size = 256;
const bubble = "drawbox=x=46:y=7:w=164:h=40:color=0x1b2037:t=fill:replace=1,drawbox=x=48:y=9:w=160:h=36:color=white:t=fill:replace=1,drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':textfile=frankenstein-text.txt:fontsize=24:fontcolor=0x1b2037:x=(w-text_w)/2:y=15";
const frameName = index => `frankenstein-frame-${String(index).padStart(2,'0')}.png`;
for (let index = 0; index < 16; index++) {
  // La hoja corregida coloca el primer rayo en la segunda celda.
  const sourceIndex = index === 15 ? 0 : index === 1 ? 2 : index === 2 ? 1 : index;
  const col=sourceIndex%4,row=Math.floor(sourceIndex/4),x=Math.round(col*width/4);
  // La IA espació las filas de forma desigual. Recortes medidos en la hoja
  // preservan la escala y evitan incluir patas de la fila anterior.
  const starts=[0,372,676,998],ends=[353,664,973,1223],floors=[345,656,965,1215];
  const y=Math.round(starts[row]*height/1254),end=Math.round(ends[row]*height/1254);
  const w=Math.round((col+1)*width/4)-x,h=end-y,scaledWidth=201;
  const scaledHeight=Math.round(h*scaledWidth/w),baseline=Math.round((floors[row]*height/1254-y)*scaledWidth/w);
  const wobble = index>=8 && index<=11 ? [-7,5,-3,7][index-8] : 0;
  const filters = [`crop=${w}:${h}:${x}:${y}`, `scale=${scaledWidth}:${scaledHeight}:flags=lanczos`, `pad=256:256:${27+wobble}:${248-baseline}:color=0x00000000`, 'format=rgba'];
  if(index>=2 && index<=7) filters.push(bubble);
  ffmpeg(['-i',source,'-vf',filters.join(','),'-frames:v','1',frameName(index)]);
}
const entry=(frame,seconds,stage)=>({frame,seconds,stage,...(frame>=2&&frame<=7?{text}: {})});
const sequence=[entry(0,9.75,'dead'),entry(1,.25,'dead'),entry(2,.2,'lightning'),entry(3,.3,'lightning'),entry(4,.9,'rise'),entry(5,.9,'rise'),entry(6,.9,'rise'),entry(7,1.8,'rise')];
for(let repetition=0;repetition<25;repetition++)for(let frame=8;frame<=11;frame++)sequence.push(entry(frame,.3,'walk'));
sequence.push(entry(12,.25,'fall'),entry(13,.25,'fall'),entry(14,.25,'fall'));
const duration=sequence.reduce((sum,entry)=>sum+entry.seconds,0);
ffmpeg(['-framerate','10','-i','frankenstein-frame-%02d.png','-vf','palettegen=reserve_transparent=1:stats_mode=full','-frames:v','1','frankenstein-palette.png']);
const listing=sequence.map(entry=>`file '${frameName(entry.frame)}'\noption framerate 100\nduration ${entry.seconds}`).join('\n');
fs.writeFileSync(path.join(build,'frankenstein-cycle.ffconcat'),`ffconcat version 1.0\n${listing}\nfile '${frameName(sequence.at(-1).frame)}'\noption framerate 100\n`);
const gif=path.join(root,'pets','EduFrankenstein.gif');
ffmpeg(['-f','concat','-safe','0','-i','frankenstein-cycle.ffconcat','-i','frankenstein-palette.png','-filter_complex','[0:v][1:v]paletteuse=alpha_threshold=64:dither=sierra2_4a','-fps_mode','vfr','-frames:v',String(sequence.length),'-final_delay',String(Math.round(sequence.at(-1).seconds*100)),'-loop','0',gif]);
const labels=Array.from({length:16},(_,i)=>`[v${i}]`).join('');
const parts=Array.from({length:16},(_,i)=>`[v${i}]select=eq(n\\,${i}),setpts=PTS-STARTPTS[s${i}]`).join(';');
const inputs=Array.from({length:16},(_,i)=>`[s${i}]`).join('');
const layout=Array.from({length:16},(_,i)=>`${i%4*size}_${Math.floor(i/4)*size}`).join('|');
const sheet=path.join(root,'web','edufrankenstein-frames.png');
ffmpeg(['-framerate','10','-i','frankenstein-frame-%02d.png','-filter_complex',`[0:v]split=16${labels};${parts};${inputs}xstack=inputs=16:layout=${layout}:fill=none[out]`,'-map','[out]','-frames:v','1',sheet]);
const open=path.join(root,'web','edufrankenstein-open.png');
fs.copyFileSync(path.join(build,frameName(8)),open);
const images=Object.fromEntries([['open',open,'image/png'],['frames',sheet,'image/png'],['cycle',gif,'image/gif']].map(([kind,file,mime])=>[kind,{mime,bytes:fs.readFileSync(file)}]));
const animation=animationProfile({float:{enabled:false},cloth:{enabled:false},blink:{enabled:false}});
const behavior={walk:{enabled:false},greeting:{text,raiseSeconds:0,holdSeconds:3.2,lowerSeconds:0},rig:null,cycle:{size,columns:4,rows:4,mirror:true,sequence}};
// Normalizar una vez para que exportar/importar no cambie la identidad del paquete.
const { behaviorProfile } = require('../src/behavior.cjs');
const target=path.join(root,'pets','EduFrankenstein.aulapet');
fs.writeFileSync(target,serializePet({name:'EduFrankenstein',images,animation,behavior:behaviorProfile(behavior)}));
console.log(JSON.stringify({pet:target,gif,...gifInfo(images.cycle.bytes),expectedDuration:duration},null,2));
