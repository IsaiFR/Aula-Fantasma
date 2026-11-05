'use strict';
// Solo sustituye el paquete incluido exacto; conserva personajes personalizados.
const UPDATES = new Map([
  ['bf50d60fd6d5beeb0e00350a7a369a8b04ff5f187ffefd25527831f0c0bb91bc', 'EduZombie.aulapet'],
  ['293983cf3fccd0c570afc47d51a08f28bb034708532f5df01f04adc2632f761f', 'EduDracula-Voz.pet'],
  ['dc0c953fd5c22bd51873720c6468474983ac6dd99f5ca64e5fa6ce71227c9914', 'EduDracula-Voz.pet'],
  ['b973e7dec5c75377b1895613f9be1916699ef231b809dcd3d5b172d370d08c39', 'EduGhost-Voz.pet'],
  ['2e96b22ab2ca3449974b0560ae41efe1beee205ea5a685aeb444c2406aa35f6f', 'EduGhost-Voz.pet'],
  ['12ee229e28b77a7ef6390225047929dbeae5b2274f4bb48df42e3987f9145d45', 'EduScream.aulapet'],
  ['ea383756e20d30a7f570dabb4b484c8068c2e52d257089318682f4b64cf2c847', 'EduScream.aulapet'],
  ['95badc944b15e327f9477851dda35f2774439bb600c9a51a03e67ee951893c31', 'EduFrankenstein.aulapet'],
  ['6d9f5b9d42c9f242396ee6be82b35444e37906294591da6640d9dbe427cb4514', 'EduFrankenstein.aulapet'],
  ['57119ed015f0906fcafda28674af58bb8f2e076fe35ca7669a1e71d31d54c4f3', 'EduPiramyd.aulapet'],
  ['25cd8d4e39c9e8cdd1ff329010a79e95746db1b2028e751712d0b472fc0f8ee3', 'EduPiramyd.aulapet']
]);
function bundledUpdate(id) { return UPDATES.get(id) || null; }
module.exports = { bundledUpdate };
