'use strict';
// Auditoría local antes de publicar. Solo informa rutas, nunca valores sensibles.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function git(args, options = {}) {
  const result = spawnSync('git', ['-c', `safe.directory=${root.replace(/\\/g, '/')}`, ...args], {
    cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options
  });
  if (result.error || result.status !== 0) throw new Error('No se pudo consultar el repositorio Git local.');
  return result.stdout;
}
try {
  const files = [...new Set(git(['ls-files', '--cached', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean))];
  const staged = new Set(git(['ls-files', '--cached', '-z']).split('\0').filter(Boolean));
  const findings = [];
  let total = 0, largest = { file: '', size: 0 };
  const ignoredSamples = ['.env', '.env.local', 'src/.env.production', '.smoke-data/settings.json', '.gif-build/frame.png', 'tmp/local.json', 'node_modules/example/index.js', 'resources/app.asar', 'Aula Fantasma.exe', 'Aula Fantasma.zip', 'docs/historial-anterior.zip'];
  const ignored = new Set(git(['check-ignore', '--no-index', '--stdin'], { input: ignoredSamples.join('\n') + '\n' }).trim().split(/\r?\n/));
  for (const file of ignoredSamples) if (!ignored.has(file)) findings.push(`${file}: falta una regla de exclusión.`);
  const patterns = [
    /\bAKIA[0-9A-Z]{16}\b/g,
    /\bAIza[0-9A-Za-z_-]{35}\b/g,
    /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g,
    /\bgithub_pat_[A-Za-z0-9_]{30,}\b/g,
    /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    /(?:api[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|password|passwd|server_password)\s*[:=]\s*["'](?!example|placeholder|your[_ -]|tu[_ -]|changeme|cambia)[A-Za-z0-9_+\/.=-]{12,}["']/gi
  ];
  for (const file of files) {
    const base = path.posix.basename(file);
    if ((/^\.env(?:\.|$)/.test(base) && !['.env.example', '.env.template'].includes(base)) || /(?:^|\/)(?:node_modules|\.smoke-data|\.gif-build|tmp|temp|\.aws|resources|locales)(?:\/|$)/.test(file) || /\.(?:zip|7z|rar|pem|key|p12|pfx|exe|dll)$/i.test(file) || /^(?:credentials|secrets)\.json$/i.test(base)) {
      findings.push(`${file}: archivo privado o generado candidato a publicación.`);
    }
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute)) { findings.push(`${file}: archivo del índice ausente.`); continue; }
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile()) { findings.push(`${file}: tipo de archivo que requiere revisión manual.`); continue; }
    total += stat.size;
    if (stat.size > largest.size) largest = { file, size: stat.size };
    if (stat.size > 50 * 1024 * 1024) findings.push(`${file}: supera el límite preventivo del proyecto de 50 MiB.`);
    if (!/\.(?:cjs|mjs|js|json|md|txt|html|css|py|ps1|cmd|bat|ya?ml)$/i.test(file) && !base.startsWith('.')) continue;
    const versions = [['archivo local', fs.readFileSync(absolute, 'utf8')]];
    if (staged.has(file)) versions.push(['índice de Git', git(['show', `:${file}`])]);
    for (const [location, content] of versions) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        if (pattern.test(content)) { findings.push(`${file} (${location}): posible secreto; revisar sin copiar su valor a registros.`); break; }
      }
    }
  }
  if (!files.includes('.env.example')) findings.push('.env.example: la plantilla no está incluida.');
  if (findings.length) {
    console.error('La preparación requiere revisión:\n' + findings.map(line => '- ' + line).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Auditoría correcta: ${files.length} archivos candidatos, ${(total / 1024 / 1024).toFixed(2)} MiB.`);
    console.log(`Mayor archivo: ${largest.file} (${(largest.size / 1024 / 1024).toFixed(2)} MiB).`);
    console.log('Plantilla incluida; secretos, runtime, ZIP y temporales excluidos. Sin coincidencias de secretos reconocibles.');
    console.log('Comprobación heurística local: revisar manualmente los cambios antes de publicar. No se ha publicado nada.');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
