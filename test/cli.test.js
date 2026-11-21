'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const YAML = require('yaml');
const io = require('../lib/io');
const md = require('../lib/markdown');
const { fixture, cli } = require('../test-support/project');

test('CLI exposes strict arguments, JSON diagnostics and nonzero check failure', t => {
  const { root, spec } = fixture(t);
  const valid = cli(root, ['check', spec.id, '--json']);
  assert.equal(valid.status, 0, valid.stderr);
  assert.equal(JSON.parse(valid.stdout).valid, true);
  const unapproved = cli(root, ['check', spec.id, '--phase', 'implement', '--json']);
  assert.equal(unapproved.status, 1);
  assert.equal(JSON.parse(unapproved.stdout).valid, false);
  for (const args of [['new', 'feature', '--unknown'], ['new', 'feature', '--scope', 'partial'], ['doctor', 'extra'], ['harness', 'invalid']]) {
    const result = cli(root, [...args, '--json']);
    assert.equal(result.status, 1);
    assert.ok(JSON.parse(result.stdout).error);
  }
});

test('CLI context budget: warn exits 0, strict exits 1, inspect exits 0, invalid mode rejected', t => {
  const { root, spec } = fixture(t);
  io.write(root, 'domain.md', 'x'.repeat(12000));
  spec.change.context = ['domain.md'];
  require('../lib/project').writeChange(root, spec);
  const base = ['context', spec.id, '--max-bytes', '1024', '--json'];
  const warned = cli(root, base);
  assert.equal(warned.status, 0, warned.stderr);
  assert.equal(JSON.parse(warned.stdout).fits_budget, false);
  const strict = cli(root, [...base, '--budget-mode', 'strict']);
  assert.equal(strict.status, 1);
  assert.match(strict.stdout, /CONTEXT_BUDGET_EXCEEDED|exceeds budget/);
  assert.equal(cli(root, [...base, '--budget-mode', 'strict', '--inspect']).status, 0);
  assert.equal(cli(root, [...base, '--budget-mode', 'loose']).status, 1);
});

test('mutations are serialized while readers remain available', t => {
  const { root, spec } = fixture(t);
  io.write(root, 'agents/.sdd/lock', '{"pid":123,"started":"test"}');
  const mutation = cli(root, ['new', 'concurrent', '--json']);
  assert.equal(mutation.status, 1);
  assert.match(mutation.stdout, /Another SDD mutation/);
  assert.equal(cli(root, ['context', spec.id, '--task', 'T01', '--json']).status, 0);
});

test('CLI partial verification exits 2 and reports pending manual evidence honestly', t => {
  const { root, spec } = fixture(t, { mode: 'light', method: 'manual' });
  const approval = cli(root, ['approve', spec.id, '--by', 'Reviewer', '--json']);
  assert.equal(approval.status, 0, approval.stderr);
  const result = cli(root, ['verify', spec.id, '--json']);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(JSON.parse(result.stdout).criteria[0].result, 'not_run');
});

test('published tarball contains a runnable CLI, maintained parser and native exports', { timeout: 60000 }, t => {
  const repository = path.join(__dirname, '..');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-package-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  function npm(args, cwd) {
    // A parent npm publish --dry-run exports npm_config_dry_run=true to lifecycle tests.
    // This smoke test must still create and install its isolated temporary artifact.
    args = [...args, '--dry-run=false', '--cache', path.join(temporary, 'npm-cache')];
    const result = process.env.npm_execpath
      ? spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, encoding: 'utf8', timeout: 30000 })
      : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd, encoding: 'utf8', shell: process.platform === 'win32', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr || String(result.error));
    return result;
  }
  const packed = npm(['pack', '--json', '--ignore-scripts', '--pack-destination', temporary], repository);
  const manifest = JSON.parse(packed.stdout)[0];
  assert.ok(manifest.files.some(file => file.path === 'lib/verification.js'));
  assert.ok(manifest.files.some(file => file.path === 'templates/agents/prompts/rpi-close.md'));
  for (const included of ['README.pt-BR.md', 'CONTRIBUTING.md', 'docs/usage.pt-BR.md', 'docs/releases.pt-BR.md', 'docs/quality-gates.pt-BR.md', 'docs/setup-documents.pt-BR.md', 'lib/documents.js', 'lib/handoff.js', 'lib/quality.js', 'templates/agents/QUALITY.md', 'templates/agents/POLICIES.md', 'templates/agents/prompts/intake.md']) {
    assert.ok(manifest.files.some(file => file.path === included), 'Missing distributable: ' + included);
  }
  assert.equal(manifest.files.some(file => file.path.startsWith('test/') || file.path.includes('.hooks/')), false);
  const consumer = path.join(temporary, 'consumer');
  fs.mkdirSync(consumer);
  fs.writeFileSync(path.join(consumer, 'package.json'), '{"name":"sdd-smoke","version":"1.0.0","private":true}');
  // A fresh npm ci caches tarballs, but may not cache registry version metadata.
  // Supply the installed parser as a local tarball so this smoke test is truly offline.
  const parser = path.dirname(require.resolve('yaml/package.json'));
  const dependency = JSON.parse(npm(['pack', parser, '--json', '--ignore-scripts', '--pack-destination', temporary], repository).stdout)[0];
  npm(['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', path.join(temporary, dependency.filename), path.join(temporary, manifest.filename)], consumer);
  const installed = path.join(consumer, 'node_modules', 'sdd-flow', 'bin', 'cli.js');
  const workspace = path.join(temporary, 'project with spaces');
  fs.mkdirSync(workspace);
  const initialized = spawnSync(process.execPath, [installed, 'init', '--harness', 'claude-code', '--json'], { cwd: workspace, encoding: 'utf8' });
  assert.equal(initialized.status, 0, initialized.stderr);
  assert.ok(fs.existsSync(path.join(workspace, '.claude/skills/sdd-flow/SKILL.md')));
  const references = spawnSync(process.execPath, [installed, 'docs', '--types', 'ds,adr', '--json'], { cwd: workspace, encoding: 'utf8' });
  assert.equal(references.status, 0, references.stderr || references.stdout);
  assert.ok(fs.existsSync(path.join(workspace, 'docs/design-system.md')));
  assert.equal(md.load(workspace, 'docs/adr/_template.md').data.status, 'proposed');
  const created = spawnSync(process.execPath, [installed, 'new', 'smoke', '--mode', 'light', '--json'], { cwd: workspace, encoding: 'utf8' });
  assert.equal(created.status, 0, created.stderr);
  assert.equal(JSON.parse(created.stdout).id, '001-smoke');
  for (const args of [
    ['rename', '001-smoke', '--name', 'renamed', '--number', '8'],
    ['archive', '001-smoke'], ['restore', '001-smoke'],
    ['remove', '001-smoke'], ['restore', '001-smoke'],
  ]) {
    const managed = spawnSync(process.execPath, [installed, ...args, '--by', 'Tester', '--reason', 'Installed package exercise', '--json'], { cwd: workspace, encoding: 'utf8' });
    assert.equal(managed.status, 0, managed.stdout || managed.stderr);
  }
  assert.equal(YAML.parse(fs.readFileSync(path.join(workspace, 'agents/specs/008-renamed/change.yaml'), 'utf8')).id, '001-smoke');
});
