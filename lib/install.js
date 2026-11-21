'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const io = require('./io');
const md = require('./markdown');
const project = require('./project');
const { check } = require('./check');

const TEMPLATES = path.join(__dirname, '..', 'templates');
const VERSION = require('../package.json').version;
const LEGACY = require('./legacy-hashes.json');
const START = '<!-- sdd-flow:start -->';
const END = '<!-- sdd-flow:end -->';

function block(content) {
  const start = content.indexOf(START);
  const end = content.indexOf(END);
  if (start < 0 && end < 0) return null;
  if (start < 0 || end < start || content.indexOf(START, start + START.length) >= 0 || content.indexOf(END, end + END.length) >= 0) {
    throw new Error('Malformed SDD managed block; restore its markers before updating');
  }
  return { start, end: end + END.length, content: content.slice(start, end + END.length) };
}

function mergeEntry(existing, incoming) {
  const replacement = block(incoming);
  if (!replacement) throw new Error('Distributed entry point has no managed block');
  const old = block(existing);
  if (old) return existing.slice(0, old.start) + replacement.content + existing.slice(old.end);
  return existing.trimEnd() + (existing.trim() ? '\n\n' : '') + replacement.content + '\n';
}

function install(root, { update = false, dryRun = false, replaceManaged = false } = {}) {
  const stateFile = 'agents/.sdd/installed.json';
  const state = io.exists(root, stateFile) ? io.json(root, stateFile) : { schema_version: 2, files: {} };
  if (state.schema_version !== 2 || !state.files || typeof state.files !== 'object') throw new Error('Invalid installation inventory');
  const userFiles = new Set(['agents/config.yaml', 'agents/PROJECT.md', 'agents/POLICIES.md', 'agents/QUALITY.md', 'agents/DECISIONS.md', 'agents/.gitignore']);
  const plan = [];
  const conflicts = [];
  for (const relative of io.walk(TEMPLATES)) {
    const incoming = io.read(TEMPLATES, relative);
    const present = io.exists(root, relative);
    const previous = present ? io.read(root, relative) : '';
    let content = incoming;
    let action = present ? 'unchanged' : 'create';
    let managed = !userFiles.has(relative);
    if (relative === 'agents/SETUP.md' && !present && (state.files[relative] || update)) {
      action = 'preserve';
      managed = false;
      content = '';
    } else if (!managed && present) {
      action = 'preserve';
      content = previous;
    } else if (relative === 'AGENTS.md') {
      const oldBlock = present ? block(previous) : null;
      const oldHash = oldBlock ? io.hash(oldBlock.content) : io.hash(previous);
      const expected = state.files[relative]?.hash;
      const knownLegacy = present && io.hash(previous) === LEGACY[relative];
      content = knownLegacy ? incoming : mergeEntry(previous, incoming);
      if (present && expected && oldHash !== expected && previous !== content && !replaceManaged) {
        action = 'conflict';
      } else if (previous !== content) action = knownLegacy ? 'migrate-legacy' : present ? 'merge-entry' : 'create';
    } else if (present && previous !== incoming && managed) {
      const owned = state.files[relative]?.hash === io.hash(previous);
      const legacy = LEGACY[relative] === io.hash(previous);
      action = owned || legacy || replaceManaged ? 'update' : 'conflict';
    }
    if (action === 'conflict') conflicts.push(relative);
    plan.push({ path: relative, action, content, previous, managed });
  }
  if (dryRun) return { version: VERSION, dry_run: true, conflicts, files: plan.map(({ path, action }) => ({ path, action })) };
  if (conflicts.length) throw new Error('Customized/unowned workflow files were preserved. Review sdd update --dry-run; use --replace-managed only after review (backups are created):\n' + conflicts.join('\n'));
  const backupId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID().slice(0, 8);
  for (const item of plan) {
    if (!['unchanged', 'preserve'].includes(item.action)) {
      if (io.exists(root, item.path)) io.write(root, 'agents/.sdd/backups/' + backupId + '/' + item.path, item.previous);
      io.write(root, item.path, item.content);
    }
    if (item.managed) {
      state.files[item.path] = { hash: io.hash(item.path === 'AGENTS.md' ? block(item.content).content : item.content) };
    }
  }
  for (const directory of ['agents/specs', 'agents/archive', 'agents/current', 'agents/decisions', 'agents/skills']) {
    fs.mkdirSync(io.resolve(root, directory), { recursive: true });
  }
  state.version = VERSION;
  io.writeJson(root, stateFile, state);
  return { version: VERSION, update, backup: 'agents/.sdd/backups/' + backupId, files: plan.map(({ path, action }) => ({ path, action })) };
}

function doctor(root) {
  const errors = [];
  const warnings = [];
  const details = {};
  try {
    details.config = project.config(root);
    for (const file of ['AGENTS.md', 'agents/AGENTS.md', 'agents/RULES.md', 'agents/PROJECT.md']) {
      if (!io.exists(root, file)) errors.push('Missing ' + file);
    }
    if (io.exists(root, 'agents/PROJECT.md') && /\[FILL:|\[TODO:/.test(io.read(root, 'agents/PROJECT.md'))) errors.push('Complete agents/PROJECT.md setup');
    if (io.exists(root, 'agents/SETUP.md')) warnings.push('SETUP.md remains available; remove it after completing project setup');
    details.skills = project.skills(root);
    const specs = project.specDirectories(root);
    const identifiers = new Set();
    details.specs = [];
    for (const spec of specs) {
      if (identifiers.has(spec.id)) errors.push('Duplicate active/archive spec ID: ' + spec.id);
      identifiers.add(spec.id);
      try {
        const loaded = project.loadSpec(root, spec.id);
        if (loaded.legacy) warnings.push('Legacy spec requires migration: ' + spec.id);
        else {
          const result = check(root, spec.id);
          details.specs.push({ id: spec.id, status: loaded.change.status, valid: result.valid });
          if (!result.valid) warnings.push(spec.id + ': ' + result.errors.join('; '));
        }
      } catch (error) { errors.push(spec.id + ': ' + error.message); }
    }
    if (io.exists(root, 'agents/.sdd/installed.json')) {
      const state = io.json(root, 'agents/.sdd/installed.json');
      for (const [file, record] of Object.entries(state.files)) {
        if (file === 'agents/SETUP.md' && !io.exists(root, file)) continue;
        if (!io.exists(root, file)) { errors.push('Managed file is missing: ' + file); continue; }
        const source = io.read(root, file);
        const content = file === 'AGENTS.md' ? block(source)?.content : source;
        if (!content || io.hash(content) !== record.hash) warnings.push('Managed file has local edits: ' + file);
      }
    } else warnings.push('Installation inventory missing; use sdd update --dry-run');
    details.retention = require('./management').inspect(root);
    for (const item of details.retention.missing) warnings.push('Missing spec content: ' + item.id + '; use sdd reconcile --dry-run');
    for (const item of details.retention.updates) warnings.push('Observed spec inventory needs reconciliation: ' + item.id);
    for (const item of details.retention.issues) warnings.push(item.spec + ': ' + item.kind + ' ' + item.target);
    if (io.exists(root, 'agents/.sdd/adapters.json')) {
      const adapters = io.json(root, 'agents/.sdd/adapters.json');
      for (const [name, files] of Object.entries(adapters)) {
        for (const [file, record] of Object.entries(files)) {
          if (!io.exists(root, file)) { errors.push(name + ': missing active adapter file ' + file); continue; }
          const text = io.read(root, file);
          const actual = record.block ? block(text)?.content : text;
          if (!actual || io.hash(actual) !== record.hash) warnings.push(name + ': adapter file has local edits: ' + file);
          const canonical = file.endsWith('/references/rules.md') ? 'agents/RULES.md'
            : file.endsWith('/references/workflow.md') ? 'agents/AGENTS.md' : null;
          if (canonical && io.hash(text) !== io.hash(io.read(root, canonical))) warnings.push(name + ': rerun sdd harness to refresh ' + file);
        }
      }
    }
    if (io.exists(root, 'agents/harness')) warnings.push('Legacy harness templates remain. Review old active settings/hooks manually; v2 does not silently remove existing permission controls.');
  } catch (error) { errors.push(error.message); }
  return { valid: !errors.length, errors, warnings, details };
}

function migrate(root, id, { dryRun = false } = {}) {
  const spec = project.loadSpec(root, id);
  if (!spec.legacy) return { id: spec.id, migrated: false, reason: 'Already uses schema 2' };
  const files = [];
  for (const [name, artifact] of [['SPEC.md', 'spec'], ['TASK.md', 'tasks'], ['RESEARCH.md', 'research']]) {
    const file = spec.relative + '/' + name;
    if (!io.exists(root, file)) continue;
    const original = io.read(root, file);
    const document = md.parseMarkdown(original, file, false);
    if (!document.legacy) continue;
    const data = { schema_version: 2, artifact, id: spec.id, legacy: true };
    if (artifact === 'spec') { data.requirements = []; data.acceptance = []; }
    if (artifact === 'tasks') {
      data.tasks = [...document.body.matchAll(/^- \[([ x-])\]\s+(T\d+)\s*[—–-]\s*(.+)$/gm)].map(match => ({
        id: match[2], title: match[3], status: match[1] === 'x' ? 'done' : match[1] === '-' ? 'cancelled' : 'pending',
        covers: [], depends_on: [], verify: '',
      }));
    }
    files.push({ path: file, previous: original, content: md.markdown(data, document.body) });
  }
  const change = { schema_version: 2, id: spec.id, title: spec.id.replace(/^\d+-/, ''), mode: 'standard', status: 'draft',
    capabilities: [], decisions: [], skills: [], depends_on: [], context: [], sources: [], approval: null };
  if (dryRun) return { id: spec.id, dry_run: true, files: files.map(f => f.path), review_required: true };
  const backup = 'agents/.sdd/backups/migrate-' + crypto.randomUUID();
  for (const file of files) {
    io.write(root, backup + '/' + file.path, file.previous);
    io.write(root, file.path, file.content);
  }
  project.writeChange(root, { ...spec, change });
  return { id: spec.id, migrated: true, backup, review_required: true,
    next: 'Preserved legacy bodies. Review requirements/acceptance/covers/verify, remove legacy: true after normalization, then run sdd check. No approval or test evidence was fabricated.' };
}

module.exports = { TEMPLATES, VERSION, START, END, block, mergeEntry, install, doctor, migrate };
