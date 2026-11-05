'use strict';
const fs = require('node:fs'), path = require('node:path');
(async () => {
  const obs = await require('./obs-client.cjs')();
  try {
    const input = await obs.call('GetInputSettings', { inputName: 'EduGhost' });
    const defaults = await obs.call('GetInputDefaultSettings', { inputKind: input.inputKind });
    const { canvases } = await obs.call('GetCanvasList');
    const scenes = [];
    for (const sceneName of ['Apuntes EduCat', 'Apuntes EduCat Vertical']) {
      const canvas = canvases.find(c => c.canvasVideoSettings.baseHeight === (sceneName.endsWith('Vertical') ? 1920 : 1080));
      if (!canvas) throw new Error('Falta el lienzo esperado de OBS.');
      const canvasUuid = canvas.canvasUuid;
      const list = await obs.call('GetSceneItemList', { sceneName, canvasUuid });
      const items = [];
      for (const item of list.sceneItems.filter(i => /^EduGhost/.test(i.sourceName))) {
        items.push({ ...item, ...(await obs.call('GetSceneItemTransform', { sceneName, canvasUuid, sceneItemId: item.sceneItemId })) });
      }
      scenes.push({ sceneName, canvasUuid, itemCount: list.sceneItems.length, items });
      if (process.argv.includes('--screenshot') && sceneName.endsWith('Vertical')) {
        const {imageData}=await obs.call('GetSourceScreenshot',{canvasUuid,sourceName:sceneName,imageFormat:'png',imageWidth:540,imageHeight:960});
        fs.writeFileSync(path.join(__dirname,'..','.smoke-data','obs-portrait-scene.png'),Buffer.from(imageData.split(',')[1],'base64'));
      }
    }
    const settings = { ...defaults.defaultInputSettings, ...input.inputSettings };
    const report = { width: settings.width, height: settings.height, scenes };
    fs.mkdirSync(path.join(__dirname, '..', '.smoke-data'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '..', '.smoke-data', 'obs-pet-inspection.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { obs.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
