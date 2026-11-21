'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  }
  return value;
}

function digest(value) {
  return hash(JSON.stringify(stable(value)));
}

function resolve(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\0') ||
      path.isAbsolute(relative) || /^[a-z]:/i.test(relative) || relative.includes('\\')) {
    throw new Error('Expected a relative project path: ' + relative);
  }
  const parts = relative.split('/');
  if (parts.some(p => p === '..' || p === '.git' || p === 'node_modules')) {
    throw new Error('Path is outside the allowed project scope: ' + relative);
  }
  const base = path.resolve(root);
  const target = path.resolve(base, relative);
  if (target === base || !target.startsWith(base + path.sep)) throw new Error('Unsafe path: ' + relative);
  let cursor = base;
  for (const part of path.relative(base, target).split(path.sep)) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) {
      throw new Error('Symbolic links are not followed: ' + relative);
    }
  }
  return target;
}

function exists(root, relative) {
  return fs.existsSync(resolve(root, relative));
}

const MAX_READ = 2 * 1024 * 1024;
// shortcut: whole-file read, no streaming; raise only if references beyond 64 MiB are needed.
const MAX_REFERENCE_READ = 64 * 1024 * 1024;

function read(root, relative, limit = MAX_READ) {
  const file = resolve(root, relative);
  const stat = fs.statSync(file);
  if (!stat.isFile()) throw new Error('Expected a regular file: ' + relative);
  if (stat.size > limit) throw new Error('File exceeds ' + limit / 1024 / 1024 + ' MiB: ' + relative);
  return fs.readFileSync(file, 'utf8');
}

function write(root, relative, content, { exclusive = false } = {}) {
  const file = resolve(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (exclusive) {
    fs.writeFileSync(file, content, { flag: 'wx' });
    return;
  }
  const temporary = file + '.sdd-' + crypto.randomUUID() + '.tmp';
  try {
    fs.writeFileSync(temporary, content, { flag: 'wx' });
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function json(root, relative) {
  return JSON.parse(read(root, relative));
}

function writeJson(root, relative, value, options) {
  write(root, relative, JSON.stringify(value, null, 2) + '\n', options);
}

function walk(root, relative = '', skip = () => false) {
  const directory = relative ? resolve(root, relative) : root;
  if (!fs.existsSync(directory)) return [];
  const files = [];
  for (const item of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = relative ? relative + '/' + item.name : item.name;
    if (skip(rel, item)) continue;
    if (item.isSymbolicLink()) throw new Error('Symbolic links are not followed: ' + rel);
    if (item.isDirectory()) files.push(...walk(root, rel, skip));
    else if (item.isFile()) files.push(rel);
    if (files.length > 20000) throw new Error('Project scan exceeds 20,000 files; configure verification.exclude.');
  }
  return files;
}

function locked(root, action) {
  const relative = 'agents/.sdd/lock';
  const file = resolve(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let descriptor;
  try {
    descriptor = fs.openSync(file, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Another SDD mutation holds agents/.sdd/lock. If interrupted, confirm no SDD process is running before removing it.');
    throw error;
  }
  fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid, started: new Date().toISOString() }));
  const release = () => { fs.closeSync(descriptor); fs.unlinkSync(file); };
  try {
    const result = action();
    if (result && typeof result.then === 'function') return result.finally(release);
    release();
    return result;
  } catch (error) {
    release();
    throw error;
  }
}

module.exports = { MAX_REFERENCE_READ, hash, digest, stable, resolve, exists, read, write, json, writeJson, walk, locked };
