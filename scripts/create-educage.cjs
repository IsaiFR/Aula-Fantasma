'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createCanvas,loadImage}=require(process.env.AULA_CANVAS_MODULE||path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules','@napi-rs','canvas'));
const {serializePet,animationProfile}=require('../src/pet-package.cjs');
const {behaviorProfile}=require('../src/behavior.cjs');
const root=path.join(__dirname,'..'),assets=path.join(root,'web','educage');
// Regiones faciales en el lienzo original de 1254 px. El resto del personaje es idéntico.
const regions={eyes:[{x:601,y:399,width:145,height:50},{x:872,y:403,width:130,height:50}],mouth:[{x:735,y:471,width:136,height:94}]};
(async()=>{
  const files=['reference','blink-source','talking-source'];
  const decoded=[];
  for(const name of files){const image=await loadImage(path.join(assets,name+'.png'));if(image.width!==1254||image.height!==1254)throw new Error('El lienzo de '+name+' no coincide.');const c=createCanvas(1254,1254),ctx=c.getContext('2d');ctx.drawImage(image,0,0);decoded.push(ctx.getImageData(0,0,1254,1254));}
  const [base,blink,talking]=decoded;
  const images={open:{mime:'image/png',bytes:fs.readFileSync(path.join(assets,'reference.png'))}};
  fs.writeFileSync(path.join(assets,'open.png'),images.open.bytes);
  for(const [kind,eyes,mouth] of [['closed',true,false],['talking',false,true],['talkingClosed',true,true]]){
    const c=createCanvas(1254,1254),ctx=c.getContext('2d'),frame=ctx.createImageData(1254,1254);frame.data.set(base.data);
    for(const [enabled,patch,list] of [[eyes,blink,regions.eyes],[mouth,talking,regions.mouth]]){
      if(!enabled)continue;
      for(const r of list)for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){
        const i=(y*1254+x)*4;
        const isLens=list===regions.eyes;
        // Mantener los brillos originales sobre los párpados, incluso si el dibujo los cruza.
        const highlight=isLens?Math.max(0,Math.min(1,(105-Math.max(base.data[i],base.data[i+1],base.data[i+2]))/62)):1;
        // Seleccionar la tinta lavanda del párpado, dejando intacto el fondo neutro de la lente.
        const eyelid=isLens?Math.max(0,Math.min(1,(patch.data[i]-patch.data[i+1]-2)/6)):1;
        // Alinear el centro de la boca generada con la línea original bajo la nariz.
        const sample=isLens?i:i-21*4;
        const topWidth=Math.min(68,30+(y-471)*3);
        const edge=isLens?1:(topWidth-Math.abs(x-804))/5;
        const t=Math.max(0,Math.min(1,Math.min(x-r.x,y-r.y,r.x+r.width-1-x,r.y+r.height-1-y)/(isLens?5:6),edge))*highlight*eyelid;
        const alpha=t*t*(3-2*t);
        for(let k=0;k<3;k++)frame.data[i+k]=Math.round(base.data[i+k]*(1-alpha)+patch.data[sample+k]*alpha);
      }
    }
    ctx.putImageData(frame,0,0);const bytes=c.toBuffer('image/png');fs.writeFileSync(path.join(assets,kind+'.png'),bytes);images[kind]={mime:'image/png',bytes};
  }
  const animation=animationProfile({float:{enabled:false},cloth:{enabled:false},blink:{enabled:true,intervalMin:.75,intervalMax:4,duration:.15,closeDuration:.04,openDuration:.06,regions:[]}});
  const pet={name:'EduCage',kind:'voice',images,animation,behavior:behaviorProfile()};
  const bytes=serializePet(pet);fs.writeFileSync(path.join(root,'pets','EduCage-Voz.pet'),bytes);
  fs.writeFileSync(path.join(assets,'regions.json'),JSON.stringify(regions,null,2)+'\n');
  console.log(JSON.stringify({pet:'pets/EduCage-Voz.pet',name:pet.name,version:JSON.parse(bytes).version,bytes:bytes.length,poses:Object.keys(images)}));
})().catch(error=>{console.error(error);process.exitCode=1;});
