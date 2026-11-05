'use strict';
// Dos vistas dibujadas: nunca se reflejan las letras de la carrocería.
window.AulaVehicle = class {
  constructor(body) {
    this.body=body;this.canvas=document.createElement('canvas');this.canvas.id='pet-vehicle';body.append(this.canvas);
    this.ctx=this.canvas.getContext('2d');this.image=new Image();this.ready=false;this.url='';this.textures=new Map();
    this.image.onload=()=>{this.ready=true;this.textures.clear();};this.image.onerror=()=>{this.ready=false;};
  }
  setAsset(url) {
    url=url||'';if(url===this.url)return;this.url=url;this.ready=false;this.textures.clear();
    if(url)this.image.src=url;else this.image.removeAttribute('src');
  }
  wheelTexture(side,index,view,wheel) {
    const key=side+index;if(this.textures.has(key))return this.textures.get(key);
    const texture=document.createElement('canvas');texture.width=256;texture.height=256;
    const c=texture.getContext('2d'),crop=view.crop,w=this.image.naturalWidth,h=this.image.naturalHeight;
    c.drawImage(this.image,(crop.x+(wheel.cx-wheel.rx)*crop.width)*w,(crop.y+(wheel.cy-wheel.ry)*crop.height)*h,2*wheel.rx*crop.width*w,2*wheel.ry*crop.height*h,0,0,256,256);
    this.textures.set(key,texture);return texture;
  }
  render(frame,visible) {
    const config=frame.behavior?.vehicle,state=frame.vehicle,active=Boolean(config&&state&&visible&&this.ready);
    this.body.classList.toggle('vehicle-active',active);if(!active)return;
    const n=Math.max(32,Math.min(1024,Math.round(this.body.clientWidth*(window.devicePixelRatio||1))));
    if(this.canvas.width!==n){this.canvas.width=n;this.canvas.height=n;}
    const ctx=this.ctx,cos=Math.cos(state.heading),side=cos<0?'left':'right',view=config.views[side],crop=view.crop;
    const yaw=.24+.76*Math.abs(cos),bank=Math.sin(state.heading)*(side==='left'?-1:1)*.14+state.steering*.045;
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,n,n);ctx.scale(n,n);
    ctx.translate(.5,.64);ctx.rotate(bank);ctx.scale(yaw,1);ctx.translate(-.5,-.64);
    ctx.drawImage(this.image,crop.x*this.image.naturalWidth,crop.y*this.image.naturalHeight,crop.width*this.image.naturalWidth,crop.height*this.image.naturalHeight,0,0,1,1);
    view.wheels.forEach((wheel,index)=>{
      ctx.save();
      if(wheel.clip){const r=wheel.clip;ctx.beginPath();ctx.rect(r.x,r.y,r.width,r.height);ctx.clip();}
      ctx.translate(wheel.cx,wheel.cy);ctx.scale(wheel.rx,wheel.ry);
      ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.clip();
      ctx.rotate(state.wheelAngle*(side==='left'?-1:1));
      ctx.drawImage(this.wheelTexture(side,index,view,wheel),-1,-1,2,2);ctx.restore();
    });
    Object.assign(this.canvas.dataset,{side,heading:String(state.heading),wheelAngle:String(state.wheelAngle),steering:String(state.steering),moving:String(state.moving)});
  }
};
