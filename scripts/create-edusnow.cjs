'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createCanvas,loadImage}=require(process.env.AULA_CANVAS_MODULE||path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules','@napi-rs','canvas'));
const {serializePet,animationProfile}=require('../src/pet-package.cjs');
const {behaviorProfile}=require('../src/behavior.cjs');
const root=path.join(__dirname,'..'),assets=path.join(root,'web','edusnow');
// Regiones faciales en el lienzo original de 1254 px. El resto del personaje es idéntico.
const regions={eyes:[{x:551,y:386,width:168,height:139},{x:797,y:368,width:155,height:139}],mouth:[{x:704,y:532,width:132,height:90}]};
const noseOutline=[[738,501],[743,481],[757,471],[780,470],[844,470],[857,477],[858,485],[848,497],[819,513],[777,534],[757,536],[744,527]];
function onNose(x,y){let inside=false;for(let i=0,j=noseOutline.length-1;i<noseOutline.length;j=i++){const [a,b]=noseOutline[i],[c,d]=noseOutline[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;}return inside;}
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
        // La zanahoria pasa delante del lente derecho: mantenerla intacta.
        if(list===regions.eyes&&onNose(x,y))continue;
        // El brazo diagonal de los lentes queda delante del ojo derecho.
        if(list===regions.eyes&&y>=365&&y<=501&&Math.abs(x-(896+(y-366)*40/129))<=7)continue;
        const i=(y*1254+x)*4;
        // Fundido suave sobre el pelaje para evitar bordes rectangulares visibles.
        const feather=list===regions.mouth?8:5;
        const t=Math.min(1,Math.min(x-r.x,y-r.y,r.x+r.width-1-x,r.y+r.height-1-y)/feather);
        const alpha=t*t*(3-2*t);
        for(let k=0;k<3;k++)frame.data[i+k]=Math.round(base.data[i+k]*(1-alpha)+patch.data[i+k]*alpha);
      }
    }
    ctx.putImageData(frame,0,0);const bytes=c.toBuffer('image/png');fs.writeFileSync(path.join(assets,kind+'.png'),bytes);images[kind]={mime:'image/png',bytes};
  }
  const animation=animationProfile({float:{enabled:false},cloth:{enabled:false},blink:{enabled:true,intervalMin:.75,intervalMax:4,duration:.15,closeDuration:.04,openDuration:.06,regions:[]}});
  const pet={name:'EduSnow',kind:'voice',images,animation,behavior:behaviorProfile()};
  const bytes=serializePet(pet);fs.writeFileSync(path.join(root,'pets','EduSnow-Voz.pet'),bytes);
  fs.writeFileSync(path.join(assets,'regions.json'),JSON.stringify(regions,null,2)+'\n');
  console.log(JSON.stringify({pet:'pets/EduSnow-Voz.pet',name:pet.name,version:JSON.parse(bytes).version,bytes:bytes.length,poses:Object.keys(images)}));
})().catch(error=>{console.error(error);process.exitCode=1;});
