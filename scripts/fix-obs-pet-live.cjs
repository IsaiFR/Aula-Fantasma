'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
(async () => {
  const obs = await require('./obs-client.cjs')();
  try {
    const original = await obs.call('GetInputSettings', { inputName: 'EduGhost' });
    if (original.inputKind !== 'browser_source' || !/^http:\/\/127\.0\.0\.1:\d+\/overlay(?:\?|$)/.test(original.inputSettings.url || '')) throw new Error('La fuente EduGhost no es la esperada.');
    const { canvases } = await obs.call('GetCanvasList');
    const vertical = canvases.find(c => c.canvasVideoSettings.baseWidth === 1080 && c.canvasVideoSettings.baseHeight === 1920);
    if (!vertical) throw new Error('Falta el lienzo vertical 1080x1920.');
    const canvasUuid = vertical.canvasUuid, { scenes } = await obs.call('GetSceneList', { canvasUuid });
    const targets = [];
    for (const scene of scenes) {
      const list = await obs.call('GetSceneItemList', { canvasUuid, sceneName: scene.sceneName });
      for (const item of list.sceneItems.filter(i => i.sourceName === 'EduGhost')) targets.push({ sceneName: scene.sceneName, item });
    }
    const { inputs } = await obs.call('GetInputList', { inputKind: 'browser_source' });
    const existing = inputs.find(i => i.inputName === 'EduGhost Vertical');
    if (existing) {
      const settings = await obs.call('GetInputSettings', { inputUuid: existing.inputUuid });
      if (settings.inputSettings.url !== original.inputSettings.url) throw new Error('EduGhost Vertical ya apunta a otra dirección.');
    }
    const plan = { horizontal: 'EduGhost: 1920x1080', vertical: 'EduGhost Vertical: 1080x1920', scenes: targets.map(t => t.sceneName) };
    if (!process.argv.includes('--apply')) { console.log(JSON.stringify({ applied: false, ...plan }, null, 2)); return; }
    if (!targets.length) throw new Error('No hay elementos originales pendientes de reparación en vertical.');
    let verticalUuid = existing?.inputUuid;
    for (const { sceneName, item } of targets) {
      let sceneItemId;
      if (!verticalUuid) {
        const created = await obs.call('CreateInput', { canvasUuid, sceneName, inputName: 'EduGhost Vertical', inputKind: 'browser_source', inputSettings: { ...original.inputSettings, width: 1080, height: 1920 }, sceneItemEnabled: false });
        verticalUuid = created.inputUuid; sceneItemId = created.sceneItemId;
      } else {
        await obs.call('SetInputSettings', { inputUuid: verticalUuid, inputSettings: { width: 1080, height: 1920 }, overlay: true });
        const list = await obs.call('GetSceneItemList', { canvasUuid, sceneName });
        const prepared = list.sceneItems.find(i => i.sourceUuid === verticalUuid);
        if (prepared) sceneItemId = prepared.sceneItemId;
        else ({ sceneItemId } = await obs.call('CreateSceneItem', { canvasUuid, sceneName, sourceUuid: verticalUuid, sceneItemEnabled: false }));
      }
      const target = { canvasUuid, sceneName, sceneItemId };
      await obs.call('SetSceneItemTransform', { ...target, sceneItemTransform: { positionX: 0, positionY: 0, rotation: 0, scaleX: 1, scaleY: 1, alignment: 5, boundsType: 'OBS_BOUNDS_SCALE_INNER', boundsAlignment: 0, boundsWidth: 1080, boundsHeight: 1920, cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0, cropToBounds: false } });
      await obs.call('SetSceneItemBlendMode', { ...target, sceneItemBlendMode: item.sceneItemBlendMode });
      await obs.call('SetSceneItemIndex', { ...target, sceneItemIndex: item.sceneItemIndex });
      let actual;
      const until=Date.now()+10000;
      do {
        ({sceneItemTransform:actual}=await obs.call('GetSceneItemTransform',target));
        if(actual.sourceWidth===1080 && actual.sourceHeight===1920) break;
        await new Promise(r=>setTimeout(r,100));
      } while(Date.now()<until);
      assert.equal(actual.sourceWidth, 1080); assert.equal(actual.sourceHeight, 1920);
      assert.equal(actual.boundsWidth, 1080); assert.equal(actual.boundsHeight, 1920);
      assert.equal(actual.positionX, 0); assert.equal(actual.positionY, 0);
      await obs.call('SetSceneItemEnabled', { ...target, sceneItemEnabled: item.sceneItemEnabled });
      await obs.call('SetSceneItemLocked', { ...target, sceneItemLocked: item.sceneItemLocked });
      await obs.call('RemoveSceneItem', { canvasUuid, sceneName, sceneItemId: item.sceneItemId });
      const updated = await obs.call('GetSceneItemList', { canvasUuid, sceneName });
      assert.equal(updated.sceneItems.filter(i => i.sourceName === 'EduGhost Vertical').length, 1);
      assert.equal(updated.sceneItems.some(i => i.sourceName === 'EduGhost'), false);
    }
    await obs.call('SetInputSettings', { inputName: 'EduGhost', inputSettings: { width: 1920, height: 1080 }, overlay: true });
    const horizontal = await obs.call('GetInputSettings', { inputName: 'EduGhost' });
    assert.equal(horizontal.inputSettings.width, 1920); assert.equal(horizontal.inputSettings.height, 1080);
    const report = { applied: true, ...plan };
    fs.writeFileSync(path.join(__dirname, '..', '.smoke-data', 'obs-pet-repair.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { obs.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
