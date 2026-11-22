'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { nativeImage } = require('electron');

const canvas = "document.getElementById('voice-layer').contentDocument?.getElementById('pet-voice')";
function windRegions(expressions, moving, still, size) {
  const scale = box => box.map(value => value * 1254 / size);
  const boxes = entries => Object.fromEntries(Object.entries(entries).map(([key, box]) => [key, scale(box)]));
  return { expressions: expressions.map(scale), moving: boxes(moving), still: boxes(still) };
}
const capeRegions = (expressions, moving, still) => windRegions(expressions, moving, still, 450);
const hairRegions = (expressions, moving, still) => windRegions(expressions, moving, still, 420);
const WIND_REGIONS = {
  EduAlloy: hairRegions([[186,112,319,146],[250,144,286,175]],
    { crown: [188,5,282,76], leftLock: [96,157,129,231], rightLock: [310,196,346,246] }, { face: [174,107,321,183], implant: [137,104,169,147], beads: [138,185,159,218], body: [161,258,313,407] }),
  EduCage: hairRegions([[175,112,338,151],[250,150,286,180]],
    { crest: [131,10,319,98], temple: [102,111,137,172] }, { face: [154,111,343,194], leftEar: [119,29,145,59], rightEar: [321,21,343,70], body: [145,216,351,412] }),
  EduConquest: hairRegions([[168,116,322,149],[237,153,287,188]],
    { spikes: [159,16,305,77], leftLock: [100,86,164,141] }, { face: [156,112,347,206], scar: [276,113,336,183], body: [140,212,346,409] }),
  EduDeep: hairRegions([[184,98,308,132],[248,122,286,150]],
    { fringe: [181,16,297,78] }, { face: [169,93,321,169], leftEar: [151,40,162,69], chest: [148,198,313,295] }),
  EduEve: hairRegions([[175,112,304,145],[231,139,273,171]],
    { crown: [152,41,321,107], leftLock: [99,159,174,261], rightLock: [301,172,349,248] }, { face: [173,119,319,170], pendant: [236,198,281,239], body: [194,257,283,377] }),
  EduJames: hairRegions([[199,128,310,157],[242,155,287,189]],
    { fringe: [146,31,338,108], leftLock: [99,117,138,184] }, { face: [153,131,332,203], leftEar: [132,19,160,48], jacket: [144,225,308,401], map: [295,352,383,411] }),
  EduLeon: hairRegions([[213,124,324,154],[247,148,287,176]],
    { fringe: [136,29,343,110], leftLock: [108,128,148,177] }, { face: [169,143,333,192], jacket: [137,193,317,401], equipment: [215,280,342,362] }),
  EduMark: hairRegions([[191,120,343,154],[250,145,291,177]],
    { crown: [168,16,349,102], leftLock: [105,92,167,129] }, { face: [174,118,350,194], leftEar: [124,23,155,61], rightEar: [329,26,344,56], suit: [121,223,330,404] }),
  EduSoldier: hairRegions([[172,99,307,136],[231,132,276,171]],
    { fringe: [121,38,335,92], temple: [110,100,143,137] }, { face: [155,102,315,195], cigar: [267,141,314,176], smoke: [318,103,370,164], shield: [248,242,360,396] }),
  EduBot: capeRegions([[208,134,341,167],[278,170,319,202]],
    { cape: [33,322,116,387] }, { head: [159,92,358,229], suit: [167,300,318,428], tail: [56,170,123,293] }),
  EduDracula: capeRegions([[217,101,329,165]],
    { leftCape: [70,342,152,415], rightCape: [344,323,407,401] }, { head: [171,54,361,220], suit: [222,245,313,404], tail: [69,181,111,322] }),
  EduLuchador: capeRegions([[203,106,332,178]],
    { leftCape: [52,329,123,381], rightCape: [342,318,415,419] }, { head: [145,60,350,202], suit: [170,252,298,422], tail: [44,170,110,259] }),
  EduMoon: capeRegions([[221,109,356,181]],
    { leftCape: [40,367,140,419], rightCape: [348,341,424,407] }, { hood: [158,49,386,230], suit: [195,245,320,408], tail: [62,180,122,313] }),
  EduStarlight: capeRegions([[197,104,326,169]],
    { leftCape: [41,350,127,431], rightCape: [321,352,382,436] }, { head: [108,28,385,240], suit: [178,269,302,422], tail: [48,165,113,288] }),
  EduStrange: capeRegions([[216,104,330,172]],
    { leftCape: [40,319,128,400], rightCape: [347,349,426,408] }, { head: [169,37,351,187], suit: [205,239,307,378], magic: [350,170,430,335], tail: [53,158,101,264] }),
  EduWitch: capeRegions([[216,155,324,212]],
    { cape: [55,342,137,417] }, { head: [95,15,379,230], body: [186,295,274,415], cauldron: [290,307,408,417], tail: [62,205,118,302] }),
  EduHellDiver: {
    expressions: [[589, 336, 960, 420], [794, 515, 865, 618]],
    moving: { cape: [30, 817, 316, 1188] },
    still: { face: [384, 285, 1076, 631], chest: [480, 660, 950, 884], shoulder: [447, 705, 615, 853], bag: [337, 936, 506, 1062], paws: [425, 1123, 935, 1238], tail: [143, 436, 368, 677] }
  },
  EduHomelander: {
    expressions: [[564, 288, 940, 464]],
    moving: { fringe: [600, 60, 850, 205], leftCape: [35, 850, 375, 1150], rightCape: [929, 810, 1220, 1130] },
    still: { face: [460, 240, 1015, 535], chest: [490, 565, 850, 910], paws: [400, 1100, 867, 1190], tail: [160, 410, 339, 765], leftEar: [460, 75, 580, 175], rightEar: [857, 70, 980, 165] }
  },
  EduNolan: {
    expressions: [[561, 353, 1015, 462], [742, 520, 903, 601]],
    moving: { fringe: [510, 45, 891, 245], leftCape: [22, 788, 378, 1200], rightCape: [921, 717, 994, 856] },
    still: { face: [500, 286, 1030, 610], chest: [475, 730, 870, 1005], paws: [340, 1145, 954, 1242], tail: [80, 455, 310, 705], leftEar: [365, 38, 486, 188], rightEar: [901, 35, 1035, 180] }
  }
};

function compareWind({ before, after, width }, regions) {
  const scale = (width - 1) / 1254;
  return Object.fromEntries(Object.entries(regions).map(([name, [left, top, right, bottom]]) => {
    let changes = 0;
    for (let y = Math.ceil(top * scale); y < bottom * scale; y++) {
      for (let x = Math.ceil(left * scale); x < right * scale; x++) {
        const pixel = (y * width + x) * 4;
        if (before.readUInt32LE(pixel) !== after.readUInt32LE(pixel)) changes++;
      }
    }
    return [name, changes];
  }));
}

async function capture(view) {
  const url = await view.webContents.executeJavaScript(`${canvas}.toDataURL()`);
  const png = Buffer.from(url.split(',')[1], 'base64');
  const decoded = nativeImage.createFromBuffer(png);
  return { png, pixels: decoded.toBitmap(), width: decoded.getSize().width };
}

async function assertWindExpression(view, name, pose, url, mirrored = false) {
  const differences = await view.webContents.executeJavaScript(`(async () => {
    const rendered = ${canvas}, doc = rendered.ownerDocument;
    const image = new doc.defaultView.Image(); image.src = ${JSON.stringify(url)}; await image.decode();
    const source = doc.createElement('canvas');
    source.width = image.naturalWidth; source.height = image.naturalHeight;
    source.getContext('2d').drawImage(image, 0, 0);
    const base = doc.createElement('canvas'), n = rendered.width;
    base.width = base.height = n;
    const context = base.getContext('2d', { willReadFrequently: true }); context.drawImage(source, 0, 0, n, n);
    const texture = doc.createElement('canvas'); texture.width = texture.height = n;
    texture.getContext('2d', { willReadFrequently: true }).putImageData(context.getImageData(0, 0, n, n), 0, 0);
    const comparison = doc.createElement('canvas'); comparison.width = comparison.height = n;
    const reference = comparison.getContext('2d');
    if (${mirrored}) { reference.translate(n, 0); reference.scale(-1, 1); }
    reference.drawImage(texture, 0, 0);
    return ${JSON.stringify(WIND_REGIONS[name].expressions)}.map(([left, top, right, bottom]) => {
      const box = [${mirrored} ? 1254 - right : left, top, right - left, bottom - top].map(value => Math.max(1, Math.floor(n * value / 1254)));
      const expected = reference.getImageData(...box).data, actual = rendered.getContext('2d').getImageData(...box).data;
      return actual.reduce((maximum, value, index) => Math.max(maximum, Math.abs(value - expected[index])), 0);
    });
  })()`);
  assert.ok(differences.every(difference => difference <= 2), `Rostro de ${name} ${pose}: diferencias máximas ${differences.join(', ')}`);
}

module.exports = async function ({ panel, obs, views, wait, motion, notify, voiceGate, microphoneWindow, getFrame, snapshot, root, smokeRoot, parsePet }, name) {
  const slug = name.toLowerCase();
  const js = code => panel.webContents.executeJavaScript(code);
  const audio = code => microphoneWindow.webContents.executeJavaScript(code);
  const settings = patch => js(`window.aula.setSettings(${JSON.stringify(patch)}, 'voice')`);
  const pet = parsePet(fs.readFileSync(path.join(root, 'pets', `${name}-Voz.pet`)));
  const library = await js('window.aula.getPetLibrary()');
  const choice = library.pets.find(entry => entry.name === pet.name);
  assert.equal(choice?.kind, 'voice');
  const selection = await js(`window.aula.selectPet(${JSON.stringify(choice.id)})`);
  assert.ok(!selection.error);
  await settings({ micEnabled: true, micDeviceId: 'default', micRelease: 0, paused: true, corner: 'bottom-left' });
  if (pet.effects?.draculaBat) await settings({ draculaBatEnabled: false });
  await wait(() => snapshot().microphone.status === 'active' && voiceGate.sampleTime > 0, `Audio de ${name}`);
  await audio('window.dispatchEvent(new Event("pagehide")); window.poseSmokeLevel = 0; window.poseSmokeTimer = setInterval(() => window.microphone.level(window.poseSmokeLevel), 30); void 0');

  const wind = WIND_REGIONS[name];
  assert.equal(Boolean(pet.animation.cloth.motionRegions), Boolean(wind));
  const inspect = `(() => { const canvas = ${canvas}; return canvas ? { ...canvas.dataset } : {}; })()`;
  const waitForPose = pose => wait(async () => {
    const frames = await Promise.all(views.map(view => view.webContents.executeJavaScript(inspect)));
    return frames.every(frame => frame.pose === pose && frame.asset === getFrame().voice.urls.open && frame.mirrored === 'false' && (!wind || frame.cloth === 'true'));
  }, `${name} ${pose}`);

  for (const [pose, speaking, blinking] of [['open', false, false], ['talking', true, false], ['talkingClosed', true, true], ['closed', false, true]]) {
    await audio(`window.poseSmokeLevel = ${speaking ? .4 : 0}; void 0`);
    motion.blinkRemaining = blinking ? .1 : 0;
    notify();
    await waitForPose(pose);
    const frame = await capture(obs);
    if (wind) {
      await assertWindExpression(obs, name, pose, getFrame().voice.urls[pose]);
    } else {
      const expected = nativeImage.createFromBuffer(pet.images[pose].bytes).toBitmap();
      assert.ok(frame.pixels.equals(expected), `Píxeles de ${name} ${pose}`);
    }
    fs.writeFileSync(path.join(smokeRoot, `${slug}-${pose}.png`), frame.png);
  }

  motion.blinkRemaining = 0;
  motion.blinkIn = .02;
  await settings({ paused: false });
  await wait(() => getFrame().voice.blinking, `Parpadeo automático de ${name}`);
  await settings({ paused: true });
  await audio('window.poseSmokeLevel = .4; void 0');
  await wait(() => getFrame().voice.speaking, `${name} hablando`);
  await settings({ micEnabled: false });
  await wait(() => !getFrame().voice.speaking && snapshot().microphone.status === 'off', `${name} en reposo`);
  await audio('clearInterval(window.poseSmokeTimer); void 0');
  const windChecks = {};
  if (wind) {
    motion.blinkRemaining = 0;
    motion.blinkIn = 10;
    notify();
    await waitForPose('open');
    const before = await Promise.all(views.map(capture));
    const phase = getFrame().elapsed;
    await settings({ paused: false });
    await wait(() => getFrame().elapsed > phase + .8, `Viento de ${name} en silencio`);
    await settings({ paused: true });
    await wait(async () => (await Promise.all(views.map(view => view.webContents.executeJavaScript(inspect))))
      .every(frame => frame.phase === String(getFrame().elapsed) && frame.pose === 'open'), `Fase común de ${name}`);
    const after = await Promise.all(views.map(capture));
    for (const [index, frame] of after.entries()) {
      assert.equal(before[index].width, frame.width);
      const images = { before: before[index].pixels, after: frame.pixels, width: frame.width };
      const moving = compareWind(images, wind.moving), still = compareWind(images, wind.still);
      const minimumChanges = Math.max(3, Math.floor(frame.width ** 2 / 800));
      assert.ok(Object.values(moving).every(changes => changes >= minimumChanges), JSON.stringify(moving));
      assert.ok(Object.values(still).every(changes => changes === 0), JSON.stringify(still));
      assert.equal(frame.pixels[3] + frame.pixels.at(-1), 0);
    }
    fs.writeFileSync(path.join(smokeRoot, `${slug}-wind-start.png`), before[views.indexOf(obs)].png);
    fs.writeFileSync(path.join(smokeRoot, `${slug}-wind-next.png`), after[views.indexOf(obs)].png);
    windChecks[`${slug}ContinuousLocalizedWind`] = true;
  }
  return {
    [`${slug}InVoiceCatalog`]: true,
    [`${slug}CapturesAudio`]: true,
    [`${slug}FourPosesSynchronized`]: true,
    [`${slug}AutomaticBlink`]: true,
    [`${slug}OffReturnsToRest`]: true,
    ...windChecks
  };
};
module.exports.assertWindExpression = assertWindExpression;
