'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const io = require('../lib/io');
const md = require('../lib/markdown');
const project = require('../lib/project');
const { approve, check } = require('../lib/check');
const { revise } = require('../lib/revisions');
const { verify } = require('../lib/verification');
const { fixture, editMarkdown, editConfig } = require('../test-support/project');

test('a changed requirement reopens affected acceptance-linked tasks and their dependents', t => {
  const { root, spec } = fixture(t);
  editMarkdown(root, spec.relative + '/TASK.md', data => {
    data.tasks[0].covers = ['AC01'];
    data.tasks.push({ ...data.tasks[0], id: 'T02', covers: ['REQ01'], depends_on: ['T01'] });
  });
  approve(root, spec.id, 'Reviewer');
  const prior = project.loadSpec(root, spec.id).change.approval;
  const snapshotBytes = io.read(root, spec.relative + '/' + prior.snapshot);
  editMarkdown(root, spec.relative + '/SPEC.md', data => { data.requirements[0].description = 'Add only finite numbers.'; });
  const preview = revise(root, spec.id, { by: 'Reviewer', reason: 'Reject nonfinite values.', dryRun: true });
  assert.deepEqual(preview.reopened_tasks, ['T01', 'T02']);
  assert.equal(md.load(root, spec.relative + '/TASK.md').data.tasks[0].status, 'done');
  const result = revise(root, spec.id, { by: 'Reviewer', reason: 'Reject nonfinite values.' });
  assert.deepEqual(result.reopened_tasks, ['T01', 'T02']);
  assert.equal(project.loadSpec(root, spec.id).change.approval, null);
  assert.equal(project.loadSpec(root, spec.id).change.status, 'draft');
  assert.ok(md.load(root, spec.relative + '/TASK.md').data.tasks.every(task => task.status === 'pending'));
  assert.equal(io.read(root, spec.relative + '/' + prior.snapshot), snapshotBytes);
  assert.equal(io.json(root, spec.relative + '/' + result.event).reason, 'Reject nonfinite values.');
});

test('unrelated completed tasks remain done after a localized business-rule revision', t => {
  const { root, spec } = fixture(t);
  editMarkdown(root, spec.relative + '/SPEC.md', data => {
    data.requirements.push({ id: 'REQ02', description: 'A separate behavior.' });
    data.acceptance.push({ id: 'AC02', description: 'Separate observable check.', covers: ['REQ02'], method: 'manual' });
  });
  editMarkdown(root, spec.relative + '/TASK.md', data => {
    data.tasks.push({ id: 'T02', title: 'Separate task.', status: 'done', covers: ['REQ02', 'AC02'], depends_on: [], verify: 'Separate behavior observed.' });
  });
  approve(root, spec.id, 'Reviewer');
  editMarkdown(root, spec.relative + '/SPEC.md', data => { data.requirements[0].description = 'Updated arithmetic rule.'; });
  revise(root, spec.id, { by: 'Reviewer', reason: 'Change one rule.' });
  const tasks = md.load(root, spec.relative + '/TASK.md').data.tasks;
  assert.equal(tasks[0].status, 'pending');
  assert.equal(tasks[1].status, 'done');
});

test('project policy and verification-policy edits invalidate approval and conservatively reopen work', t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  io.write(root, 'agents/POLICIES.md', '# Project policies\n\nAll numeric inputs must be finite.');
  assert.equal(check(root, spec.id, { phase: 'implement' }).valid, false);
  const result = revise(root, spec.id, { by: 'Reviewer', reason: 'Adopt finite numeric inputs.' });
  assert.equal(result.conservative, true);
  assert.deepEqual(result.reopened_tasks, ['T01']);
  approve(root, spec.id, 'Reviewer');
  editConfig(root, cfg => { cfg.checks[0].command = 'node --test'; });
  assert.equal(check(root, spec.id, { phase: 'implement' }).valid, false);
});

test('execution evidence does not change normative scope and repeated approvals retain separate snapshots', t => {
  const { root, spec } = fixture(t);
  const a = approve(root, spec.id, 'Reviewer');
  editMarkdown(root, spec.relative + '/TASK.md', data => { data.tasks[0].evidence = 'Observed unit-check result.'; });
  assert.equal(project.approvalValid(root, project.loadSpec(root, spec.id)), true);
  const b = approve(root, spec.id, 'Reviewer');
  assert.notEqual(a.snapshot, b.snapshot);
  assert.ok(io.exists(root, spec.relative + '/' + a.snapshot));
  assert.ok(io.exists(root, spec.relative + '/' + b.snapshot));
  assert.throws(() => revise(root, spec.id, { by: 'Reviewer', reason: 'No change.' }), /unchanged/);
});

test('each verification run retains its receipt even after a later failure', async t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  const passed = await verify(root, spec.id);
  io.write(root, 'arithmetic.js', 'exports.add = () => 0;\n');
  const failed = await verify(root, spec.id);
  assert.equal(io.json(root, spec.relative + '/runs/' + passed.run_id + '/receipt.json').verdict, 'passed');
  assert.equal(io.json(root, spec.relative + '/runs/' + failed.run_id + '/receipt.json').verdict, 'failed');
  assert.equal(io.json(root, spec.relative + '/verification.json').verdict, 'failed');
});
