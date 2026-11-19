'use strict';

const { execFile, spawn } = require('node:child_process');
const { randomInt } = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { promisify } = require('node:util');

const SCRCPY_VERSION = '4.1';
const runFile = promisify(execFile);
const MAX_PACKET = 8 * 1024 * 1024;

function tabletError(error) {
  const detail = `${error.message} ${error.stderr || ''}`;
  if (/unauthorized/i.test(detail)) return 'Desbloquea tu tablet y acepta «Permitir depuración USB». Luego vuelve a conectar.';
  if (/offline/i.test(detail)) return 'La tablet está fuera de línea. Desbloquéala y vuelve a conectar el cable USB.';
  if (/more than one/i.test(detail)) return 'Hay varios dispositivos Android por USB. Deja conectada solo la tablet que vas a presentar.';
  if (/no devices|device .+ not found/i.test(detail)) return 'No se detectó una tablet. Revisa el cable de datos y activa la depuración USB en Android.';
  if (/daemon|server version/i.test(detail)) return 'No se pudo iniciar la conexión USB de Android. Vuelve a intentarlo.';
  return error.tabletMessage || 'No se pudo mostrar la tablet. Comprueba la conexión USB e inténtalo de nuevo.';
}

function failure(tabletMessage) {
  return Object.assign(new Error(tabletMessage), { tabletMessage });
}

// Protocolo de video de scrcpy 4.1, con metadatos del dispositivo desactivados.
async function* videoPackets(stream) {
  const source = stream[Symbol.asyncIterator]();
  let pending = Buffer.alloc(0);
  async function read(size, allowEnd = false) {
    if (pending.length >= size) {
      const bytes = pending.subarray(0, size);
      pending = pending.subarray(size);
      return bytes;
    }
    const bytes = Buffer.allocUnsafe(size);
    let offset = 0;
    while (offset < size) {
      if (!pending.length) {
        const chunk = await source.next();
        if (chunk.done) {
          if (allowEnd && offset === 0) return null;
          throw failure('Se interrumpió el video de la tablet. Revisa el cable USB y vuelve a conectar.');
        }
        pending = chunk.value;
      }
      const length = Math.min(pending.length, size - offset);
      pending.copy(bytes, offset, 0, length);
      pending = pending.subarray(length);
      offset += length;
    }
    return bytes;
  }

  const codec = (await read(4)).toString('ascii');
  if (codec !== 'h264') throw failure('La tablet no pudo iniciar la captura de pantalla en H.264.');
  let origin;
  for (let header; (header = await read(12, true));) {
    if (header[0] & 0x80) {
      const width = header.readUInt32BE(4);
      const height = header.readUInt32BE(8);
      if (!width || !height || Math.max(width, height) > 4096) throw failure('La tablet envió un tamaño de video no válido.');
      origin = undefined;
      yield { type: 'session', width, height };
      continue;
    }
    const size = header.readUInt32BE(8);
    if (!size || size > MAX_PACKET) throw failure('La tablet envió un paquete de video no válido.');
    const data = await read(size);
    if (header[0] & 0x40) {
      yield { type: 'config', data };
      continue;
    }
    const pts = header.readBigUInt64BE() & ((1n << 61n) - 1n);
    origin ??= pts;
    yield { type: header[0] & 0x20 ? 'key' : 'delta', timestamp: Number(pts - origin), data };
  }
}

function probe(port, signal) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port, signal });
    const settle = connected => {
      clearTimeout(timeout);
      socket.removeListener('end', closed);
      socket.removeListener('close', closed);
      socket.removeListener('data', data);
      if (!connected) socket.destroy();
      resolve(connected ? socket : null);
    };
    const closed = () => settle(false);
    const data = chunk => {
      socket.pause();
      // ADB puede aceptar la conexión antes de que arranque el servidor Android.
      if (chunk[0] !== 0) return settle(false);
      if (chunk.length > 1) socket.unshift(chunk.subarray(1));
      settle(true);
    };
    const timeout = setTimeout(closed, 1000);
    socket.on('error', closed);
    socket.once('end', closed);
    socket.once('close', closed);
    socket.once('data', data);
  });
}

async function streamTablet({ runtime, signal, onPacket }) {
  const adb = path.join(runtime, 'adb.exe');
  const serverPath = path.join(runtime, 'scrcpy-server');
  if (!fs.existsSync(adb) || !fs.existsSync(serverPath)) throw failure('Falta el motor USB. Actualiza el portable completo de Aula Fantasma.');
  const command = async args => (await runFile(adb, args, { cwd: runtime, windowsHide: true, timeout: 7000 })).stdout.trim();
  const serial = await command(['-d', 'get-serialno']);
  if (!serial || serial === 'unknown') throw failure('No se detectó una tablet. Revisa el cable de datos y activa la depuración USB en Android.');
  const target = ['-s', serial];
  const run = (...args) => command([...target, ...args]);
  const scid = randomInt(0x80000000).toString(16).padStart(8, '0');
  const remote = '/data/local/tmp/scrcpy-aula-fantasma.jar';
  let port, child, socket, uploaded, exited;
  try {
    signal.throwIfAborted();
    uploaded = true;
    await run('push', serverPath, remote);
    signal.throwIfAborted();
    port = Number(await run('forward', 'tcp:0', `localabstract:scrcpy_${scid}`));
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw failure('No se pudo abrir el canal de video USB.');
    signal.throwIfAborted();
    child = spawn(adb, [...target, 'shell', `CLASSPATH=${remote}`, 'app_process', '/', 'com.genymobile.scrcpy.Server', SCRCPY_VERSION,
      `scid=${scid}`, 'tunnel_forward=true', 'audio=false', 'control=false', 'cleanup=false', 'send_device_meta=false',
      'video_codec=h264', 'max_size=2800', 'max_fps=30', 'video_bit_rate=12000000',
      'video_codec_options=i-frame-interval:int=2', 'log_level=error'],
    { cwd: runtime, windowsHide: true, stdio: 'ignore' });
    child.once('exit', () => { exited = true; });
    child.once('error', () => { exited = true; });
    const deadline = Date.now() + 8000;
    while (!socket && !exited && Date.now() < deadline) {
      signal.throwIfAborted();
      socket = await probe(port, signal);
      if (!socket) await delay(100, undefined, { signal });
    }
    if (!socket) throw failure('La tablet no inició el video. Desbloquéala y vuelve a conectar.');
    for await (const packet of videoPackets(socket)) {
      if (signal.aborted) return;
      onPacket(packet);
    }
    throw failure('Se desconectó la tablet. Revisa el cable USB y vuelve a conectar.');
  } finally {
    socket?.destroy();
    child?.kill();
    await Promise.allSettled([
      port > 0 && port <= 65535 && run('forward', '--remove', `tcp:${port}`),
      uploaded && run('shell', 'rm', '-f', remote)
    ]);
  }
}

module.exports = { SCRCPY_VERSION, streamTablet, tabletError, videoPackets };
