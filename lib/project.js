'use strict';

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const io = require('./io');
const md = require('./markdown');
const quality = require('./quality');
const catalog = require('./catalog');

const MODES = ['light', 'standard', 'rigorous'];
const BUDGET_MODES = ['warn', 'strict'];
const PHASES = ['research', 'plan', 'implement', 'validate', 'close'];
const CONFIG = 'agents/config.yaml';

function documentationSettings(cfg) {
  const settings = cfg.documentation;
  if (settings !== undefined && (!settings || typeof settings !== 'object' || Array.isArray(settings))) throw new Error('documentation must be a mapping');
  const language = settings?.language ?? 'auto';
  if (typeof language !== 'string' || !language.trim()) throw new Error('documentation.language must be auto or a language tag such as pt-BR');
  try {
    return { language: language === 'auto' ? language : Intl.getCanonicalLocales(language)[0], encoding: 'UTF-8' };
  } catch {
    throw new Error('documentation.language must be auto or a valid language tag such as pt-BR');
  }
}

function config(root) {
  if (!io.exists(root, CONFIG)) throw new Error('Missing agents/config.yaml. Run sdd init, or sdd update for a v1 project.');
  const value = md.parseYaml(io.read(root, CONFIG), CONFIG);
  if (value.schema_version !== 2) throw new Error('Unsupported config schema_version; expected 2');
  if (!MODES.includes(value.mode)) throw new Error('Invalid project mode');
  if (!['batch', 'step'].includes(value.autonomy)) throw new Error('Invalid autonomy; expected batch or step');
  if (!['required', 'optional'].includes(value.approval)) throw new Error('Invalid approval policy');
  documentationSettings(value);
  quality.settings(value);
  if (value.artifact_format !== undefined && !['markdown', 'yaml'].includes(value.artifact_format)) throw new Error('artifact_format must be markdown or yaml');
  if (value.privacy !== undefined && (!value.privacy || typeof value.privacy !== 'object' || Array.isArray(value.privacy))) throw new Error('privacy must be a mapping');
  if (value.privacy?.store_logs !== undefined && typeof value.privacy.store_logs !== 'boolean') throw new Error('privacy.store_logs must be boolean');
  if (value.privacy?.local_mode !== undefined && !['warn', 'strict'].includes(value.privacy.local_mode)) throw new Error('privacy.local_mode must be warn or strict');
  if (value.privacy?.sensitive_paths !== undefined && !Array.isArray(value.privacy.sensitive_paths)) throw new Error('privacy.sensitive_paths must be an array');
  for (const file of value.privacy?.sensitive_paths || []) io.resolve(root, file);
  if (!Number.isSafeInteger(value.context?.max_bytes) || value.context.max_bytes < 1024) throw new Error('context.max_bytes must be an integer >= 1024');
  if (value.context.budget_mode !== undefined && !BUDGET_MODES.includes(value.context.budget_mode)) throw new Error('context.budget_mode must be warn or strict');
  if (!Array.isArray(value.checks) || !Array.isArray(value.verification?.exclude)) throw new Error('checks and verification.exclude must be arrays');
  const names = new Set();
  for (const check of value.checks) {
    if (!/^[a-z][a-z0-9-]*$/.test(check.name) || names.has(check.name)) throw new Error('Invalid or duplicate check name');
    if (typeof check.command !== 'string' || !check.command.trim()) throw new Error('Check command must be a nonempty string');
    if (!Number.isSafeInteger(check.timeout_ms) || check.timeout_ms < 1 || check.timeout_ms > 3600000) throw new Error('Check timeout_ms must be between 1 and 3600000');
    names.add(check.name);
    quality.checkSettings(check);
  }
  for (const exclude of value.verification.exclude) {
    io.resolve(root, exclude);
    if (exclude === 'agents' || exclude === 'src' || exclude === 'tests' || exclude === 'package.json') {
      throw new Error('Do not exclude source or dependency manifests: ' + exclude);
    }
  }
  return value;
}

function specDirectories(root, options) { return catalog.list(root, options); }

function locate(root, id, options) { return catalog.locate(root, id, options); }

function loadSpec(root, id, options) {
  const location = locate(root, id, options);
  const manifestPath = location.relative + '/change.yaml';
  if (!io.exists(root, manifestPath)) return { ...location, legacy: true };
  const change = md.parseYaml(io.read(root, manifestPath), manifestPath);
  if (change.schema_version !== 2 || change.id !== location.id) throw new Error(manifestPath + ': invalid schema_version or id');
  return { ...location, change, legacy: false };
}

function writeChange(root, spec) {
  io.write(root, spec.relative + '/change.yaml', YAML.stringify(spec.change, { lineWidth: 0 }));
  catalog.remember(root, spec);
}

function internal(spec, file) {
  return (spec.change?.storage === 'private' ? '.sdd/' : '') + file;
}

function receiptFile(spec) {
  return spec.relative + '/' + internal(spec, 'verification.json');
}

function skills(root) {
  const records = [];
  for (const file of io.walk(root, 'agents/skills', rel => rel.split('/').some(s => s.startsWith('_')))) {
    if (!file.endsWith('/SKILL.md')) continue;
    const { data, legacy } = md.load(root, file, false);
    if (legacy) throw new Error(file + ': missing YAML front matter; run sdd skills migrate --dry-run, then sdd skills migrate');
    const expected = path.posix.basename(path.posix.dirname(file));
    if (typeof data.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name) || data.name.length > 64 || data.name !== expected) {
      throw new Error(file + ': name must match its directory and Agent Skills naming rules');
    }
    if (typeof data.description !== 'string' || !data.description.trim() || data.description.length > 1024) throw new Error(file + ': description must contain 1–1024 characters');
    if (records.some(s => s.name === data.name)) throw new Error('Duplicate skill name: ' + data.name);
    records.push({ name: data.name, description: data.description, path: file });
  }
  return records;
}

function scopeDocument(root, spec) {
  const change = spec.change;
  const fields = ['schema_version', 'id', 'title', 'mode', 'capabilities', 'decisions', 'skills', 'depends_on', 'context', 'sources'];
  const normative = Object.fromEntries(fields.map(k => [k, change[k] ?? null]));
  const specification = md.load(root, spec.relative + '/SPEC.md');
  let tasks = null;
  if (io.exists(root, spec.relative + '/TASK.md')) {
    const source = md.load(root, spec.relative + '/TASK.md');
    tasks = {
      body: source.body,
      data: { ...source.data, tasks: (source.data.tasks || []).map(t => {
        const { status, cancellation, evidence, deferral, notes, ...plan } = t;
        return plan;
      }) },
    };
  }
  const policy = config(root);
  return { change: normative, specification, tasks, policy: {
    approval: policy.approval, autonomy: policy.autonomy, checks: policy.checks, verification: policy.verification,
    quality: quality.settings(policy),
    project_policies: io.exists(root, 'agents/POLICIES.md') ? io.read(root, 'agents/POLICIES.md') : '',
    project_quality: io.exists(root, 'agents/QUALITY.md') ? io.read(root, 'agents/QUALITY.md') : '',
  } };
}

function scopeDigest(root, spec) {
  return io.digest(scopeDocument(root, spec));
}

function approvalValid(root, spec) {
  return Boolean(spec.change.approval?.by && spec.change.approval?.at && spec.change.approval?.digest === scopeDigest(root, spec));
}

function sourceSnapshot(root) {
  const cfg = config(root);
  const excluded = ['.git', 'node_modules', 'agents', ...cfg.verification.exclude];
  const files = io.walk(root, '', (rel, entry) => {
    if (excluded.some(prefix => rel === prefix || rel.startsWith(prefix + '/'))) return true;
    if (entry.isDirectory() && ['node_modules', '.git', '__pycache__', '.pytest_cache'].includes(entry.name)) return true;
    return false;
  });
  return Object.fromEntries(files.map(file => [file, io.hash(fs.readFileSync(io.resolve(root, file)))]));
}

function inputDigest(root, spec) {
  const references = [...spec.change.capabilities, ...spec.change.decisions,
    ...spec.change.sources.map(x => typeof x === 'string' ? x : x.path),
    ...spec.change.context.map(x => typeof x === 'string' ? x : x.path)];
  for (const name of spec.change.skills) {
    const found = skills(root).find(s => s.name === name);
    if (!found) throw new Error('Unknown skill: ' + name);
    references.push(...io.walk(root, path.posix.dirname(found.path)));
  }
  const historical = new Set([...spec.change.sources, ...spec.change.context].filter(catalog.historical).map(ref => ref.path));
  const docs = Object.fromEntries([...new Set(references)].sort().map(file => {
    const actual = catalog.referencePath(root, file);
    return [file, historical.has(file) && !io.exists(root, actual) ? 'missing-historical-reference' : io.hash(io.read(root, actual, io.MAX_REFERENCE_READ))];
  }));
  const tasks = io.exists(root, spec.relative + '/TASK.md')
    ? md.load(root, spec.relative + '/TASK.md').data.tasks.map(({ notes, ...task }) => task) : [];
  return { digest: io.digest({ scope: scopeDigest(root, spec), config: config(root), files: sourceSnapshot(root), docs, tasks }), docs };
}

function createSpec(root, title, mode) {
  const cfg = config(root);
  mode = mode || cfg.mode;
  if (!MODES.includes(mode)) throw new Error('Mode must be light, standard or rigorous');
  if (typeof title !== 'string' || !title.trim()) throw new Error('Provide a feature name');
  require('./privacy').local(root, title, 'spec title');
  const name = title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!name || name.length > 96) throw new Error('Feature name must produce a slug of 1–96 characters');
  const registryPath = 'agents/.sdd/registry.json';
  const registry = catalog.registry(root);
  if (!Array.isArray(registry.ids) || registry.ids.some(id => typeof id !== 'string' || !/^\d+-/.test(id))) throw new Error('Invalid SDD registry');
  const all = [...registry.ids, ...specDirectories(root).map(s => s.id)];
  const numbers = [...all, ...specDirectories(root).map(s => s.name)].filter(id => /^\d+-/.test(id)).map(id => Number(id.split('-')[0]));
  if (numbers.some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error('Invalid spec number in registry');
  const next = Math.max(0, ...numbers) + 1;
  if (!Number.isSafeInteger(next)) throw new Error('Spec numbering exceeded the safe integer range');
  const id = String(next).padStart(3, '0') + '-' + name;
  const relative = 'agents/specs/' + id;
  fs.mkdirSync(io.resolve(root, relative), { recursive: false });
  registry.ids = [...new Set([...all, id])].sort();
  io.writeJson(root, registryPath, registry);
  const spec = { id, relative, change: {
    schema_version: 2, id, title, mode, status: 'draft',
    capabilities: [], decisions: [], skills: [], depends_on: [], context: [], sources: [], approval: null,
  } };
  const readable = (cfg.artifact_format ?? 'markdown') === 'markdown';
  if (readable) spec.change.storage = 'private';
  writeChange(root, spec);
  const portuguese = documentationSettings(cfg).language.toLowerCase().split('-')[0] === 'pt';
  const format = readable ? { format: 'markdown', language: portuguese ? 'pt-BR' : 'en' } : {};
  io.write(root, relative + '/SPEC.md', md.markdown({
    schema_version: 2, artifact: 'spec', id, ...format, requirements: [], acceptance: [],
  }, '# ' + title + (portuguese
    ? '\n\n## Objetivo\n\nDescreva o resultado observável.\n\n## Escopo\n\nIndique o que muda e o que fica fora desta alteração.'
    : '\n\n## Goal\n\nDescribe the observable outcome.\n\n## Scope\n\nState what changes and what remains outside this change.')));
  if (mode !== 'light') {
    io.write(root, relative + '/TASK.md', md.markdown({ schema_version: 2, artifact: 'tasks', id, ...format, tasks: [] },
      portuguese
        ? '# Plano de execução\n\nPlaneje resultados coesos e verificáveis, incluindo os testes.\n\n[ ] não concluída · [x] concluída · [-] cancelada. Quando necessário, use uma nota Situação para indicar andamento ou verificação externa pendente.'
        : '# Execution plan\n\nPlan cohesive verifiable outcomes, including tests.\n\n[ ] not completed · [x] done · [-] cancelled. When needed, use a Status note for work in progress or pending external verification.'));
    if (readable) io.write(root, relative + '/RESEARCH.md', md.markdown({ schema_version: 2, artifact: 'research', id, status: 'pending' }, portuguese
      ? '# Pesquisa\n\n## Descobertas\n\nPesquisa ainda não registrada. Documente fatos e fontes reais; se dispensável, registre o motivo e use status: not_needed.\n\n## Questões abertas\n\nRegistre incertezas relevantes antes de implementar.'
      : '# Research\n\n## Findings\n\nResearch not recorded yet. Record actual facts and sources; if unnecessary, state why and use status: not_needed.\n\n## Open questions\n\nRecord material uncertainty before implementation.'));
  }
  return spec;
}

module.exports = { MODES, BUDGET_MODES, PHASES, CONFIG, documentationSettings, config, specDirectories, locate, loadSpec, writeChange, internal, receiptFile, skills, scopeDocument, scopeDigest, approvalValid, sourceSnapshot, inputDigest, createSpec };
