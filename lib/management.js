'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const io = require('./io');
const project = require('./project');
const catalog = require('./catalog');
const history = require('./history');

function actor(by, reason) {
  if (!by?.trim() || !reason?.trim()) throw new Error('Provide --by and --reason');
}

function folder(spec, name, number) {
  let slug = name === undefined ? spec.name : name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug || slug.length > 128) throw new Error('Folder name must produce a slug of 1–128 characters');
  if (number !== undefined) {
    if (!/^\d+$/.test(String(number)) || !Number.isSafeInteger(Number(number)) || Number(number) < 1) throw new Error('--number must be a positive safe integer');
    slug = String(Number(number)).padStart(3, '0') + '-' + slug.replace(/^\d+-/, '');
  }
  return slug;
}

function impacts(root, spec) {
  const result = [];
  const inventory = catalog.registry(root);
  const prefixes = [...new Set([spec.relative, ...catalog.AREAS.flatMap(area =>
    [spec.id, spec.name, ...(inventory.records[spec.id]?.aliases || [])].map(name => area + '/' + name))])];
  for (const item of project.specDirectories(root)) {
    if (item.id === spec.id) continue;
    let other;
    try { other = project.loadSpec(root, item.id); }
    catch (error) {
      result.push({ spec: item.id, field: 'manifest', target: item.relative, effect: 'Could not inspect this spec: ' + error.message });
      continue;
    }
    if (other.legacy || ['closed', 'cancelled'].includes(other.change.status)) continue;
    if (other.change.depends_on?.includes(spec.id)) result.push({ spec: other.id, field: 'depends_on', target: spec.id,
      effect: spec.change?.status === 'closed' ? 'Retained closure summary can satisfy the historical execution dependency; current contracts and tests still matter.' : 'Execution dependency will be unresolved; review this prerequisite before implementation.' });
    if (other.change.related?.includes(spec.id)) result.push({ spec: other.id, field: 'related', target: spec.id, effect: 'Historical link only; missing content is a warning.' });
    for (const field of ['sources', 'context', 'capabilities', 'decisions']) for (const ref of other.change[field] || []) {
      const file = typeof ref === 'string' ? ref : ref.path;
      if (prefixes.some(prefix => file?.startsWith(prefix + '/'))) result.push({ spec: other.id, field, target: file,
        effect: catalog.historical(ref) ? 'Historical source may become unavailable; warning only.'
          : 'Required reference may become unavailable. Consolidate it outside the discarded spec or revise the reference.' });
    }
  }
  return result;
}

function inspect(root) {
  const issues = [];
  const entries = project.specDirectories(root, { issues });
  const ids = new Set();
  const updates = [];
  const missing = [];
  const value = catalog.registry(root);
  for (const item of entries) {
    if (ids.has(item.id)) throw new Error('Duplicate spec identity: ' + item.id);
    ids.add(item.id);
  }
  for (const item of entries) {
    if (item.invalid) continue;
    const spec = project.loadSpec(root, item.id);
    const record = value.records[item.id];
    if (!record || record.path !== item.relative || record.status !== (spec.change?.status || 'legacy') ||
        io.digest(record.closure || null) !== io.digest(closure(spec))) {
      updates.push({ id: item.id, path: item.relative, action: record ? 'refresh-observed-location-or-state' : 'record-observed-spec' });
    }
    if (spec.legacy || ['closed', 'cancelled'].includes(spec.change.status)) continue;
    for (const dependency of spec.change.depends_on || []) {
      let target;
      try { target = catalog.dependency(root, dependency); }
      catch (error) {
        issues.push({ spec: spec.id, field: 'depends_on', target: dependency, kind: 'invalid-prerequisite', remedy: error.message });
        continue;
      }
      if (target.missing) issues.push({ spec: spec.id, field: 'depends_on', target: dependency, kind: 'unresolved-prerequisite',
        remedy: 'Restore the source if available, or inspect current code/contracts/tests and revise this dependency. Do not restart the spec or invent completion.' });
      else if (target.retained) issues.push({ spec: spec.id, field: 'depends_on', target: dependency, kind: 'retained-closure',
        remedy: 'Only a recorded historical closure remains. Use current capability contracts and the consumer acceptance checks.' });
    }
    for (const field of ['sources', 'context', 'capabilities', 'decisions']) for (const ref of spec.change[field] || []) {
      try {
        const resolved = catalog.reference(root, ref);
        if (resolved.missing) issues.push({ spec: spec.id, field, target: resolved.declared, kind: 'missing-historical-reference', remedy: 'Keep the provenance note or remove this optional historical link; no implementation blocker.' });
      } catch (error) {
        issues.push({ spec: spec.id, field, target: typeof ref === 'string' ? ref : ref?.path, kind: 'required-reference-error',
          remedy: 'Restore the source, consolidate its current contract, or revise the reference. ' + error.message });
      }
    }
  }
  for (const [id, record] of Object.entries(value.records)) {
    if (!ids.has(id) && record.availability !== 'purged' && (record.path ? !io.exists(root, record.path) : record.availability === 'missing')) {
      missing.push({ id, path: record.path, previous_status: record.status, retained_closure: Boolean(record.status === 'closed' && record.closure) });
    }
  }
  for (const id of value.ids) if (!value.records[id] && !ids.has(id)) {
    missing.push({ id, path: null, previous_status: null, retained_closure: false });
  }
  return { updates, missing, issues };
}

function closure(spec) {
  return spec.change?.closure ? Object.fromEntries(['at', 'run_id', 'validation', 'acceptance_verified', 'outcome'].map(key => [key, spec.change.closure[key] ?? null])) : null;
}

function reconcile(root, { dryRun = false } = {}) {
  const result = inspect(root);
  if (!dryRun) {
    for (const item of result.updates) catalog.remember(root, project.loadSpec(root, item.id));
    if (result.missing.length) {
      const value = catalog.registry(root);
      for (const item of result.missing) value.records[item.id] = {
        ...(value.records[item.id] || { path: null, status: 'unknown', aliases: [] }), availability: 'missing',
      };
      io.writeJson(root, catalog.REGISTRY, value);
    }
  }
  return { ...result, dry_run: dryRun, next: 'Only observed inventory metadata is reconciled. Business references, authorization and evidence are not rewritten; review the reported issues locally.' };
}

function validateDestination(root, spec, target) {
  io.resolve(root, target);
  if (io.exists(root, target)) throw new Error('Spec destination already exists: ' + target);
  const all = project.specDirectories(root, { includeTrash: true });
  const name = path.posix.basename(target);
  const value = catalog.registry(root);
  if (value.ids.some(id => id !== spec.id && id === name) || Object.entries(value.records).some(([id, record]) => id !== spec.id && record.aliases?.includes(name))) {
    throw new Error('Folder name conflicts with a reserved spec identity or alias: ' + name);
  }
  if (all.some(other => other.id !== spec.id && (other.name === name || other.id === name || value.records[other.id]?.aliases?.includes(name)))) {
    throw new Error('Folder name conflicts with another spec identity or alias: ' + name);
  }
}

function move(root, spec, target, { by, reason, type, extra = {} }) {
  validateDestination(root, spec, target);
  const previous = spec.relative;
  const inventory = io.exists(root, catalog.REGISTRY) ? io.read(root, catalog.REGISTRY) : null;
  const ignoreFile = previous + '/.gitignore';
  const previousIgnore = io.exists(root, ignoreFile) ? io.read(root, ignoreFile) : null;
  const event = history.record(root, spec, type, { by, reason, from: previous, to: target, id_preserved: spec.id });
  let moved = false;
  try {
    fs.mkdirSync(path.dirname(io.resolve(root, target)), { recursive: true });
    fs.renameSync(io.resolve(root, previous), io.resolve(root, target));
    moved = true;
    spec.relative = target;
    catalog.remember(root, spec, extra);
  } catch (error) {
    if (moved) fs.renameSync(io.resolve(root, target), io.resolve(root, previous));
    spec.relative = previous;
    const eventPath = previous + '/' + event.path;
    if (io.exists(root, eventPath)) fs.unlinkSync(io.resolve(root, eventPath));
    if (inventory !== null) io.write(root, catalog.REGISTRY, inventory);
    else if (io.exists(root, catalog.REGISTRY)) fs.unlinkSync(io.resolve(root, catalog.REGISTRY));
    if (previousIgnore !== null) fs.writeFileSync(io.resolve(root, ignoreFile), previousIgnore);
    else if (io.exists(root, ignoreFile)) fs.unlinkSync(io.resolve(root, ignoreFile));
    throw error;
  }
  return { id: spec.id, path: target, previous_path: previous, event: event.path };
}

function manage(root, operation, selector, { name, number, by, reason, permanent = false, dryRun = false } = {}) {
  actor(by, reason);
  const spec = project.loadSpec(root, selector, { includeTrash: true });
  if (spec.legacy) throw new Error('Migrate this legacy spec before changing its identity/location');
  const location = spec.relative.startsWith(catalog.TRASH + '/') ? 'trash' : spec.relative.startsWith('agents/archive/') ? 'archive' : 'active';
  const record = catalog.registry(root).records[spec.id];
  let target;
  if (operation === 'rename') {
    if (name === undefined && number === undefined) throw new Error('Provide --name and/or --number');
    if (location === 'trash') throw new Error('Restore a removed spec before renaming it');
    target = path.posix.dirname(spec.relative) + '/' + folder(spec, name, number);
  } else if (operation === 'archive') {
    if (location !== 'active') throw new Error('Only an active spec can be archived');
    target = 'agents/archive/' + spec.name;
  } else if (operation === 'restore') {
    if (location === 'active') throw new Error('Spec is already active');
    const previous = location === 'trash' ? record?.restore_path : null;
    target = previous || 'agents/specs/' + spec.name;
    if (name) target = path.posix.dirname(target) + '/' + folder(spec, name);
  } else if (operation === 'remove') {
    if (location === 'trash' && !permanent) throw new Error('Spec is already in recoverable trash; use restore or remove --permanent');
    target = location === 'trash' ? spec.relative : catalog.TRASH + '/' + spec.id + '-' + crypto.randomUUID().slice(0, 8);
  } else throw new Error('Unknown spec management operation');
  if (target === spec.relative && operation !== 'remove') throw new Error('Spec destination is unchanged');
  io.resolve(root, target);
  if (target !== spec.relative && io.exists(root, target)) throw new Error('Spec destination already exists: ' + target);
  if (target !== spec.relative) validateDestination(root, spec, target);
  const impact = impacts(root, spec);
  const result = { operation, id: spec.id, from: spec.relative, to: permanent ? null : target, permanent, dry_run: dryRun, impacts: impact };
  if (dryRun) return result;
  const extra = operation === 'remove' ? { restore_path: record?.restore_path || spec.relative, removed: { by, reason, at: new Date().toISOString() } }
    : { availability: 'present' };
  if (target !== spec.relative) move(root, spec, target, { by, reason, type: operation, extra });
  if (operation === 'remove' && permanent) {
    const value = catalog.registry(root);
    value.records[spec.id] = { ...value.records[spec.id], path: null, availability: 'purged', purged: { by, reason, at: new Date().toISOString() } };
    io.writeJson(root, catalog.REGISTRY, value);
    try { fs.rmSync(io.resolve(root, target), { recursive: true }); }
    catch (error) {
      value.records[spec.id].path = target;
      value.records[spec.id].availability = 'purge-incomplete';
      io.writeJson(root, catalog.REGISTRY, value);
      throw new Error('Permanent removal was interrupted; inspect ' + target + ': ' + error.message);
    }
  }
  return { ...result, dry_run: false, status: spec.change.status, next: 'Identity and business scope were preserved. Review affected references; current code is not rolled back or deleted.' };
}

module.exports = { manage, reconcile, inspect, impacts };
