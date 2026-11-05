'use strict';
const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
module.exports=async function(c) {
  const {panel,smokeRoot,wait}=c,checks={},before=c.getFrame();
  const js=code=>panel.webContents.executeJavaScript(code);
  const companionEnabled=c.snapshot().companions.companion.enabled;
  const paint=async () => {
    const contents=c.obs.webContents;
    await contents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{contents.off('paint',painted);reject(new Error('Falta el fotograma vertical.'));},2500);
      const painted=(_event,_rect,image)=>{clearTimeout(timeout);resolve(image);};
      contents.once('paint',painted);contents.invalidate();
    });
  };
  // Comprobar la geometría real de la salida y su iframe, además de la miniatura.
  const originalSize = c.obs.getContentSize();
  const css = await c.obs.webContents.insertCSS('body { background-color: rgba(0,0,0,0); margin: 0px auto; overflow: hidden; }');
  const inspectCorner = `(() => {
    const layer=document.getElementById('voice-layer'),d=layer?.contentDocument;
    if(!d?.getElementById('pet-anchor')) return null;
    const outer=layer.getBoundingClientRect(),r=d.getElementById('pet-anchor').getBoundingClientRect();
    return {width:innerWidth,height:innerHeight,layerX:outer.x,layerY:outer.y,layerWidth:outer.width,layerHeight:outer.height,
      childWidth:layer.contentWindow.innerWidth,childHeight:layer.contentWindow.innerHeight,
      x:outer.x+r.x,y:outer.y+r.y,size:r.width,visible:getComputedStyle(d.getElementById('pet-anchor')).visibility};
  })()`;
  try {
    await js('window.aula.setSettings({paused:true,companionEnabled:false},"voice")');
    for (const [width,height] of [[1080,1920],[540,960]]) {
      c.obs.setContentSize(width,height);
      for (const corner of ['top-left','top-right','bottom-left','bottom-right']) {
        await js(`window.aula.setSettings({corner:${JSON.stringify(corner)}},"voice")`);
        const expected = require('../web/layout.js').petLayout(width,height,c.getFrame().settings,c.getFrame());
        await wait(async () => {
          const r=await c.obs.webContents.executeJavaScript(inspectCorner);
          return r?.visible==='visible' && r.width===width && r.height===height && r.layerX===0 && r.layerY===0 &&
            r.layerWidth===width && r.layerHeight===height && r.childWidth===width && r.childHeight===height &&
            Math.abs(r.x-expected.x)<1 && Math.abs(r.y-expected.y)<1 && Math.abs(r.size-expected.size)<1;
        }, `Esquina vertical ${width}x${height} ${corner}`);
        const image=await paint(),bitmap=image.toBitmap(),pixels=image.getSize();
        let minX=pixels.width,minY=pixels.height,maxX=-1,maxY=-1;
        for(let y=0;y<pixels.height;y++) for(let x=0;x<pixels.width;x++) if(bitmap[(y*pixels.width+x)*4+3]>0) {
          minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
        }
        const ratio=pixels.width/width,padding=8*ratio;
        assert.ok(maxX>=0,`La mascota debe estar pintada en ${corner}.`);
        assert.ok(minX>=(expected.x*ratio-padding) && minY>=(expected.y*ratio-padding) && maxX<=((expected.x+expected.size)*ratio+padding) && maxY<=((expected.y+expected.size)*ratio+padding),`Los píxeles deben estar en la esquina ${corner}.`);
        if(width===1080 && corner.endsWith('left')) fs.writeFileSync(path.join(smokeRoot,`obs-portrait-${corner}.png`),image.toPNG());
      }
    }
    checks.portraitObsFourCorners1080x1920 = true;
    checks.portraitObsFourCornersScaled = true;
    checks.portraitRenderedPixelsAtCorners = true;
  } finally {
    c.obs.setContentSize(...originalSize);
    await c.obs.webContents.removeInsertedCSS(css);
    await js(`window.aula.setSettings({paused:${before.settings.paused},corner:${JSON.stringify(before.settings.corner)},companionEnabled:${companionEnabled}},"voice")`);
  }
  return checks;
};
