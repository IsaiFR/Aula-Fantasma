'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createCanvas,loadImage}=require(process.env.AULA_CANVAS_MODULE||path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules','@napi-rs','canvas'));
const {serializePet,animationProfile}=require('../src/pet-package.cjs');
const {behaviorProfile}=require('../src/behavior.cjs');
const root=path.join(__dirname,'..'),assets=path.join(root,'web','edudonalds');
// Regiones faciales en el lienzo de 1293 × 1216 px. El resto del personaje es idéntico.
const regions={eyes:[{x:590,y:306,width:163,height:132},{x:833,y:294,width:147,height:130}],mouth:[{x:744,y:448,width:105,height:80}]};
(async()=>{
  const files=['reference','blink-source','talking-source'];
  const decoded=[];
  for(const name of files){
    const image=await loadImage(path.join(assets,name+'.png'));
    // Imagegen puede redondear uno o dos píxeles las referencias de expresión.
    const mismatch=name==='reference'?(image.width!==1293||image.height!==1216):(Math.abs(image.width-1293)>2||Math.abs(image.height-1216)>2);
    if(mismatch)throw new Error('El lienzo de '+name+' no coincide.');
    const c=createCanvas(1293,1216),ctx=c.getContext('2d');ctx.drawImage(image,0,0,1293,1216);decoded.push(ctx.getImageData(0,0,1293,1216));
  }
  const [base,blink,talking]=decoded;
  const images={open:{mime:'image/png',bytes:fs.readFileSync(path.join(assets,'reference.png'))}};
  fs.writeFileSync(path.join(assets,'open.png'),images.open.bytes);
  for(const [kind,eyes,mouth] of [['closed',true,false],['talking',false,true],['talkingClosed',true,true]]){
    const c=createCanvas(1293,1216),ctx=c.getContext('2d'),frame=ctx.createImageData(1293,1216);frame.data.set(base.data);
    for(const [enabled,patch,list] of [[eyes,blink,regions.eyes],[mouth,talking,regions.mouth]]){
      if(!enabled)continue;
      for(const r of list)for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){
        // Conservar el brazo diagonal y toda la lente a su derecha, evitando duplicarlo.
        if(list===regions.eyes&&y>=294&&y<=424&&x>=934+(y-294)*29/120-6)continue;
        const i=(y*1293+x)*4;
        // Fundido suave sobre el rostro para evitar bordes rectangulares visibles.
        const feather=list===regions.mouth?6:5;
        const t=Math.min(1,Math.min(x-r.x,y-r.y,r.x+r.width-1-x,r.y+r.height-1-y)/feather);
        const alpha=t*t*(3-2*t);
        for(let k=0;k<3;k++)frame.data[i+k]=Math.round(base.data[i+k]*(1-alpha)+patch.data[i+k]*alpha);
      }
    }
    ctx.putImageData(frame,0,0);const bytes=c.toBuffer('image/png');fs.writeFileSync(path.join(assets,kind+'.png'),bytes);images[kind]={mime:'image/png',bytes};
  }
  const animation=animationProfile({float:{enabled:false},cloth:{enabled:false},blink:{enabled:true,intervalMin:.75,intervalMax:4,duration:.15,closeDuration:.04,openDuration:.06,regions:[]}});
  const pet={name:'EduDonalds',kind:'voice',images,animation,behavior:behaviorProfile()};
  const bytes=serializePet(pet);fs.writeFileSync(path.join(root,'pets','EduDonalds-Voz.pet'),bytes);
  fs.writeFileSync(path.join(assets,'regions.json'),JSON.stringify(regions,null,2)+'\n');
  console.log(JSON.stringify({pet:'pets/EduDonalds-Voz.pet',name:pet.name,version:JSON.parse(bytes).version,bytes:bytes.length,poses:Object.keys(images)}));
})().catch(error=>{console.error(error);process.exitCode=1;});
