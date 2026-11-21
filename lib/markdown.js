'use strict';

const YAML = require('yaml');
const io = require('./io');

function parseYaml(source, label = 'YAML') {
  const document = YAML.parseDocument(source, { uniqueKeys: true, strict: true, schema: 'core' });
  if (document.errors.length || document.warnings.length) {
    throw new Error(label + ': ' + [...document.errors, ...document.warnings].map(e => e.message).join('; '));
  }
  let result;
  try { result = document.toJS({ maxAliasCount: 0 }); }
  catch (error) { throw new Error(label + ': ' + error.message); }
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error(label + ': expected a mapping');
  function inspect(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error(label + ': reserved key ' + key);
      inspect(child);
    }
  }
  inspect(result);
  return result;
}

function parseMarkdown(source, label = 'Markdown', required = true) {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    if (required) throw new Error(label + ': missing YAML front matter; run sdd migrate for legacy specs');
    return { data: {}, body: normalized, legacy: true };
  }
  let end = normalized.indexOf('\n---\n', 4);
  if (end < 0 && normalized.endsWith('\n---')) end = normalized.length - 4;
  if (end < 0) throw new Error(label + ': unclosed front matter');
  if (end > 65536) throw new Error(label + ': front matter exceeds 64 KiB');
  return { data: parseYaml(normalized.slice(4, end), label), body: normalized.slice(end + 5).replace(/^\n/, ''), legacy: false };
}

function markdown(data, body) {
  return '---\n' + YAML.stringify(data, { lineWidth: 0, aliasDuplicateObjects: false }).trimEnd() + '\n---\n\n' + body.trim() + '\n';
}

function load(root, relative, required = true, limit) {
  return parseMarkdown(io.read(root, relative, limit), relative, required);
}

function section(body, heading, label) {
  const lines = body.split('\n');
  let start = -1;
  let level = 0;
  let fenced = false;
  let fenceCharacter;
  let fenceLength;
  for (let index = 0; index < lines.length; index++) {
    const fence = lines[index].match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (!fenced) { fenced = true; fenceCharacter = fence[1][0]; fenceLength = fence[1].length; }
      else if (fence[1][0] === fenceCharacter && fence[1].length >= fenceLength) fenced = false;
      continue;
    }
    if (fenced) continue;
    const match = lines[index].match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;
    if (start >= 0 && match[1].length <= level) return lines.slice(start, index).join('\n').trim();
    if (match[2] === heading) { start = index; level = match[1].length; }
  }
  if (start < 0) throw new Error(label + ': heading not found: ' + heading);
  return lines.slice(start).join('\n').trim();
}

module.exports = { parseYaml, parseMarkdown, markdown, load, section };
