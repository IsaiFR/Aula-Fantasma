'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawnSync } = require('node:child_process');
const { createCanvas, loadImage } = require(process.env.AULA_CANVAS_MODULE || path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', '@napi-rs', 'canvas'));
const { serializePet, animationProfile } = require('../src/pet-package.cjs');
const { behaviorProfile } = require('../src/behavior.cjs');
const { gifInfo } = require('../src/gif.cjs');
const root = path.join(__dirname, '..'), assets = path.join(root, 'web', 'eduzombie'), build = path.join(root, '.gif-build');
const size = 256, name = index => `zombie-frame-${String(index).padStart(2, '0')}.png`;
const entry = (frame, seconds, stage) => ({ frame, seconds, stage, ...([0,1,2,3,4,5,15].includes(frame) ? { text: 'RIP · EduCat' } : {}) });
const sequence = [entry(0,3,'dead'),entry(1,.6,'rise'),entry(2,.65,'rise'),entry(3,.75,'rise'),entry(4,.75,'rise'),entry(5,.7,'rise'),entry(6,.55,'rise')];
for (let repetition = 0; repetition < 16; repetition++) for (let frame = 6; frame <= 11; frame++) sequence.push(entry(frame,.25,'walk'));
sequence.push(entry(12,.45,'fall'),entry(13,.55,'fall'),entry(14,.55,'fall'),entry(15,.45,'fall'));
function ffmpeg(args) {
  const result = spawnSync('ffmpeg.exe', ['-hide_banner','-loglevel','error','-y',...args], { cwd:build, windowsHide:true, encoding:'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'No se pudo crear EduZombie.');
}
(async () => {
  fs.mkdirSync(build,{recursive:true});
  const source = await loadImage(path.join(assets,'source-sheet.png'));
  const catCanvas=createCanvas(source.width,source.height),catContext=catCanvas.getContext('2d');catContext.drawImage(source,0,0);
  const catPixels=catContext.getImageData(0,0,source.width,source.height).data;
  const catFloors=[];
  for(let pose=0;pose<15;pose++) {
    const x0=Math.round(pose%4*source.width/4),x1=Math.round((pose%4+1)*source.width/4),y0=Math.round(Math.floor(pose/4)*source.height/4),y1=Math.round((Math.floor(pose/4)+1)*source.height/4);
    let floor=y0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(catPixels[(y*source.width+x)*4+3]>=64)floor=Math.max(floor,y);
    catFloors.push((floor-y0+1)/(y1-y0));
  }
  const grave = await loadImage(path.join(assets,'grave-reference.png'));
  const inspection=createCanvas(grave.width,grave.height),inspect=inspection.getContext('2d');inspect.drawImage(grave,0,0);
  const pixels=inspect.getImageData(0,0,grave.width,grave.height).data;
  let left=grave.width,top=grave.height,right=0,bottom=0;
  for(let y=0;y<grave.height;y++)for(let x=0;x<grave.width;x++)if(pixels[(y*grave.width+x)*4+3]>0){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
  const graveWidth=right-left+1,graveHeight=bottom-top+1,drawHeight=220,drawWidth=graveWidth*drawHeight/graveHeight;
  const sheet = createCanvas(size*4,size*4), sheetContext=sheet.getContext('2d');
  // Una sola lápida original: misma textura, lirio, musgo y letras en todos los estados.
  // Los fotogramas del gato mantienen la escala común de la hoja.
  for (let index=0;index<16;index++) {
    const canvas=createCanvas(size,size), ctx=canvas.getContext('2d');
    ctx.save();ctx.beginPath();ctx.rect(8,8,240,236);ctx.clip();
    if(index<=5 || index===15) {
      const sink=index===5?70:0;
      ctx.drawImage(grave,left,top,graveWidth,graveHeight,(size-drawWidth)/2,244-drawHeight+sink,drawWidth,drawHeight);
    }
    if(index>0){
      const pose=index-1,scale=[.8,.8,.72,.78][pose] ?? 1,extent=240*scale;
      // Registrar los acercamientos de la salida y todas las patas en el mismo suelo.
      const x=8+(240-extent)*.65,y=244-catFloors[pose]*extent;
      ctx.drawImage(source,pose%4*source.width/4,Math.floor(pose/4)*source.height/4,source.width/4,source.height/4,x,y,extent,extent);
    }
    ctx.restore();
    // Igual umbral de transparencia que el GIF: evita restos de mate en la alternativa PNG.
    const rgba=ctx.getImageData(0,0,size,size);
    for(let at=3;at<rgba.data.length;at+=4)if(rgba.data[at]<64)rgba.data[at]=0;
    ctx.putImageData(rgba,0,0);
    const bytes=canvas.toBuffer('image/png'); fs.writeFileSync(path.join(build,name(index)),bytes);
    sheetContext.drawImage(canvas,index%4*size,Math.floor(index/4)*size);
    if(index===0) fs.writeFileSync(path.join(assets,'grave.png'),bytes);
    if(index===6) fs.writeFileSync(path.join(assets,'open.png'),bytes);
  }
  fs.writeFileSync(path.join(assets,'frames.png'),sheet.toBuffer('image/png'));
  ffmpeg(['-framerate','10','-i','zombie-frame-%02d.png','-vf','palettegen=reserve_transparent=1:stats_mode=full','-frames:v','1','zombie-palette.png']);
  const listing=sequence.map(p=>`file '${name(p.frame)}'\noption framerate 100\nduration ${p.seconds}`).join('\n');
  fs.writeFileSync(path.join(build,'zombie-cycle.ffconcat'),`ffconcat version 1.0\n${listing}\nfile '${name(sequence.at(-1).frame)}'\noption framerate 100\n`);
  const gif=path.join(root,'pets','EduZombie.gif');
  ffmpeg(['-f','concat','-safe','0','-i','zombie-cycle.ffconcat','-i','zombie-palette.png','-filter_complex','[0:v][1:v]paletteuse=alpha_threshold=64:dither=sierra2_4a','-fps_mode','vfr','-frames:v',String(sequence.length),'-final_delay',String(sequence.at(-1).seconds*100),'-loop','0',gif]);
  const images=Object.fromEntries([['open',path.join(assets,'open.png'),'image/png'],['frames',path.join(assets,'frames.png'),'image/png'],['cycle',gif,'image/gif']].map(([kind,file,mime])=>[kind,{mime,bytes:fs.readFileSync(file)}]));
  const animation=animationProfile({float:{enabled:false},cloth:{enabled:false},blink:{enabled:false}});
  const behavior=behaviorProfile({walk:{enabled:false},greeting:{text:'Resucitar',raiseSeconds:0,holdSeconds:3.2,lowerSeconds:0},rig:null,cycle:{size,columns:4,rows:4,mirror:true,sequence}});
  fs.writeFileSync(path.join(root,'pets','EduZombie.aulapet'),serializePet({name:'EduZombie',images,animation,behavior}));
  console.log(JSON.stringify({pet:'pets/EduZombie.aulapet',...gifInfo(images.cycle.bytes)},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
