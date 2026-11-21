'use strict';

const fs = require('node:fs');
const path = require('node:path');
const io = require('./io');
const md = require('./markdown');

const REGISTRY = 'agents/.sdd/registry.json';
const ID = /^\d+-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AREAS = ['agents/specs', 'agents/archive'];
const TRASH = 'agents/.sdd/trash';
const selectorName = value => typeof value === 'string' && value.length > 0 && value.length <= 255 && !/[\\/\0]/.test(value) && !['.', '..'].includes(value);

function registry(root) {
  const value = io.exists(root, REGISTRY) ? io.json(root, REGISTRY) : { ids: [], records: {} };
  if (!Array.isArray(value.ids) || value.ids.some(id => !ID.test(id)) ||
      (value.records !== undefined && (!value.records || typeof value.records !== 'object' || Array.isArray(value.records)))) {
    throw new Error('Invalid SDD registry');
  }
  value.records ||= {};
  for (const [id, record] of Object.entries(value.records)) {
    if (!ID.test(id) || !record || typeof record !== 'object') throw new Error('Invalid SDD registry record');
    for (const file of [record.path, record.restore_path].filter(Boolean)) {
      io.resolve(root, file);
      if (![...AREAS, TRASH].some(parent => file.startsWith(parent + '/') && !file.slice(parent.length + 1).includes('/'))) {
        throw new Error('Invalid SDD registry location: ' + file);
      }
    }
    if (record.aliases !== undefined && (!Array.isArray(record.aliases) || record.aliases.some(name => !selectorName(name)))) {
      throw new Error('Invalid SDD registry aliases');
    }
  }
  return value;
}

function list(root, { includeTrash = false, issues = [] } = {}) {
  const result = [];
  const records = registry(root).records;
  for (const parent of [...AREAS, ...(includeTrash ? [TRASH] : [])]) {
    if (!io.exists(root, parent)) continue;
    for (const item of fs.readdirSync(io.resolve(root, parent), { withFileTypes: true })) {
      if (item.name.startsWith('_') || item.name.startsWith('.')) continue;
      if (item.isSymbolicLink()) throw new Error('Symbolic links are not followed: ' + parent + '/' + item.name);
      if (!item.isDirectory()) continue;
      const relative = parent + '/' + item.name;
      let id = item.name;
      let invalid;
      const file = relative + '/change.yaml';
      try {
        if (io.exists(root, file)) {
          const change = md.parseYaml(io.read(root, file), file);
          if (change.schema_version !== 2 || !ID.test(change.id)) throw new Error(file + ': invalid schema_version or id');
          id = change.id;
        } else {
          const previous = Object.entries(records).find(([, record]) => record.path === relative);
          if (previous && previous[1].status !== 'legacy') throw new Error(file + ': recorded spec is missing its manifest; restore or repair this file');
          if (!ID.test(id)) continue;
        }
      } catch (error) {
        invalid = error.message;
        id = Object.entries(records).find(([, record]) => record.path === relative)?.[0] || (ID.test(item.name) ? item.name : null);
        issues.push({ path: relative, kind: 'invalid-manifest', remedy: error.message });
        if (!id) continue;
      }
      result.push({ id, relative, name: item.name, ...(invalid && { invalid }), location: parent === AREAS[0] ? 'active' : parent === AREAS[1] ? 'archive' : 'trash' });
    }
  }
  return result;
}

function locate(root, selector, options) {
  if (!selectorName(selector)) throw new Error('Expected a spec ID or folder name');
  const inventory = registry(root);
  const matches = list(root, options).filter(spec => {
    const record = inventory.records[spec.id];
    if (inventory.ids.includes(selector) && selector !== spec.id) return false;
    return spec.id === selector || spec.name === selector ||
      record?.aliases?.includes(selector) ||
      (/^\d+$/.test(selector) && [spec.id, spec.name].some(name => name.split('-')[0] === selector));
  });
  if (matches.length !== 1) {
    const error = new Error(matches.length ? 'Ambiguous spec ID or folder name: ' + selector
      : 'Spec not found: ' + selector + '. Run sdd reconcile --dry-run to inspect missing or moved specs.');
    error.code = matches.length ? 'SPEC_AMBIGUOUS' : 'SPEC_NOT_FOUND';
    throw error;
  }
  if (matches[0].invalid) throw new Error(matches[0].invalid);
  return matches[0];
}

function remember(root, spec, extra = {}) {
  const value = registry(root);
  const previous = value.records[spec.id] || {};
  const aliases = [...new Set([...(previous.aliases || []), previous.path && path.posix.basename(previous.path),
    ...(!spec.relative.startsWith(TRASH + '/') ? [path.posix.basename(spec.relative)] : [])].filter(Boolean))];
  const closure = spec.change?.closure;
  value.records[spec.id] = {
    ...previous, path: spec.relative, status: spec.change?.status || 'legacy',
    availability: spec.relative.startsWith(TRASH + '/') ? 'trash' : 'present',
    aliases, capabilities: spec.change?.capabilities || [],
    ...(closure && { closure: Object.fromEntries(['at', 'run_id', 'validation', 'acceptance_verified', 'outcome'].map(key => [key, closure[key] ?? null])) }),
    observed_at: new Date().toISOString(), ...extra,
  };
  value.ids = [...new Set([...value.ids, spec.id])].sort();
  io.writeJson(root, REGISTRY, value);
  return value.records[spec.id];
}

function referencePath(root, file) {
  io.resolve(root, file);
  const match = file.match(/^agents\/(?:specs|archive)\/([^/]+)\/(.+)$/);
  if (!match) return file;
  try {
    const spec = locate(root, match[1]);
    return spec.relative + '/' + match[2];
  } catch (error) {
    if (error.code === 'SPEC_NOT_FOUND') {
      const manifest = file.slice(0, file.length - match[2].length) + 'change.yaml';
      if (io.exists(root, file) && io.exists(root, manifest)) throw new Error('Reference folder conflicts with a reserved spec identity: ' + file);
      return file;
    }
    throw error;
  }
}

function historical(ref) {
  return typeof ref === 'object' && ref !== null && ref.historical === true;
}

function reference(root, ref) {
  const declared = typeof ref === 'string' ? ref : ref?.path;
  if (typeof ref !== 'string' && (!ref || typeof ref !== 'object' || Array.isArray(ref) ||
      (ref.historical !== undefined && typeof ref.historical !== 'boolean'))) throw new Error('Invalid context/source reference');
  const file = referencePath(root, declared);
  if (!io.exists(root, file) && historical(ref)) return { path: file, declared, missing: true };
  const doc = md.load(root, file, false);
  if (typeof ref === 'object' && ref.section) md.section(doc.body, ref.section, file);
  return { path: file, declared, missing: false };
}

function dependency(root, id) {
  if (!ID.test(id)) throw new Error('Dependency must use a stable full spec ID: ' + id);
  const matches = list(root).filter(spec => spec.id === id);
  if (matches.length > 1) throw new Error('Ambiguous spec identity: ' + id);
  if (matches.length) {
    const location = matches[0];
    if (location.invalid) throw new Error(location.invalid);
    const file = location.relative + '/change.yaml';
    if (!io.exists(root, file)) return { ...location, legacy: true };
    return { ...location, change: md.parseYaml(io.read(root, file), file), legacy: false, retained: false };
  } else {
    const record = registry(root).records[id];
    if (record?.status === 'closed' && record.closure) {
      return { id, retained: true, legacy: false, change: {
        id, status: 'closed', depends_on: [], capabilities: record.capabilities || [], closure: record.closure,
      } };
    }
    return { id, missing: true, previous_status: record?.status || null };
  }
}

module.exports = { REGISTRY, ID, AREAS, TRASH, registry, list, locate, remember, referencePath, reference, historical, dependency };
