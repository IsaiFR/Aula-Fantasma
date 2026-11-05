'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'";
const ROUTES = {
  '/microphone': ['microphone.html', 'text/html; charset=utf-8'],
  '/microphone.js': ['microphone.js', 'text/javascript; charset=utf-8'],
  '/voice.js': ['voice.js', 'text/javascript; charset=utf-8'],
  '/dracula-bat.js': ['dracula-bat.js', 'text/javascript; charset=utf-8'],
  '/favicon.ico': ['favicon.ico', 'image/x-icon'],
  '/panel': ['panel.html', 'text/html; charset=utf-8'],
  '/panel.js': ['panel.js', 'text/javascript; charset=utf-8'],
  '/panel.css': ['panel.css', 'text/css; charset=utf-8'],
  '/pets': ['pet-selector.html', 'text/html; charset=utf-8'],
  '/pet-selector.js': ['pet-selector.js', 'text/javascript; charset=utf-8'],
  '/pet-selector.css': ['pet-selector.css', 'text/css; charset=utf-8'],
  '/overlay': ['overlay.html', 'text/html; charset=utf-8'],
  '/overlay.js': ['overlay.js', 'text/javascript; charset=utf-8'],
  '/overlay.css': ['overlay.css', 'text/css; charset=utf-8'],
  '/pet.css': ['pet.css', 'text/css; charset=utf-8'],
  '/layout.js': ['layout.js', 'text/javascript; charset=utf-8'],
  '/cloth.js': ['cloth.js', 'text/javascript; charset=utf-8'],
  '/rig.js': ['rig.js', 'text/javascript; charset=utf-8'],
  '/vehicle.js': ['vehicle.js', 'text/javascript; charset=utf-8'],
  '/flipbook.js': ['flipbook.js', 'text/javascript; charset=utf-8'],
  '/edughost/open.png': ['edughost/open.png', 'image/png'],
  '/edughost/closed.png': ['edughost/closed.png', 'image/png'],
  '/mascota.svg': ['mascota.svg', 'image/svg+xml']
};

async function startServer({ webRoot, getFrame, getVoiceFrame = () => null, getAsset, getLibraryFrame = () => null, getLibraryFrames = () => ({}), onClients = () => {}, preferredPort = 18747 }) {
  const clients = new Map();
  const stats = () => ({ obs: [...clients.values()].filter(c => c.kind === 'obs').length });
  const server = http.createServer((req, res) => {
    const port = server.address()?.port;
    if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(req.headers.host)) {
      res.writeHead(403).end(); return;
    }
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end(); return; }
    let url;
    try { url = new URL(req.url, `http://127.0.0.1:${port}`); }
    catch { res.writeHead(400).end(); return; }
    const headers = {
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': CSP, 'Cross-Origin-Resource-Policy': 'same-origin'
    };
    if (url.pathname === '/library-frames') {
      res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getLibraryFrames())); return;
    }
    if (url.pathname === '/events') {
      const petId = url.searchParams.get('pet');
      const slot = url.searchParams.get('slot');
      const frame = petId ? getLibraryFrame(petId) : slot === 'voice' ? getVoiceFrame() : getFrame();
      if (!frame) { res.writeHead(404, headers).end(); return; }
      res.writeHead(200, { ...headers, 'Content-Type': 'text/event-stream', Connection: 'keep-alive' });
      res.write(`retry: 1500\nevent: frame\ndata: ${JSON.stringify(frame)}\n\n`);
      const kind = petId ? 'library' : slot === 'voice' ? 'layer' : ['desktop', 'preview'].includes(url.searchParams.get('surface')) ? url.searchParams.get('surface') : 'obs';
      clients.set(res, { kind, petId, slot });
      onClients(stats());
      req.on('close', () => { clients.delete(res); onClients(stats()); });
      return;
    }
    if (url.pathname === '/state') {
      res.writeHead(200, { ...headers, 'Content-Type': 'application/json' });
      res.end(JSON.stringify(url.searchParams.get('slot') === 'voice' ? getVoiceFrame() : getFrame())); return;
    }
    let file, mime;
    const assetRoutes = { '/asset-bat-open': 'batOpen', '/asset-bat-closed': 'batClosed', '/asset-bat-talking-closed': 'batTalkingClosed', '/asset-bat': 'bat', '/asset': 'open', '/asset-closed': 'closed', '/asset-talking': 'talking', '/asset-talking-closed': 'talkingClosed', '/asset-atlas': 'atlas', '/asset-limb': 'limb', '/asset-walk': 'walk', '/asset-greeting': 'greeting', '/asset-frames': 'frames', '/asset-cycle': 'cycle' };
    if (assetRoutes[url.pathname]) {
      const asset = getAsset(assetRoutes[url.pathname], url.searchParams.get('pet'), url.searchParams.get('slot'));
      if (!asset) { res.writeHead(404).end(); return; }
      if (Buffer.isBuffer(asset.bytes)) {
        res.writeHead(200, { ...headers, 'Content-Type': asset.mime, 'Content-Length': asset.bytes.length });
        res.end(asset.bytes); return;
      }
      file = asset.path; mime = asset.mime;
    } else if (ROUTES[url.pathname]) {
      [file, mime] = ROUTES[url.pathname]; file = path.join(webRoot, file);
    } else { res.writeHead(404, headers).end('No encontrado'); return; }
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) { res.writeHead(404, headers).end(); return; }
      res.writeHead(200, { ...headers, 'Content-Type': mime, 'Content-Length': stat.size });
      const stream = fs.createReadStream(file);
      stream.on('error', () => res.destroy()); stream.pipe(res);
    });
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  let port = preferredPort;
  for (;;) {
    try {
      await new Promise((resolve, reject) => {
        const onListening = () => { server.off('error', onError); resolve(); };
        const onError = error => { server.off('listening', onListening); reject(error); };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, '127.0.0.1');
      });
      break;
    } catch (error) {
      if (error.code !== 'EADDRINUSE' || port === 0 || port >= preferredPort + 10) throw error;
      port += 1;
    }
  }
  const heartbeat = setInterval(() => {
    for (const res of clients.keys()) if (!res.destroyed && !res.writableNeedDrain) res.write(': heartbeat\n\n');
  }, 15000);
  heartbeat.unref();
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    publish(frame) {
      const message = `event: frame\ndata: ${JSON.stringify(frame)}\n\n`;
      for (const [res, client] of clients) {
        if (res.destroyed) { clients.delete(res); continue; }
        // Un consumidor lento no acumula fotogramas antiguos.
        if (!res.writableNeedDrain) {
          if (client.kind === 'library') {
            const preview = getLibraryFrame(client.petId);
            if (preview) res.write(`event: frame\ndata: ${JSON.stringify(preview)}\n\n`);
          } else if (client.slot === 'voice') {
            const voice = getVoiceFrame(); if (voice) res.write(`event: frame\ndata: ${JSON.stringify(voice)}\n\n`);
          } else res.write(message);
        }
      }
    },
    close() {
      clearInterval(heartbeat);
      for (const res of clients.keys()) res.end();
      clients.clear(); server.closeAllConnections();
      return new Promise(resolve => server.close(resolve));
    },
    stats
  };
}

module.exports = { startServer };
