'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { AsyncLocalStorage } = require('node:async_hooks');
const localWarnings = new AsyncLocalStorage();
const PRIVATE_ROOT = 'agents/.sdd/private';
const normalized = file => path.posix.normalize(file).replace(/\/+$/, '');

const PATTERNS = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----[\s\S]*?(?:-----END [^-]*PRIVATE KEY-----|$)/g],
  ['provider-token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-(?:proj-|ant-api\d+-)?[A-Za-z0-9_-]{20,}|(?:AKIA|ASIA)[A-Z0-9]{16})\b/g],
  ['authorization-token', /\b(?:Proxy-)?Authorization["']?\s*[:=]\s*["']?(?:Bearer|Basic)[ \t]+[A-Za-z0-9._~+/=-]{4,}/gi],
  ['registry-token', /_authToken\s*=\s*([^\s"']+)/gi],
  ['cookie-header', /\b(?:Cookie|Set-Cookie)["']?[ \t]*:[ \t]*([^\r\n]+)/gi],
  ['url-credentials', /(?<![a-z0-9+.-])[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/gi],
  ['jwt', /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g],
];
const sensitiveKey = key => /^[a-z0-9_-]+$/i.test(key) && /(?:^|[_-])(?:password|passwd|api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key|secret|token)$/i.test(key);
const headerKey = key => /^(?:(?:proxy-)?authorization|(?:set-)?cookie|_authToken)$/i.test(key);
const fieldText = (key, value) => sensitiveKey(key) || /^_authToken$/i.test(key) ? key + '=' + value : headerKey(key) ? key + ': ' + value : value;
const placeholder = value => /^(?:\[REDACTED\]|<[^>]+>|\$\{|\$[A-Za-z_]|%[A-Za-z_][A-Za-z0-9_]*%|process\.env\.|os\.environ|env:)/i.test(value) || /^(?:example|dummy|placeholder|changeme|not[-_]set|undefined|null|true|false|string|number|boolean)$/i.test(value);
const ASSIGNMENT = /(?<![a-z0-9_-])([a-z0-9_-]+)["']?[ \t]*([:=])[ \t]*/gi;
const BARE_END = /[\s"'`,;}\]]/;
const REQUIREMENT_PROSE = /^(?:(?:must|should|shall|deve|dever[aá]|precisa)\s+[\p{L}]+\b|(?:expires?|expira)\s+(?:after|in|ap[oó]s|em)\b|(?:stored|obtained|provided)\s+(?:in|from|by)\b|(?:definid[oa]|armazenad[oa])\s+(?:em|no|na|por)\b|(?:minimum|maximum)\s+(?:length|size)\b)/iu;
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ROOT_ARTIFACTS = ['AGENTS.md', 'CLAUDE.md', 'QUICKSTART.md', 'README.md', 'README.pt-BR.md'];
const workflowPath = file => ROOT_ARTIFACTS.includes(file) || /^(?:agents|docs|\.claude|\.opencode)\//.test(file);

function environmentSecrets() {
  return Object.entries(process.env).filter(([key, value]) => /TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY|CREDENTIAL|DATABASE_URL/i.test(key) && value.length >= 8)
    .map(([, value]) => value).sort((a, b) => b.length - a.length);
}

function matches(text) {
  const found = [];
  for (const [kind, pattern] of PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      if (kind === 'registry-token' && placeholder(match[1])) continue;
      if (kind === 'cookie-header') {
        const parts = /^set-cookie/i.test(match[0]) ? match[1].split(';', 1) : match[1].split(';');
        if (!parts.some(part => {
          const pair = part.trim().replace(/^["']/, '').match(/^[!#$%&'*+.^_`|~a-z0-9-]+\s*=\s*(.+)$/i);
          return pair && !placeholder(pair[1].replace(/["']$/, ''));
        })) continue;
      }
      found.push({ kind, start: match.index, end: match.index + match[0].length });
    }
  }
  ASSIGNMENT.lastIndex = 0;
  let assignment;
  while ((assignment = ASSIGNMENT.exec(text)) !== null) {
    const match = assignment;
    if (!sensitiveKey(match[1])) continue;
    let cursor = match.index + match[0].length;
    const quote = text[cursor] === '"' || text[cursor] === "'" ? text[cursor++] : null;
    const start = cursor;
    while (cursor < text.length && text[cursor] !== '\n' && text[cursor] !== '\r') {
      if (quote ? text[cursor] === quote : BARE_END.test(text[cursor])) break;
      if (quote && text[cursor] === '\\' && cursor + 1 < text.length) cursor++;
      cursor++;
    }
    const value = text.slice(start, cursor);
    const end = cursor + (quote && text[cursor] === quote ? 1 : 0);
    ASSIGNMENT.lastIndex = end;
    if (value.length < 4 || placeholder(value)) continue;
    if (!quote && match[2] === ':' && REQUIREMENT_PROSE.test(text.slice(start, start + 160).split(/\r?\n/, 1)[0])) continue;
    found.push({ kind: 'credential-assignment', start: match.index, end });
  }
  for (const value of environmentSecrets()) for (const match of text.matchAll(new RegExp(escape(value), 'g'))) {
    found.push({ kind: 'environment-secret', start: match.index, end: match.index + value.length });
  }
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  let cursor = 0;
  let line = 1;
  for (const match of found) {
    while (cursor < match.start) if (text.charCodeAt(cursor++) === 10) line++;
    match.line = line;
  }
  return found;
}

function redact(value) {
  const text = String(value);
  const ranges = matches(text);
  let result = '';
  let end = 0;
  for (const range of ranges) {
    if (range.end <= end) continue;
    if (range.start > end) result += text.slice(end, range.start);
    result += '[REDACTED]';
    end = range.end;
  }
  return result + text.slice(end);
}

function sanitize(value) {
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [redact(key),
    typeof item === 'string' && ((sensitiveKey(key) && item.length >= 4 && !placeholder(item)) || (headerKey(key) && matches(fieldText(key, item)).length)) ? '[REDACTED]' : sanitize(item)]));
  return value;
}

function inspect(value) {
  const findings = [];
  const visit = (item, key = '') => {
    if (typeof item === 'string') findings.push(...matches(fieldText(key, item)));
    else if (item && typeof item === 'object') for (const [name, child] of Object.entries(item)) visit(child, name);
  };
  visit(value);
  return findings;
}

function assertSafe(value) {
  const findings = inspect(value);
  if (findings.length) {
    const error = new Error('Potential credential in workflow artifact (' + [...new Set(findings.map(x => x.kind))].join(', ') + '). Use environment references or synthetic placeholders; no sensitive value is shown.');
    error.code = 'SENSITIVE_ARTIFACT';
    throw error;
  }
}

function local(root, value, file = 'local workflow operation') {
  const findings = inspect(value);
  if (!findings.length) return [];
  let mode = 'warn';
  const io = require('./io');
  if (io.exists(root, 'agents/config.yaml')) {
    try { mode = require('./markdown').parseYaml(io.read(root, 'agents/config.yaml')).privacy?.local_mode || mode; }
    catch { /* Allow local setup/config repair; normal command validation still reports invalid configuration. */ }
  }
  if (mode === 'strict') assertSafe(value);
  const warnings = [...new Set(findings.map(item => item.kind))].map(kind => ({
    path: redact(file), kind, message: 'Potential credential; local work continued without changing the source. Review before sharing; use private material or environment references.',
  }));
  const scope = localWarnings.getStore();
  if (scope?.root === root) for (const warning of warnings) scope.warnings.set(warning.path + ':' + warning.kind, warning);
  return warnings;
}

async function collect(root, action) {
  const scope = { root, warnings: new Map() };
  const result = await localWarnings.run(scope, action);
  return { result, warnings: [...scope.warnings.values()] };
}

function sensitivePath(file, extra = []) {
  file = normalized(file);
  const name = path.posix.basename(file).toLowerCase();
  return extra.some(value => { const prefix = normalized(value); return file === prefix || file.startsWith(prefix + '/'); }) || /^\.env(?:\.|$)/.test(name) && !/^\.env\.(?:example|sample|template)$/.test(name) ||
    /\.(?:pem|key|p12|pfx|keystore)$/.test(name) || ['.netrc', '.pypirc', '.git-credentials'].includes(name) || /^(?:credentials|secrets?)(?:\.|$)/.test(name) || /(?:^|\/)(?:\.ssh|\.aws|\.gnupg)(?:\/|$)/.test(file);
}

function confidentialPath(file, root) {
  file = normalized(file);
  const extra = root ? require('./project').config(root).privacy?.sensitive_paths || [] : [];
  return file === PRIVATE_ROOT || file.startsWith(PRIVATE_ROOT + '/') || extra.some(value => { const prefix = normalized(value); return file === prefix || file.startsWith(prefix + '/'); });
}

function privatePath(file) {
  file = normalized(file);
  const sharedInventory = /^agents\/\.sdd\/(?:(?:registry|installed|adapters)\.json|\.gitignore)$/.test(file);
  return /(?:^|\/)\.sdd\//.test(file) && !sharedInventory || /^agents\/(?:specs|archive)\/[^/]+\/(?:runs|history)\//.test(file) ||
    /^agents\/(?:specs|archive)\/[^/]+\/(?:verification|EVIDENCE[^/]*|HANDOFF[^/]*)\.json$/.test(file);
}

function assertReference(file, root) {
  file = normalized(file);
  const central = file.startsWith(PRIVATE_ROOT + '/');
  if (sensitivePath(file) || privatePath(file) && !central) throw new Error('Private credential/runtime files cannot be selected as context sources. Use environment references; confidential documents belong in the private area.');
}

function assertSharedSource(file, root) {
  if (sensitivePath(file) || privatePath(file) || confidentialPath(file, root)) throw new Error('Private material cannot be exported for sharing: ' + redact(file));
}

function guardWrite(file, content, root) {
  file = normalized(file);
  if (!workflowPath(file) || privatePath(file)) return;
  if (!root) { assertSafe(file); assertSafe(content); return; }
  local(root, file, file);
  local(root, content, file);
}

function ensureIgnored(root, file) {
  file = normalized(file);
  if (/^agents\/\.sdd\/(?:backups|trash|private|lock)(?:\/|$)/.test(file)) {
    const fs = require('node:fs');
    const io = require('./io');
    const target = io.resolve(root, 'agents/.sdd/.gitignore');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const previous = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    const missing = ['/backups/', '/trash/', '/private/', '/lock'].filter(pattern => !previous.split(/\r?\n/).includes(pattern));
    if (missing.length) fs.writeFileSync(target, previous + (previous && !previous.endsWith('\n') ? '\n' : '') + missing.join('\n') + '\n');
    return;
  }
  const match = file.match(/^(agents\/(?:specs|archive)\/[^/]+)\/(.+)$/);
  if (!match || !privatePath(file)) return;
  const fs = require('node:fs');
  const io = require('./io');
  const folder = match[1];
  const ignore = io.resolve(root, folder + '/.gitignore');
  const previous = fs.existsSync(ignore) ? fs.readFileSync(ignore, 'utf8') : '';
  const patterns = ['/.sdd/', '/history/', '/runs/', '/verification.json', '/EVIDENCE*.json', '/HANDOFF*.json'];
  const missing = patterns.filter(pattern => !previous.split(/\r?\n/).includes(pattern));
  if (missing.length) fs.writeFileSync(ignore, previous + (previous && !previous.endsWith('\n') ? '\n' : '') + missing.join('\n') + '\n');
}

function scan(root, { staged = false } = {}) {
  const io = require('./io');
  const extra = io.exists(root, 'agents/config.yaml') ? require('./project').config(root).privacy?.sensitive_paths || [] : [];
  const args = staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-files', '-z'];
  const listed = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  let files;
  const indexed = listed.status === 0;
  if (!indexed && staged) throw new Error('Staged privacy inspection requires an available Git repository');
  if (indexed) files = listed.stdout.split('\0').filter(Boolean);
  else files = [...ROOT_ARTIFACTS.filter(file => io.exists(root, file)), ...['agents', 'docs'].flatMap(folder => io.walk(root, folder, (rel, entry) => entry.isDirectory() && rel.includes('/.sdd')))];
  const findings = [];
  for (const file of files.filter(file => workflowPath(file) || path.posix.basename(file) === '.npmrc' || sensitivePath(file, extra))) {
    if (privatePath(file) || sensitivePath(file, extra)) {
      if (indexed || !privatePath(file)) findings.push({ path: redact(file), line: 0, kind: indexed ? 'private-file-in-index' : 'sensitive-path' });
      continue;
    }
    let content;
    if (indexed) {
      const result = spawnSync('git', ['show', ':' + file], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      if (result.status !== 0) throw new Error('Cannot inspect indexed artifact; review its size and Git state');
      content = result.stdout;
    } else content = io.read(root, file, io.MAX_REFERENCE_READ);
    for (const match of matches(content)) findings.push({ path: redact(file), line: match.line, kind: match.kind });
  }
  return { valid: findings.length === 0, indexed, staged, findings,
    limitations: 'Heuristic inspection; it does not detect every secret or personal/business-sensitive datum. Review the staged diff. Ignore rules do not untrack previously committed files.' };
}

module.exports = { PRIVATE_ROOT, matches, redact, sanitize, assertSafe, local, collect, sensitivePath, confidentialPath, privatePath, assertReference, assertSharedSource, guardWrite, ensureIgnored, scan };
