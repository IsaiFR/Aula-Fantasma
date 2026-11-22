'use strict';
(() => {
  const SIZE = 450;
  const TAU = Math.PI * 2;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = (from, to, value) => {
    const t = clamp((value - from) / (to - from));
    return t * t * (3 - 2 * t);
  };
  const envelope = (p, enter, exit) => ease(0, enter, p) * (1 - ease(exit, 1, p));
  const mix = (from, to, t) => from + (to - from) * t;
  const sprite = (ctx, image) => ctx.drawImage(image, 0, 0, SIZE, SIZE);

  function path(data, ctx, fill, stroke, lineWidth = 1) {
    const shape = typeof data === 'string' ? new Path2D(data) : data;
    if (fill) { ctx.fillStyle = fill; ctx.fill(shape); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(shape); }
  }

  function oval(ctx, x, y, rx, ry, fill, stroke, width = 1) {
    const shape = new Path2D();
    shape.ellipse(x, y, rx, ry, 0, 0, TAU);
    path(shape, ctx, fill, stroke, width);
  }

  function tint(ctx, fill, amount) {
    ctx.save();
    ctx.globalAlpha = amount;
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.restore();
  }

  function clearCutout(ctx, cutout) {
    ctx.save();
    ctx.clip(cutout);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.restore();
  }

  const sensorFlaps = [
    { hinge: [376, 49], axis: -2.33, turn: .43, shape: new Path2D('M336 2H365L389 36L388 47L379 57L366 62L344 60V38L336 26Z') },
    { hinge: [406, 60], axis: -.70, turn: -.43, shape: new Path2D('M407 38L442 26L446 46L431 58L431 68L411 69L401 62Z') },
    { hinge: [407, 81], axis: .83, turn: .42, shape: new Path2D('M405 69L424 80L446 97V116H416L395 92L396 83Z') },
    { hinge: [375, 77], axis: 2.81, turn: -.40, shape: new Path2D('M364 63H379L385 78L380 90L368 95L348 103H342L337 94V83L350 71Z') }
  ];
  const pod = new Path2D('M263 278Q274 259 298 263Q317 267 322 293Q327 315 306 326Q283 340 254 319Q249 303 263 278Z');
  const infant = new Path2D('M266 277Q272 267 281 267Q291 258 303 267L315 268L318 282Q321 298 309 308Q308 324 283 326Q272 331 262 322Q254 317 257 304Q254 291 266 277Z');
  const helmet = new Path2D('M308 249H438V418H296L286 377L287 362L283 350L279 333L283 310L289 288L300 271Z');

  function scan(ctx, image, p, time) {
    const power = envelope(p, .15, .76);
    if (power === 0) { sprite(ctx, image); return; }
    const fold = ease(0, .14, p) * (1 - ease(.21, .36, p))
      + ease(.53, .67, p) * (1 - ease(.79, .98, p));
    sprite(ctx, image);
    if (fold > 0) {
      for (const flap of sensorFlaps) clearCutout(ctx, flap.shape);
      ctx.save(); ctx.globalAlpha = ease(0, .25, fold);
      path('M378 106L375 93L370 83L377 78M381 56L376 49M400 64L406 60M402 77L407 81', ctx, null, '#181b25', 6.5);
      path('M378 103L375 93L371 84L377 78', ctx, null, '#79726a', 2.2);
      ctx.restore();
      for (const { hinge: [x, y], axis, turn, shape } of sensorFlaps) {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(axis + turn * fold);
        ctx.scale(1 - fold * .64, 1 - fold * .26); ctx.rotate(-axis); ctx.translate(-x, -y);
        ctx.clip(shape); sprite(ctx, image);
        ctx.restore();
      }
    }
    ctx.save();
    ctx.clip(pod);
    tint(ctx, '#ffc35c', power * .24);
    ctx.globalAlpha = power;
    const liquid = ctx.createLinearGradient(268, 265, 314, 330);
    liquid.addColorStop(0, '#7b491b'); liquid.addColorStop(.55, '#b87c2b'); liquid.addColorStop(1, '#e1a459');
    ctx.fillStyle = liquid; ctx.fillRect(248, 265, 85, 66);
    ctx.translate(286, 305 + Math.cos(time * 5) * 6 * power); ctx.rotate(-.17 * Math.sin(time * 4)); ctx.translate(-286, -306);
    ctx.clip(infant); sprite(ctx, image);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = power * .8;
    const signal = power * (1 - fold * .87);
    oval(ctx, 392, 68, 6.5, 6.5, '#efffac', '#a7e986', 2);
    for (let i = 0; i < 3; i++) {
      const offset = (time * 1.8 + i / 3) % 1;
      const ring = new Path2D();
      ring.arc(392, 68, 15 + 34 * offset, -.88, .85);
      ctx.globalAlpha = signal * (1 - offset) * .8;
      path(ring, ctx, null, '#d2ff9d', 2.2);
    }
    ctx.restore();
  }

  const iceRoots = [[47,410,70,344],[88,420,117,330],[119,420,143,368],[288,420,314,355],[339,427,364,331],[373,429,409,361],[396,425,425,396]];
  function crystal(ctx, rootX, rootY, tipX, tipY, amount) {
    const x = mix(rootX, tipX, amount), y = mix(rootY, tipY, amount);
    const w = 14 * amount;
    const ridgeX = mix(rootX, x, .58), ridgeY = mix(rootY, y, .58);
    path(`M${rootX - w} ${rootY}L${x - w * .52} ${y + w}L${x} ${y}L${x + w * .48} ${y + w}L${rootX + w} ${rootY}Z`, ctx, '#57bce9', '#c8faff', 1.7);
    path(`M${x} ${y}L${ridgeX} ${ridgeY}L${rootX - w} ${rootY}L${x - w * .52} ${y + w}Z`, ctx, '#b8f5ff');
    path(`M${x} ${y}L${rootX + w} ${rootY}L${ridgeX} ${ridgeY}Z`, ctx, '#2b76bc');
  }

  function freeze(ctx, image, p, _time, mist) {
    const ice = envelope(p, .35, .73);
    sprite(ctx, image);
    if (mist) { ctx.save(); ctx.globalAlpha = 1 - ice; mist(); ctx.restore(); }
    const frost = ctx.createLinearGradient(91, 41, 332, 420);
    frost.addColorStop(0, '#efffff'); frost.addColorStop(.34, '#83dfff'); frost.addColorStop(.49, '#ecffff'); frost.addColorStop(1, '#197fc0');
    tint(ctx, frost, ice * .78);
    ctx.save();
    ctx.globalAlpha = ice * .82;
    ctx.globalCompositeOperation = 'source-atop';
    path('M124 162L162 174L191 151L231 164L259 122L300 122L334 87M191 151L195 115L174 89M230 164L247 200L281 206L310 243M144 260L180 268L196 304L228 323L244 356L277 376L306 370L326 407M196 304L174 338L157 344M280 206L296 177L335 166L365 134', ctx, null, '#e3fcff', 2);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = ice;
    for (const root of iceRoots) crystal(ctx, ...root, ice);
    ctx.restore();
  }

  function tongue(ctx, x, y, height, width, time) {
    const sway = Math.sin(time * 7 + x) * width * .58;
    const gradient = ctx.createLinearGradient(x, y - height, x, y);
    gradient.addColorStop(0, '#f85327'); gradient.addColorStop(.53, '#ff942d'); gradient.addColorStop(1, '#ffd06b');
    path(`M${x - width} ${y}Q${x - width * 1.5} ${y - height * .38} ${x + sway} ${y - height}Q${x + sway - width * .22} ${y - height * .58} ${x + width * .6} ${y - height * .45}Q${x + width * 1.35} ${y - height * .24} ${x + width} ${y}Q${x} ${y + 10} ${x - width} ${y}Z`, ctx, gradient);
    path(`M${x - width * .4} ${y - 3}Q${x - width * .64} ${y - height * .16} ${x + sway * .5} ${y - height * .52}Q${x + width * .65} ${y - height * .25} ${x + width * .48} ${y - 3}Q${x} ${y + 4} ${x - width * .4} ${y - 3}Z`, ctx, '#fff0aa');
  }

  function flame(ctx, image, p, time) {
    const heat = envelope(p, .26, .78);
    sprite(ctx, image);
    const color = ctx.createLinearGradient(0, 34, 0, 430);
    color.addColorStop(0, '#ed4a27'); color.addColorStop(.45, '#f99838'); color.addColorStop(.59, '#822331'); color.addColorStop(1, '#bd371d');
    tint(ctx, color, heat * .66);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.globalAlpha = heat * .94;
    const flares = [[62,398,222],[88,369,204],[118,278,149],[139,187,145],[178,137,105],[220,122,104],[272,133,115],[325,191,157],[350,287,176],[372,379,217],[400,411,140]];
    for (const [x, y, height] of flares) tongue(ctx, x, y, height * heat * (.8 + .19 * Math.sin(time * 5 + x)), 19 + x % 7, time);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = heat * .9;
    for (let i = 0; i < 23; i++) {
      const rise = (time * (.6 + i % 5 * .08) + i * .127) % 1;
      const x = 45 + (i * 137 % 365) + Math.sin(time * 4 + i) * 12;
      const y = 426 - rise * (140 + i * 29 % 245);
      oval(ctx, x, y, 1.5 + (1 - rise) * 2.4, 2.7 + rise * 3, i % 2 ? '#ff7a36' : '#ffe79b');
    }
    ctx.restore();
  }

  function melt(ctx, image, p, time) {
    const water = envelope(p, .49, .72);
    ctx.save(); ctx.globalAlpha = Math.min(1, water * 1.4);
    ctx.translate(233, 422); ctx.scale(.48 + water * .52, .5 + water * .5);
    path('M-146 7C-155-5-127-10-109-12C-97-26-52-20-27-25C6-29 37-18 57-19C84-24 101-16 111-9C137-7 155 3 145 12C137 24 103 15 83 19C43 25 31 19 13 21C-23 26-42 15-59 18C-92 25-125 22-128 16C-135 14-143 11-146 7Z', ctx, '#96d5ed', '#367da7', 2.6);
    oval(ctx, 2, -1, 114, 14, '#c6effc');
    oval(ctx, -36, -2, 67 + Math.sin(time * 6) * 8, 8.5, null, '#effdff', 2.6);
    path('M53 7Q80 13 111 6M-121 6Q-109 12-89 9', ctx, null, '#e8fbff', 2);
    ctx.restore();
    if (water >= 1) return;
    ctx.save();
    ctx.globalAlpha = 1 - ease(.8, 1, water);
    ctx.translate(233, 440 - 11 * water); ctx.scale(1 + .06 * water, 1 - water); ctx.translate(-233, -440);
    sprite(ctx, image);
    ctx.restore();
  }

  function putOnHelmet(ctx, image, p) {
    const amount = ease(.04, .33, p) * (1 - ease(.69, .96, p));
    if (amount === 0) { sprite(ctx, image); return; }
    sprite(ctx, image);
    clearCutout(ctx, helmet);
    ctx.save();
    ctx.translate(mix(351, 246, amount), mix(338, 117, amount) - Math.sin(amount * Math.PI) * 62);
    ctx.rotate(-Math.sin(amount * Math.PI) * .27);
    ctx.scale(1 + amount * .32, 1 + amount * .20);
    ctx.translate(-351, -338);
    ctx.clip(helmet); sprite(ctx, image);
    ctx.restore();
    if (amount > .96) {
      ctx.save(); ctx.globalAlpha = .72 * (1 - ease(.34, .43, p));
      path('M316 88L320 98L331 103L320 107L317 117L313 107L303 103L313 99Z', ctx, '#fff6bb');
      ctx.restore();
    }
  }

  function agent(ctx, image, p, time) {
    const light = envelope(p, .14, .76);
    const entry = ease(.07, .42, p);
    const staging = light * (1 - entry);
    const reveal = ease(.35, .54, p);
    ctx.save(); ctx.globalAlpha = light;
    const beamX = mix(73, 227, entry);
    const beam = ctx.createRadialGradient(beamX, 279, 14, beamX, 274, 173);
    beam.addColorStop(0, '#fff2b6b3'); beam.addColorStop(.56, '#d2a04d54'); beam.addColorStop(1, '#ba853400');
    oval(ctx, beamX, 246, 160, 179, beam);
    path(`M${beamX - 55} 36L${beamX - 142} 381H${beamX + 142}L${beamX + 55} 36Z`, ctx, '#d4b36a28');
    path(`M${beamX - 138} 330V370H${beamX - 101}M${beamX + 138} 330V370H${beamX + 101}M${beamX - 138} 100V63H${beamX - 101}M${beamX + 138} 100V63H${beamX + 101}`, ctx, null, '#edd69b', 2);
    ctx.restore();
    const turn = 1 - .27 * Math.sin(reveal * Math.PI);
    const theatricalScale = mix(1, .84, light);
    ctx.save();
    ctx.translate(225 - 142 * staging, 450 - light * 60 - Math.abs(Math.sin(time * 13)) * staging * 14);
    ctx.scale(theatricalScale * turn, theatricalScale); ctx.translate(-225, -450);
    sprite(ctx, image);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = light * reveal;
    path('M100 420H148M302 420H350', ctx, null, '#e4bd71', 2);
    ctx.font = 'italic 800 32px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff0bd';
    ctx.strokeStyle = '#1e1724'; ctx.lineWidth = 3;
    ctx.strokeText('EDU007', 225, 431); ctx.fillText('EDU007', 225, 431);
    ctx.restore();
  }

  const actions = { scan, freeze, flame, melt, helmet: putOnHelmet, agent };
  window.renderAulaVoiceCycle = (ctx, image, cycle, width, height, mist) => {
    ctx.save();
    ctx.scale(width / SIZE, height / SIZE);
    actions[cycle.action](ctx, image, cycle.progress, cycle.time, mist && (() => {
      ctx.save(); ctx.scale(SIZE / width, SIZE / height); mist(); ctx.restore();
    }));
    ctx.restore();
  };
})();
