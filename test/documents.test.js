'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const io = require('../lib/io');
const md = require('../lib/markdown');
const project = require('../lib/project');
const documents = require('../lib/documents');
const { install } = require('../lib/install');
const { editConfig, cli } = require('../test-support/project');

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-documents-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('reference documents remain optional and init --docs restores the three legacy references without overwriting them', t => {
  const root = workspace(t);
  assert.equal(cli(root, ['init', '--json']).status, 0);
  assert.equal(io.exists(root, 'docs'), false);
  io.write(root, 'docs/prd.md', '# Actual product requirements\nKeep the authorized scope.');
  const result = cli(root, ['init', '--docs', '--json']);
  assert.equal(result.status, 0, result.stdout || result.stderr);
  assert.equal(io.read(root, 'docs/prd.md'), '# Actual product requirements\nKeep the authorized scope.');
  assert.equal(io.exists(root, 'docs/roadmap.md'), true);
  assert.equal(io.exists(root, 'docs/architecture.md'), true);
  assert.equal(io.exists(root, 'docs/design-system.md'), false);
  assert.equal(project.specDirectories(root).length, 0);
});

test('selected DS/ADR references preserve Portuguese accents, standard metadata and existing decision records', t => {
  const root = workspace(t);
  install(root);
  editConfig(root, cfg => { cfg.documentation.language = 'pt-BR'; });
  io.write(root, 'docs/adr/0001-existing.md', '# Existing decision\nOriginal rationale.');
  const result = cli(root, ['docs', '--types', 'ds,adr', '--json']);
  assert.equal(result.status, 0, result.stdout);
  assert.match(io.read(root, 'docs/design-system.md'), /Acessibilidade e responsividade/);
  const template = md.load(root, 'docs/adr/_template.md');
  assert.equal(template.data.kind, 'decision');
  assert.equal(template.data.status, 'proposed');
  assert.match(template.body, /Contexto/);
  assert.match(template.body, /Consequências/);
  assert.equal(io.read(root, 'docs/adr/0001-existing.md'), '# Existing decision\nOriginal rationale.');
  assert.equal(io.exists(root, 'docs/prd.md'), false);
  assert.equal(io.exists(root, 'docs/architecture.md'), false);
  assert.equal(project.specDirectories(root).length, 0);
});

test('document dry runs and invalid type selections do not create project documents', t => {
  const root = workspace(t);
  const before = fs.readdirSync(root);
  const preview = cli(root, ['docs', '--types', 'prd,sd,ds,adr', '--dry-run', '--json']);
  assert.equal(preview.status, 0, preview.stdout);
  assert.deepEqual(fs.readdirSync(root), before);
  assert.ok(JSON.parse(preview.stdout).files.some(item => item.path === 'docs/design-system.md'));
  const invalid = cli(root, ['docs', '--types', 'invented', '--dry-run', '--json']);
  assert.equal(invalid.status, 1);
  assert.deepEqual(fs.readdirSync(root), before);
});

test('a reference path collision is detected before any new document is written', t => {
  const root = workspace(t);
  fs.mkdirSync(io.resolve(root, 'docs/design-system.md'), { recursive: true });
  assert.throws(() => documents.scaffold(root, { types: 'prd,sd,ds' }), /regular file/);
  assert.equal(io.exists(root, 'docs/prd.md'), false);
  assert.equal(io.exists(root, 'docs/README.md'), false);
  const blocked = workspace(t);
  io.write(blocked, 'docs', 'An existing ordinary file.');
  assert.throws(() => documents.scaffold(blocked), /directory/);
  assert.equal(io.read(blocked, 'docs'), 'An existing ordinary file.');
});

test('repeated document scaffolding preserves all user edits while permitting additional selected references', t => {
  const root = workspace(t);
  documents.scaffold(root, { types: 'prd' });
  io.write(root, 'docs/README.md', '# Existing documentation index\nTeam navigation.');
  io.write(root, 'docs/prd.md', '# Revised requirements\nActual business rules.');
  const result = documents.scaffold(root, { types: 'prd,sd,ds' });
  assert.equal(io.read(root, 'docs/README.md'), '# Existing documentation index\nTeam navigation.');
  assert.equal(io.read(root, 'docs/prd.md'), '# Revised requirements\nActual business rules.');
  assert.equal(result.files.find(item => item.path === 'docs/prd.md').action, 'preserve');
  assert.equal(io.exists(root, 'docs/architecture.md'), true);
  assert.equal(io.exists(root, 'docs/design-system.md'), true);
});
