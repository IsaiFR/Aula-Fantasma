'use strict';
// Perfiles declarativos v2/v3. Ningún personaje incluye código o rutas externas.
const DEFAULT_BEHAVIOR = { walk: { enabled: false, frequency: 7.5, stepHeight: .025, stepWidth: .012, footAngle: 9, bob: 2.3, lean: 1.1 }, greeting: { text: 'BOO!!', raiseSeconds: 0, holdSeconds: 3.2, lowerSeconds: 0 }, rig: null };
function object(input, keys, label) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !keys.includes(key))) throw new Error(`${label}: campos no válidos.`);
}
function number(value, min, max, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${label}: valor fuera de rango.`);
}
function rectangle(value, label, source) {
  object(value, ['x', 'y', 'width', 'height'], label);
  for (const key of ['x', 'y']) number(value[key], 0, 1, label);
  for (const key of ['width', 'height']) number(value[key], .001, 1, label);
  if (value.x + value.width > 1.000001 || value.y + value.height > 1.000001) throw new Error(`${label}: el rectángulo sale del lienzo ${source ? 'de origen' : 'de destino'}.`);
  return { ...value };
}
function behaviorProfile(input = DEFAULT_BEHAVIOR) {
  object(input, ['walk', 'greeting', 'rig', 'flipbook', 'cycle', 'vehicle'], 'Comportamiento');
  const walk = { ...DEFAULT_BEHAVIOR.walk, ...input.walk }, greeting = { ...DEFAULT_BEHAVIOR.greeting, ...input.greeting };
  if (input.walk !== undefined) object(input.walk, Object.keys(DEFAULT_BEHAVIOR.walk), 'Pasos');
  if (input.greeting !== undefined) object(input.greeting, Object.keys(DEFAULT_BEHAVIOR.greeting), 'Saludo');
  if (typeof walk.enabled !== 'boolean') throw new Error('Pasos: enabled debe ser booleano.');
  number(walk.frequency, .5, 20, 'Frecuencia de pasos');
  for (const key of ['stepHeight', 'stepWidth']) number(walk[key], 0, .08, key);
  number(walk.footAngle, 0, 25, 'Ángulo de patas'); number(walk.bob, 0, 10, 'Balanceo'); number(walk.lean, 0, 8, 'Inclinación');
  if (typeof greeting.text !== 'string' || !greeting.text.trim() || greeting.text.length > 40 || /[\x00-\x1f]/.test(greeting.text)) throw new Error('El saludo debe contener de 1 a 40 caracteres.');
  number(greeting.raiseSeconds, 0, 2, 'Tiempo de subida'); number(greeting.holdSeconds, .3, 8, 'Tiempo de saludo'); number(greeting.lowerSeconds, 0, 2, 'Tiempo de bajada');
  let rig = null;
  if (input.rig !== undefined && input.rig !== null) {
    object(input.rig, ['layers', 'mirror'], 'Capas');
    if (typeof input.rig.mirror !== 'boolean' || !Array.isArray(input.rig.layers) || ![4, 5].includes(input.rig.layers.length)) throw new Error('El personaje necesita cuatro o cinco capas y mirror booleano.');
    const roles = new Set();
    const layers = input.rig.layers.map(layer => {
      object(layer, ['role', 'crop', 'placement', 'pivot', 'restAngle', 'raisedAngle'], 'Capa');
      if (!['body', 'leftFoot', 'rightFoot', 'arm', 'freeFoot'].includes(layer.role) || roles.has(layer.role)) throw new Error('Las capas deben tener funciones distintas y válidas.');
      roles.add(layer.role);
      const crop = rectangle(layer.crop, 'Recorte', true), placement = rectangle(layer.placement, 'Posición', false);
      object(layer.pivot, ['x', 'y'], 'Pivote'); number(layer.pivot.x, 0, 1, 'Pivote x'); number(layer.pivot.y, 0, 1, 'Pivote y');
      number(layer.restAngle, -150, 150, 'Ángulo en reposo'); number(layer.raisedAngle, -150, 150, 'Ángulo levantado');
      return { role: layer.role, crop, placement, pivot: { ...layer.pivot }, restAngle: layer.restAngle, raisedAngle: layer.raisedAngle };
    });
    if (['body', 'leftFoot', 'rightFoot', 'arm'].some(role => !roles.has(role))) throw new Error('Faltan capas obligatorias del personaje.');
    rig = { mirror: input.rig.mirror, layers };
  }
  let flipbook;
  if (input.flipbook !== undefined) {
    object(input.flipbook, ['mirror', 'size', 'columns', 'rows', 'walkFrames', 'raiseFrames'], 'GIF');
    if (typeof input.flipbook.mirror !== 'boolean') throw new Error('GIF: mirror debe ser booleano.');
    for (const [key, min, max] of [['size',32,512],['columns',1,8],['rows',1,8],['walkFrames',2,32],['raiseFrames',2,32]]) {
      number(input.flipbook[key], min, max, `GIF.${key}`);
      if (!Number.isInteger(input.flipbook[key])) throw new Error('GIF: los fotogramas y tamaños deben ser enteros.');
    }
    if (input.flipbook.walkFrames + input.flipbook.raiseFrames > input.flipbook.columns * input.flipbook.rows) throw new Error('GIF: faltan fotogramas en la hoja.');
    if (rig) throw new Error('GIF: usa fotogramas completos sin capas articuladas.');
    flipbook = { ...input.flipbook };
  }
  let cycle;
  if (input.cycle !== undefined) {
    object(input.cycle, ['size', 'columns', 'rows', 'mirror', 'sequence', 'reverseAfterRest'], 'Ciclo');
    if (rig || flipbook || walk.enabled) throw new Error('Ciclo: no puede combinarse con capas, pasos o saludo GIF.');
    if (typeof input.cycle.mirror !== 'boolean') throw new Error('Ciclo: mirror debe ser booleano.');
    if (input.cycle.reverseAfterRest !== undefined && typeof input.cycle.reverseAfterRest !== 'boolean') throw new Error('Ciclo: reverseAfterRest debe ser booleano.');
    for (const [key, min, max] of [['size',32,512],['columns',1,8],['rows',1,8]]) {
      number(input.cycle[key], min, max, `Ciclo.${key}`);
      if (!Number.isInteger(input.cycle[key])) throw new Error('Ciclo: tamaños enteros.');
    }
    const sequence = input.cycle.sequence;
    if (!Array.isArray(sequence) || sequence.length < 2 || sequence.length > 128) throw new Error('Ciclo: se admiten de 2 a 128 fotogramas.');
    const entries = sequence.map(entry => {
      object(entry, ['frame', 'seconds', 'stage', 'text'], 'Fotograma');
      number(entry.frame, 0, input.cycle.columns * input.cycle.rows - 1, 'Fotograma');
      if (!Number.isInteger(entry.frame) || !['dead','lightning','rise','walk','fall','idle'].includes(entry.stage)) throw new Error('Ciclo: fotograma o etapa no válidos.');
      number(entry.seconds, .02, 10, 'Duración');
      if (entry.text !== undefined && (typeof entry.text !== 'string' || entry.text.length > 40 || /[\x00-\x1f]/.test(entry.text))) throw new Error('Ciclo: texto no válido.');
      return { ...entry };
    });
    if (entries.reduce((sum, entry) => sum + entry.seconds, 0) > 120) throw new Error('Ciclo: duración máxima de 120 segundos.');
    if (input.cycle.reverseAfterRest && (!entries.some(entry => entry.stage === 'walk') || entries.at(-1).stage !== 'idle' || entries.slice(0, -1).some(entry => entry.stage !== 'walk'))) throw new Error('Patrulla: primero camina y luego descansa.');
    cycle = { ...input.cycle, sequence: entries };
  }
  let vehicle;
  if (input.vehicle !== undefined) {
    object(input.vehicle, ['views', 'wheelRadius', 'turnRate'], 'Vehículo');
    if (rig || flipbook || cycle || walk.enabled) throw new Error('Vehículo: usa un solo motor de animación.');
    number(input.vehicle.wheelRadius, .01, .3, 'Radio de rueda');
    number(input.vehicle.turnRate, .5, 5, 'Velocidad de giro');
    object(input.vehicle.views, ['left', 'right'], 'Vistas');
    const views = {};
    for (const side of ['left', 'right']) {
      const view = input.vehicle.views[side];
      object(view, ['crop', 'wheels'], 'Vista');
      const crop = rectangle(view.crop, 'Recorte del vehículo', true);
      if (!Array.isArray(view.wheels) || view.wheels.length < 2 || view.wheels.length > 4) throw new Error('Vehículo: se necesitan de dos a cuatro ruedas.');
      const wheels = view.wheels.map(wheel => {
        object(wheel, ['cx', 'cy', 'rx', 'ry', 'clip'], 'Rueda');
        for (const key of ['cx', 'cy']) number(wheel[key], 0, 1, 'Centro de rueda');
        for (const key of ['rx', 'ry']) number(wheel[key], .001, .3, 'Radio de rueda');
        if (wheel.cx-wheel.rx<0 || wheel.cx+wheel.rx>1 || wheel.cy-wheel.ry<0 || wheel.cy+wheel.ry>1) throw new Error('La rueda sale de la vista.');
        return { ...wheel, ...(wheel.clip ? { clip: rectangle(wheel.clip, 'Zona visible', false) } : {}) };
      });
      views[side] = { crop, wheels };
    }
    vehicle = { views, wheelRadius: input.vehicle.wheelRadius, turnRate: input.vehicle.turnRate };
  }
  if (walk.enabled && !rig && !flipbook) throw new Error('Para caminar se necesitan capas o fotogramas del personaje.');
  if ((greeting.raiseSeconds || greeting.lowerSeconds) && !rig && !flipbook) throw new Error('Para levantar y bajar el brazo se necesitan capas o fotogramas.');
  return { walk, greeting, rig, ...(flipbook ? { flipbook } : {}), ...(cycle ? { cycle } : {}), ...(vehicle ? { vehicle } : {}) };
}
function greetingDuration(behavior) { const g = behavior.greeting; return g.raiseSeconds + g.holdSeconds + g.lowerSeconds; }
function greetingFrame(remaining, active, behavior) {
  const g = behavior.greeting;
  if (!active || remaining <= 0) return { phase: 'idle', lift: 0, visible: false, text: g.text };
  const age = Math.max(0, greetingDuration(behavior) - remaining);
  const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  if (g.raiseSeconds && age < g.raiseSeconds) return { phase: 'raise', lift: smooth(age / g.raiseSeconds), visible: false, text: g.text };
  if (age < g.raiseSeconds + g.holdSeconds) return { phase: 'hold', lift: 1, visible: true, text: g.text };
  return { phase: 'lower', lift: g.lowerSeconds ? 1 - smooth((age - g.raiseSeconds - g.holdSeconds) / g.lowerSeconds) : 0, visible: false, text: g.text };
}
module.exports = { DEFAULT_BEHAVIOR, behaviorProfile, greetingDuration, greetingFrame };
