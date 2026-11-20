'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const io = require('../lib/io');
const project = require('../lib/project');
const { approve, check } = require('../lib/check');
const lifecycle = require('../lib/verification');
const { fixture, editMarkdown, editConfig, cli } = require('../test-support/project');

test('automated verification executes actual regression tests and closes with archival', async t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  const receipt = await lifecycle.verify(root, spec.id);
  assert.equal(receipt.verdict, 'passed');
  assert.equal(receipt.checks[0].exit_code, 0);
  assert.match(io.read(root, spec.relative + '/' + receipt.checks[0].log), /AC01 addition/);
  const closed = lifecycle.close(root, spec.id, { by: 'Reviewer', note: 'Local behavior; no lasting contract changed.', archive: true });
  assert.equal(closed.status, 'closed');
  assert.match(closed.path, /agents\/archive/);
  assert.equal(lifecycle.currentReceipt(root, project.loadSpec(root, spec.id)).verdict, 'passed');
  const next = project.createSpec(root, 'next', 'light');
  assert.match(next.id, /^002-/);
});

test('a failing real test cannot produce a passing receipt or close the change', async t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  io.write(root, 'arithmetic.js', 'exports.add = (a, b) => a - b;\n');
  const receipt = await lifecycle.verify(root, spec.id);
  assert.equal(receipt.verdict, 'failed');
  assert.notEqual(receipt.checks[0].exit_code, 0);
  assert.throws(() => lifecycle.close(root, spec.id, { by: 'Reviewer', note: 'No lasting contract.' }), /full passed/);
});

test('source and acceptance changes invalidate prior verification rather than reusing it', async t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  await lifecycle.verify(root, spec.id);
  io.write(root, 'untracked-integration.js', 'exports.enabled = true;\n');
  assert.throws(() => lifecycle.currentReceipt(root, project.loadSpec(root, spec.id)), /stale/);
  await lifecycle.verify(root, spec.id);
  editMarkdown(root, spec.relative + '/SPEC.md', data => { data.acceptance[0].description = 'New expected behavior.'; });
  assert.throws(() => lifecycle.currentReceipt(root, project.loadSpec(root, spec.id)), /stale/);
});

test('partial verification is allowed with pending tasks, but cannot close', async t => {
  const { root, spec } = fixture(t);
  editMarkdown(root, spec.relative + '/TASK.md', data => { data.tasks[0].status = 'pending'; });
  approve(root, spec.id, 'Reviewer');
  assert.equal(check(root, spec.id, { final: true }).valid, false);
  const receipt = await lifecycle.verify(root, spec.id, { scope: 'partial' });
  assert.equal(receipt.verdict, 'partial');
  assert.throws(() => lifecycle.close(root, spec.id, { by: 'Reviewer', note: 'No lasting contract.' }), /unfinished/);
});

test('manual and inspection evidence can genuinely pass and close without an automated framework', async t => {
  for (const method of ['manual', 'inspection']) {
    const { root, spec } = fixture(t, { mode: 'light', method });
    approve(root, spec.id, 'Reviewer');
    const partial = await lifecycle.verify(root, spec.id);
    assert.equal(partial.verdict, 'partial');
    const template = lifecycle.evidenceTemplate(root, spec.id);
    template.cases[0] = { ...template.cases[0], result: 'passed', by: 'Reviewer', at: new Date().toISOString(), notes: 'Observed 2 + 3 = 5.' };
    io.writeJson(root, template.path, template);
    const receipt = await lifecycle.verify(root, spec.id, { evidence: template.path });
    assert.equal(receipt.verdict, 'passed');
    assert.equal(receipt.criteria[0].method, method);
    assert.equal(lifecycle.close(root, spec.id, { by: 'Reviewer', note: 'No contract changes.' }).status, 'closed');
  }
});

test('manual evidence is rejected after source changes or when reviewer/result is fabricated structurally', async t => {
  const { root, spec } = fixture(t, { method: 'manual' });
  approve(root, spec.id, 'Reviewer');
  const template = lifecycle.evidenceTemplate(root, spec.id);
  template.cases[0].result = 'passed';
  io.writeJson(root, template.path, template);
  await assert.rejects(lifecycle.verify(root, spec.id, { evidence: template.path }), /by, at and notes/);
  io.write(root, 'arithmetic.js', 'exports.add = (a, b) => Number(a) + Number(b);\n');
  await assert.rejects(lifecycle.verify(root, spec.id, { evidence: template.path }), /stale/);
});

test('regenerating evidence preserves previous observations and returns a new usable path', t => {
  const { root, spec } = fixture(t, { method: 'manual' });
  const first = lifecycle.evidenceTemplate(root, spec.id);
  const bytes = io.read(root, first.path);
  const second = lifecycle.evidenceTemplate(root, spec.id);
  assert.notEqual(first.path, second.path);
  assert.equal(io.read(root, first.path), bytes);
  assert.ok(io.exists(root, second.path));
  assert.throws(() => lifecycle.evidenceTemplate(root, spec.id, first.path), /EEXIST/);
});

test('changed logs and evidence artifacts invalidate closure', async t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  const receipt = await lifecycle.verify(root, spec.id);
  io.write(root, spec.relative + '/' + receipt.checks[0].log, 'Replaced output');
  assert.throws(() => lifecycle.currentReceipt(root, project.loadSpec(root, spec.id)), /log changed/);
});

test('commands changing application source during verification fail the receipt', async t => {
  const { root, spec } = fixture(t);
  editConfig(root, cfg => { cfg.checks[0].command = 'node -e "require(\'fs\').writeFileSync(\'mutation.txt\',\'changed\')"'; });
  approve(root, spec.id, 'Reviewer');
  const receipt = await lifecycle.verify(root, spec.id);
  assert.equal(receipt.unchanged, false);
  assert.equal(receipt.verdict, 'failed');
});

test('check timeout records an actual failure instead of an unbounded verification loop', async t => {
  const run = await lifecycle.runCheck(process.cwd(), { name: 'slow', command: 'node -e "setTimeout(() => {}, 10000)"', timeout_ms: 80 });
  assert.equal(run.timed_out, true);
  assert.equal(run.result, 'failed');
});

test('selected current capability contracts must record consolidation before closure', async t => {
  const { root, spec } = fixture(t);
  io.write(root, 'agents/current/arithmetic.md', require('../lib/markdown').markdown({
    schema_version: 2, kind: 'capability', id: 'arithmetic', description: 'Arithmetic behavior.', status: 'active', changes: [],
  }, '# Arithmetic\n\nAdd finite numbers.'));
  spec.change.capabilities = ['agents/current/arithmetic.md'];
  project.writeChange(root, spec);
  approve(root, spec.id, 'Reviewer');
  await lifecycle.verify(root, spec.id);
  assert.throws(() => lifecycle.close(root, spec.id, { by: 'Reviewer' }), /consolidate/);
  editMarkdown(root, 'agents/current/arithmetic.md', data => { data.changes = [spec.id]; });
  assert.throws(() => lifecycle.currentReceipt(root, project.loadSpec(root, spec.id)), /stale/);
  await lifecycle.verify(root, spec.id);
  assert.equal(lifecycle.close(root, spec.id, { by: 'Reviewer' }).status, 'closed');
});

test('reopening an archived change preserves history and requires a new verification', async t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  await lifecycle.verify(root, spec.id);
  lifecycle.close(root, spec.id, { by: 'Reviewer', note: 'No contract change.', archive: true });
  const result = cli(root, ['reopen', spec.id, '--by', 'Reviewer', '--reason', 'Extend the approved implementation.', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(project.loadSpec(root, spec.id).change.status, 'implementing');
  assert.throws(() => lifecycle.currentReceipt(root, project.loadSpec(root, spec.id)), /No verification/);
});
