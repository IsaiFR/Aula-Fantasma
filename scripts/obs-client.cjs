'use strict';
const fs = require('node:fs'), path = require('node:path'), { createHash, randomUUID } = require('node:crypto');
// Credenciales locales usadas únicamente para autenticar; nunca se imprimen ni se guardan.
module.exports = async function connectObs() {
  const config = JSON.parse(fs.readFileSync(path.join(process.env.APPDATA, 'obs-studio', 'plugin_config', 'obs-websocket', 'config.json')));
  if (!config.server_enabled) throw new Error('La conexión local de OBS está desactivada.');
  const socket = new WebSocket(`ws://127.0.0.1:${config.server_port}`), pending = new Map();
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.close(); reject(new Error('Tiempo de conexión a OBS agotado.')); }, 10000);
    socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('No se pudo conectar al OBS local.')); }, { once: true });
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.op === 0) {
        const identify = { rpcVersion: 1, eventSubscriptions: 0 };
        if (message.d.authentication) {
          const hash = value => createHash('sha256').update(value).digest('base64');
          identify.authentication = hash(hash(config.server_password + message.d.authentication.salt) + message.d.authentication.challenge);
        }
        socket.send(JSON.stringify({ op: 1, d: identify }));
      } else if (message.op === 2) { clearTimeout(timer); resolve(); }
      else if (message.op === 7) {
        const request = pending.get(message.d.requestId);
        if (request) { clearTimeout(request.timer); pending.delete(message.d.requestId); message.d.requestStatus.result ? request.resolve(message.d.responseData || {}) : request.reject(new Error(`${message.d.requestType}: ${message.d.requestStatus.code} ${message.d.requestStatus.comment || ''}`)); }
      }
    });
  });
  return {
    call(requestType, requestData = {}) {
      return new Promise((resolve, reject) => {
        const requestId = randomUUID(), timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`Tiempo agotado: ${requestType}`)); }, 15000);
        pending.set(requestId, { resolve, reject, timer });
        socket.send(JSON.stringify({ op: 6, d: { requestType, requestId, requestData } }));
      });
    },
    close() { socket.close(); }
  };
};
