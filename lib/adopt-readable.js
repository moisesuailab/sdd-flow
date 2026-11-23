'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const YAML = require('yaml');
const io = require('./io');
const md = require('./markdown');
const project = require('./project');

function adopt(root, id, { dryRun = false } = {}) {
  const spec = project.loadSpec(root, id);
  if (spec.legacy) throw new Error('First migrate and review the legacy schema; --readable converts reviewed schema 2 artifacts');
  const cfg = project.config(root);
  let language = project.documentationSettings(cfg).language;
  const files = [];
  for (const name of ['SPEC.md', 'TASK.md']) {
    const file = spec.relative + '/' + name;
    if (!io.exists(root, file)) continue;
    const document = md.load(root, file);
    if (language === 'auto') language = document.data.language && document.data.language !== 'auto' ? document.data.language
      : /^##?\s+(?:Objetivo|Escopo|Tarefas|Premissas|Requisitos)\b/m.test(document.body) ? 'pt-BR' : 'en';
    const body = name === 'TASK.md' ? document.body.replace('Mantenha o estado das tarefas no front matter. ', '').replace('Keep task state in the front matter. ', '') : document.body;
    files.push({ path: file, previous: io.read(root, file), content: md.markdown({ ...document.data, format: 'markdown', language }, body) });
  }
  if (spec.change.storage === 'private' && files.every(file => md.parseMarkdown(file.previous).data.format === 'markdown')) return { id: spec.id, migrated: false, reason: 'Already uses readable Markdown and private storage' };
  const moves = [];
  for (const name of fs.readdirSync(io.resolve(root, spec.relative))) {
    if (!['history', 'runs', 'verification.json'].includes(name) && !/^(?:EVIDENCE|HANDOFF)[^/]*\.json$/.test(name)) continue;
    const from = spec.relative + '/' + name;
    const to = spec.relative + '/.sdd/' + (name === 'verification.json' ? 'legacy/verification.json' : name);
    io.resolve(root, from);
    if (io.exists(root, to)) throw new Error('Readable migration destination exists; inspect local artifacts before retrying');
    moves.push({ from, to });
  }
  const research = spec.relative + '/RESEARCH.md';
  if (!io.exists(root, research) && spec.change.mode !== 'light') files.push({ path: research, previous: null,
    content: md.markdown({ schema_version: 2, artifact: 'research', id: spec.id, status: 'pending' }, language.toLowerCase().startsWith('pt')
      ? '# Pesquisa\n\nPesquisa anterior não incluída nesta conversão. Referencie descobertas reais e fontes existentes; registre questões abertas.'
      : '# Research\n\nPrior research is not included in this conversion. Reference actual findings and existing sources; record open questions.') });
  const report = spec.relative + '/VALIDATION.md';
  if (io.exists(root, report)) {
    if (io.exists(root, spec.relative + '/.sdd/legacy/VALIDATION.md')) throw new Error('A preserved legacy validation already exists');
    files.push({ path: spec.relative + '/.sdd/legacy/VALIDATION.md', previous: null, content: io.read(root, report) });
    files.push({ path: report, previous: io.read(root, report), content: language.toLowerCase().startsWith('pt')
      ? '# Validação\n\nFormato convertido. Estados das tarefas preservados; revisão do escopo e nova verificação pendentes. O resultado anterior é histórico, não uma verificação desta versão.\n'
      : '# Validation\n\nFormat converted. Task states preserved; scope review and fresh verification are pending. The previous result is historical, not verification of this version.\n' });
  }
  const guide = spec.relative + '/USER_TESTS.md';
  if (io.exists(root, guide)) {
    const preserved = spec.relative + '/.sdd/legacy/USER_TESTS.md';
    if (io.exists(root, preserved)) throw new Error('A preserved legacy user guide already exists');
    const previous = io.read(root, guide);
    files.push({ path: preserved, previous: null, content: previous });
    files.push({ path: guide, previous, content: language.toLowerCase().startsWith('pt')
      ? '# Testes pendentes\n\nFormato convertido. Revise o plano e gere um handoff atual antes de executar o roteiro. A versão anterior foi preservada localmente em .sdd/legacy/USER_TESTS.md e não é evidência desta versão.\n'
      : '# Pending tests\n\nFormat converted. Review the plan and generate a current handoff before using the guide. The previous version is preserved locally in .sdd/legacy/USER_TESTS.md and is not evidence for this version.\n' });
  }
  const state = spec.relative + '/STATE.md';
  if (io.exists(root, state)) {
    const previous = io.read(root, state);
    files.push({ path: state, previous, content: (language.toLowerCase().startsWith('pt')
      ? '> Formato convertido: revise escopo e autorização e verifique novamente. As notas abaixo são anteriores à conversão; TASK.md e change.yaml indicam o estado corrente.\n\n'
      : '> Format converted: review scope/authorization and verify again. Notes below precede conversion; TASK.md and change.yaml contain current state.\n\n') + previous });
  }
  const manifest = spec.relative + '/change.yaml';
  const next = { ...spec.change, storage: 'private', approval: null,
    status: ['closed', 'cancelled'].includes(spec.change.status) ? spec.change.status : 'draft' };
  const event = '.sdd/history/format-migration-' + crypto.randomUUID() + '.json';
  const at = new Date().toISOString();
  next.last_migration = { at, event, format: 'markdown', review_required: true };
  if (next.last_revision?.event?.startsWith('history/') && moves.some(move => move.from === spec.relative + '/history')) {
    next.last_revision = { ...next.last_revision, event: '.sdd/' + next.last_revision.event };
  }
  files.push({ path: spec.relative + '/' + event, previous: null, content: JSON.stringify({
    schema_version: 2, id: spec.id, type: 'format-migration', at, previous_approval_digest: spec.change.approval?.digest || null,
    target_format: 'markdown', review_required: true,
  }, null, 2) + '\n' });
  files.push({ path: manifest, previous: io.read(root, manifest), content: YAML.stringify(next, { lineWidth: 0 }) });
  for (const file of files) require('./privacy').guardWrite(file.path, file.content, root);
  const result = { id: spec.id, dry_run: dryRun, files: files.map(file => file.path), moves, review_required: true,
    next: 'Task IDs/states and original records are preserved. Review the Markdown and pending research; reauthorize active scope and verify again. Ignore rules do not remove already tracked files.' };
  if (dryRun) return result;
  const backup = 'agents/.sdd/backups/readable-' + crypto.randomUUID();
  for (const file of files) if (file.previous !== null) io.write(root, backup + '/' + file.path, file.previous);
  const registry = require('./catalog').REGISTRY;
  const inventory = io.exists(root, registry) ? io.read(root, registry) : null;
  const ignoreFile = spec.relative + '/.gitignore';
  const previousIgnore = io.exists(root, ignoreFile) ? io.read(root, ignoreFile) : null;
  const moved = [];
  try {
    require('./privacy').ensureIgnored(root, spec.relative + '/.sdd/metadata.json');
    for (const move of moves) {
      fs.mkdirSync(require('node:path').dirname(io.resolve(root, move.to)), { recursive: true });
      fs.renameSync(io.resolve(root, move.from), io.resolve(root, move.to));
      moved.push(move);
    }
    for (const file of files) io.write(root, file.path, file.content);
    project.writeChange(root, { ...spec, change: next });
  } catch (error) {
    for (const file of files) {
      if (file.previous !== null) fs.writeFileSync(io.resolve(root, file.path), file.previous);
      else if (io.exists(root, file.path)) fs.unlinkSync(io.resolve(root, file.path));
    }
    for (const move of moved.reverse()) fs.renameSync(io.resolve(root, move.to), io.resolve(root, move.from));
    if (inventory !== null) fs.writeFileSync(io.resolve(root, registry), inventory);
    else if (io.exists(root, registry)) fs.unlinkSync(io.resolve(root, registry));
    if (previousIgnore !== null) fs.writeFileSync(io.resolve(root, ignoreFile), previousIgnore);
    else if (io.exists(root, ignoreFile)) fs.unlinkSync(io.resolve(root, ignoreFile));
    throw error;
  }
  return { ...result, migrated: true, backup };
}

module.exports = { adopt };
