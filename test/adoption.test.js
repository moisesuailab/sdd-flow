'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const io = require('../lib/io');
const md = require('../lib/markdown');
const project = require('../lib/project');
const { install } = require('../lib/install');
const { check, approve } = require('../lib/check');
const { verify, runCheck } = require('../lib/verification');
const { fixture, editConfig } = require('../test-support/project');

test('a new project can start from a stated goal without PRD/ADR files or generated feature code', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-greenfield-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  install(root);
  const spec = project.createSpec(root, 'Organizar solicitações', 'light');
  io.write(root, spec.relative + '/SPEC.md', md.markdown({
    schema_version: 2, artifact: 'spec', id: spec.id,
    requirements: [{ id: 'REQ01', description: 'Registrar uma solicitação com título e estado inicial.' }],
    acceptance: [{ id: 'AC01', covers: ['REQ01'], description: 'Dado um título válido, ao registrar, surge uma solicitação no estado inicial.', method: 'inspection' }],
  }, '# Organizar solicitações\n\n## Origem\n\nObjetivo informado pelo usuário, sem PRD formal.'));
  assert.equal(check(root, spec.id).valid, true);
  assert.equal(io.exists(root, 'src'), false);
  assert.equal(io.exists(root, 'PRD.md'), false);
  assert.equal(io.exists(root, 'ADR.md'), false);
  assert.equal(project.loadSpec(root, spec.id).change.approval, null);
});

test('adoption and repeated setup installation preserve application code and existing product sources', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-adopt-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const existing = {
    'package.json': '{"name":"existing-app","version":"1.0.0","private":true}',
    'src/service.js': 'exports.existing = () => "preserved";\n',
    'docs/product.md': '# Regras vigentes\n\nManter autorização e histórico.\n',
    'docs/design.md': '# Design system\n\nTokens existentes e componentes aprovados.\n',
    'AGENTS.md': '# Existing team instructions\nPreserve the API contract.\n',
  };
  for (const [file, content] of Object.entries(existing)) io.write(root, file, content);
  install(root);
  const entry = io.read(root, 'AGENTS.md');
  install(root, { update: true });
  for (const [file, content] of Object.entries(existing)) {
    if (file === 'AGENTS.md') assert.equal(io.read(root, file), entry);
    else assert.equal(io.read(root, file), content);
  }
  assert.match(entry, /Preserve the API contract/);
  assert.equal(project.specDirectories(root).length, 0);
});

test('consumer regression checks detect a shared-code side effect even when the isolated unit test passes', async t => {
  const { root, spec } = fixture(t);
  io.write(root, 'consumer.js', 'const { add } = require("./arithmetic"); exports.balance = () => add(-2, 3);\n');
  io.write(root, 'consumer.test.js', 'const {test}=require("node:test"); const assert=require("node:assert/strict"); const {balance}=require("./consumer"); test("consumer balance contract",()=>assert.equal(balance(),1));\n');
  editConfig(root, cfg => { cfg.checks[0].command = 'node --test arithmetic.test.js consumer.test.js'; });
  approve(root, spec.id, 'Reviewer');
  assert.equal((await verify(root, spec.id)).verdict, 'passed');
  io.write(root, 'arithmetic.js', 'exports.add = (a, b) => Math.abs(a) + b;\n');
  const isolated = await runCheck(root, { name: 'isolated', command: 'node --test arithmetic.test.js', timeout_ms: 10000 });
  assert.equal(isolated.result, 'passed');
  const regression = await verify(root, spec.id);
  assert.equal(regression.verdict, 'failed');
  assert.match(io.read(root, spec.relative + '/' + regression.checks[0].log), /consumer balance contract/);
  assert.notEqual(regression.checks[0].exit_code, 0);
});
