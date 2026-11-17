'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createCanvas,loadImage}=require(process.env.AULA_CANVAS_MODULE||path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules','@napi-rs','canvas'));
const {serializePet,animationProfile}=require('../src/pet-package.cjs');
const {behaviorProfile}=require('../src/behavior.cjs');
const root=path.join(__dirname,'..'),assets=path.join(root,'web','edubot');
// Regiones faciales en el lienzo original de 1254 px. El resto del personaje es idéntico.
const regions={eyes:[{x:591,y:351,width:187,height:160},{x:844,y:341,width:149,height:153}],mouth:[{x:754,y:511,width:120,height:75}]};
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
        // Mantener el brazo claro y oscuro del lateral derecho de los lentes.
        if(list===regions.eyes&&r===regions.eyes[1]&&x>=979+(y-345)*15/140-6)continue;
        const i=(y*1254+x)*4;
        // Fundido suave sobre el rostro para evitar bordes rectangulares visibles.
        const feather=list===regions.mouth?6:5;
        // Seguir la curvatura de las lentes al mezclar el fondo oscuro de los LED.
        const radius=list===regions.eyes?Math.hypot((x-r.x-(r.width-1)/2)/(r.width/2),(y-r.y-(r.height-1)/2)/(r.height/2)):0;
        if(radius>=1)continue;
        const t=Math.min(1,Math.min(x-r.x,y-r.y,r.x+r.width-1-x,r.y+r.height-1-y)/feather,list===regions.eyes?(1-radius)*Math.min(r.width,r.height)/24:1);
        const alpha=t*t*(3-2*t);
        for(let k=0;k<3;k++)frame.data[i+k]=Math.round(base.data[i+k]*(1-alpha)+patch.data[i+k]*alpha);
      }
    }
    ctx.putImageData(frame,0,0);const bytes=c.toBuffer('image/png');fs.writeFileSync(path.join(assets,kind+'.png'),bytes);images[kind]={mime:'image/png',bytes};
  }
  const animation=animationProfile({float:{enabled:false},cloth:{enabled:false},blink:{enabled:true,intervalMin:.75,intervalMax:4,duration:.15,closeDuration:.04,openDuration:.06,regions:[]}});
  const pet={name:'EduBot',kind:'voice',images,animation,behavior:behaviorProfile()};
  const bytes=serializePet(pet);fs.writeFileSync(path.join(root,'pets','EduBot-Voz.pet'),bytes);
  fs.writeFileSync(path.join(assets,'regions.json'),JSON.stringify(regions,null,2)+'\n');
  console.log(JSON.stringify({pet:'pets/EduBot-Voz.pet',name:pet.name,version:JSON.parse(bytes).version,bytes:bytes.length,poses:Object.keys(images)}));
})().catch(error=>{console.error(error);process.exitCode=1;});
