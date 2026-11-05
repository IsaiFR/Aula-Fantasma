'use strict';
// Valida el contenedor sin decodificar GIF con nativeImage (solo admite estáticos).
function gifInfo(bytes) {
  const fail = () => { throw new Error('GIF no válido o incompleto.'); };
  if (bytes.length < 14 || !['GIF87a', 'GIF89a'].includes(bytes.subarray(0,6).toString())) fail();
  const width=bytes.readUInt16LE(6),height=bytes.readUInt16LE(8);
  if(!width||!height)fail();
  let at=13,frames=0,duration=0,delay=0,ended=false;
  const skip = length => { at+=length;if(at>bytes.length)fail(); };
  const blocks = () => { let length,total=0;do {if(at>=bytes.length)fail();length=bytes[at++];skip(length);total+=length;}while(length);return total; };
  if(bytes[10]&128)skip(3*(1<<((bytes[10]&7)+1)));
  while(at<bytes.length) {
    const type=bytes[at++];
    if(type===59){ended=true;break;}
    if(type===33) {
      if(at>=bytes.length)fail();const label=bytes[at++];
      if(label===249) {
        if(at+6>bytes.length||bytes[at]!==4||bytes[at+5]!==0)fail();
        delay=bytes.readUInt16LE(at+2);skip(6);
      } else blocks();
    } else if(type===44) {
      if(at+9>bytes.length)fail();
      const x=bytes.readUInt16LE(at),y=bytes.readUInt16LE(at+2),w=bytes.readUInt16LE(at+4),h=bytes.readUInt16LE(at+6),packed=bytes[at+8];
      if(!w||!h||x+w>width||y+h>height)fail();skip(9);
      if(packed&128)skip(3*(1<<((packed&7)+1)));
      if(at>=bytes.length||bytes[at]<2||bytes[at]>8)fail();skip(1);
      if(!blocks()||++frames>1024)fail();duration+=delay;delay=0;
    } else fail();
  }
  if(!ended||!frames||at!==bytes.length)fail();
  return {width,height,frames,duration:duration/100};
}
module.exports={gifInfo};
