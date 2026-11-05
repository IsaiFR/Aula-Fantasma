'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createCanvas,loadImage}=require(process.env.AULA_CANVAS_MODULE||path.join(os.homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','node','node_modules','@napi-rs','canvas'));
const {serializePet,animationProfile}=require('../src/pet-package.cjs');
const {behaviorProfile}=require('../src/behavior.cjs');
const root=path.join(__dirname,'..'),assets=path.join(root,'web','eduf1'),size=512;
(async()=>{
  const sheet=createCanvas(1024,512),ctx=sheet.getContext('2d'),views={};
  const coordinates={right:[[233,453,82,148],[1092,544,89,145],[1652,460,73,118,340,407]],left:[[1040,548,97,145],[1930,455,88,146],[462,465,78,126,330,410]]};
  for(const [index,side] of ['right','left'].entries()){
    const image=await loadImage(path.join(assets,side+'-source.png'));
    const view=createCanvas(size,size),c=view.getContext('2d'),scale=496/image.width,x=8,y=215;
    c.drawImage(image,x,y,496,image.height*scale);
    const pixels=c.getImageData(0,0,size,size);let transparent=0;
    for(let at=3;at<pixels.data.length;at+=4){if(pixels.data[at]<64)pixels.data[at]=0;if(!pixels.data[at])transparent++;}
    if(transparent<pixels.data.length/4*.6)throw new Error('Falta transparencia en '+side);
    c.putImageData(pixels,0,0);fs.writeFileSync(path.join(assets,side+'.png'),view.toBuffer('image/png'));
    ctx.drawImage(view,index*size,0);
    views[side]={crop:{x:index/2,y:0,width:.5,height:1},wheels:coordinates[side].map(([cx,cy,rx,ry,clipTop,clipBottom])=>({cx:(x+cx*scale)/size,cy:(y+cy*scale)/size,rx:rx*scale/size,ry:ry*scale/size,...(clipTop?{clip:{x:0,y:(y+clipTop*scale)/size,width:1,height:(clipBottom-clipTop)*scale/size}}:{})}))};
  }
  fs.writeFileSync(path.join(assets,'atlas.png'),sheet.toBuffer('image/png'));
  const images=Object.fromEntries([['open','right.png'],['atlas','atlas.png']].map(([kind,file])=>[kind,{mime:'image/png',bytes:fs.readFileSync(path.join(assets,file))}]));
  const pet={name:'EduF1',images,animation:animationProfile({float:{enabled:false},cloth:{enabled:false},blink:{enabled:false}}),behavior:behaviorProfile({greeting:{text:'¡Vrooom!'},vehicle:{views,wheelRadius:.065,turnRate:2}})};
  const target=path.join(root,'pets','EduF1.aulapet');fs.writeFileSync(target,serializePet(pet));
  console.log(JSON.stringify({pet:'pets/EduF1.aulapet',bytes:fs.statSync(target).size,views:2,wheelsPerView:3}));
})().catch(error=>{console.error(error);process.exitCode=1;});
