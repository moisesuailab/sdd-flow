'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const io = require('../lib/io');
const md = require('../lib/markdown');
const project = require('../lib/project');
const { check, approve } = require('../lib/check');
const { fixture, editMarkdown, editConfig } = require('../test-support/project');

test('YAML accepts multiline discovery descriptions, BOM and CRLF without fixed excerpts', () => {
  const source = '\uFEFF---\r\nname: arithmetic\r\ndescription: >-\r\n  Add numbers\r\n  with observed evidence.\r\n---\r\n\r\n# Body\r\n';
  const parsed = md.parseMarkdown(source);
  assert.equal(parsed.data.description, 'Add numbers with observed evidence.');
  assert.equal(parsed.body, '# Body\n');
});

test('YAML rejects duplicate keys, aliases, reserved keys, tags and malformed front matter', () => {
  for (const content of ['name: a\nname: b', 'a: &a 1\nb: *a', '__proto__: {}', 'a: !unsafe 1', '[a, b]']) {
    assert.throws(() => md.parseYaml(content));
  }
  assert.throws(() => md.parseMarkdown('---\na: 1\nbody'), /unclosed/);
  assert.throws(() => md.parseMarkdown('# Legacy'), /missing/);
  assert.equal(md.parseMarkdown('---\nname: example\n---').body, '');
});

test('check identifies broken requirement links and unknown automated checks', t => {
  const { root, spec } = fixture(t);
  editMarkdown(root, spec.relative + '/SPEC.md', data => {
    data.acceptance[0].covers = ['REQ99'];
    data.acceptance[0].checks = ['invented'];
  });
  const result = check(root, spec.id);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /REQ99/);
  assert.match(result.errors.join('\n'), /no active acceptance/);
  assert.match(result.errors.join('\n'), /Unknown check/);
});

test('scope approval survives execution status changes and becomes stale after normative edits', t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  editMarkdown(root, spec.relative + '/TASK.md', data => { data.tasks[0].status = 'pending'; });
  assert.equal(project.approvalValid(root, project.loadSpec(root, spec.id)), true);
  editMarkdown(root, spec.relative + '/SPEC.md', data => { data.requirements[0].description = 'Add only finite numbers.'; });
  assert.equal(project.approvalValid(root, project.loadSpec(root, spec.id)), false);
  assert.equal(check(root, spec.id, { phase: 'implement' }).valid, false);
});

test('previously approved IDs cannot silently disappear', t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  editMarkdown(root, spec.relative + '/SPEC.md', data => { data.requirements[0].id = 'REQ02'; data.acceptance[0].covers = ['REQ02']; });
  assert.match(check(root, spec.id).errors.join('\n'), /historical ID REQ01/);
});

test('task cycles and started tasks with unmet dependencies are rejected', t => {
  const { root, spec } = fixture(t);
  editMarkdown(root, spec.relative + '/TASK.md', data => {
    data.tasks[0].depends_on = ['T02'];
    data.tasks.push({ ...data.tasks[0], id: 'T02', status: 'pending', depends_on: ['T01'] });
  });
  const result = check(root, spec.id);
  assert.match(result.errors.join('\n'), /Circular task/);
  assert.match(result.errors.join('\n'), /unfinished/);
});

test('spec dependency cycles are detected and execution needs closed dependencies', t => {
  const { root, spec } = fixture(t);
  const second = project.createSpec(root, 'integration', 'light');
  spec.change.depends_on = [second.id];
  project.writeChange(root, spec);
  second.change.depends_on = [spec.id];
  project.writeChange(root, second);
  const result = check(root, spec.id, { phase: 'implement' });
  assert.match(result.errors.join('\n'), /Circular spec/);
  assert.match(result.errors.join('\n'), /not closed/);
});

test('rigorous mode requires research and authorization even when project approval is optional', t => {
  const { root, spec } = fixture(t, { mode: 'rigorous', approval: 'optional' });
  fs.unlinkSync(io.resolve(root, spec.relative + '/RESEARCH.md'));
  assert.equal(check(root, spec.id).valid, false);
  io.write(root, spec.relative + '/RESEARCH.md', md.markdown({ schema_version: 2, artifact: 'research', id: spec.id }, '# Research\nObserved evidence.'));
  assert.match(check(root, spec.id, { phase: 'implement' }).errors.join('\n'), /approval/);
});

test('cancelled tasks retain identity without demanding removal of unrelated shared code', t => {
  const { root, spec } = fixture(t);
  editMarkdown(root, spec.relative + '/TASK.md', data => {
    data.tasks.push({ id: 'T02', title: 'Cancelled enhancement.', status: 'cancelled', covers: [], depends_on: [], verify: 'Not implemented.',
      cancellation: { by: 'Reviewer', reason: 'No longer needed.' } });
  });
  assert.equal(check(root, spec.id, { final: true }).valid, true);
  assert.equal(io.exists(root, 'arithmetic.js'), true);
});

test('cancelled requirement chains may preserve historical links while active work remains valid', t => {
  const { root, spec } = fixture(t);
  editMarkdown(root, spec.relative + '/SPEC.md', data => {
    data.requirements.push({ id: 'REQ02', description: 'Cancelled enhancement.', status: 'cancelled', cancellation: { by: 'Reviewer', reason: 'Deferred.' } });
    data.acceptance.push({ id: 'AC02', description: 'Historical acceptance.', covers: ['REQ02'], method: 'manual', status: 'cancelled', cancellation: { by: 'Reviewer', reason: 'Deferred.' } });
  });
  editMarkdown(root, spec.relative + '/TASK.md', data => {
    data.tasks.push({ id: 'T02', title: 'Historical task.', status: 'cancelled', covers: ['REQ02', 'AC02'], depends_on: [], verify: 'No longer required.',
      cancellation: { by: 'Reviewer', reason: 'Deferred.' } });
  });
  assert.equal(check(root, spec.id).valid, true);
});

test('path traversal and symlink references are rejected before reading external bytes', t => {
  const { root, spec } = fixture(t);
  for (const file of ['../secret', '/etc/passwd', 'C:/secret', 'src/../../secret', '.git/config']) assert.throws(() => io.resolve(root, file));
  if (process.platform !== 'win32') {
    fs.symlinkSync('/etc/passwd', io.resolve(root, 'external'));
    spec.change.context = ['external'];
    project.writeChange(root, spec);
    assert.match(check(root, spec.id).errors.join('\n'), /Symbolic links/);
  }
});

test('configuration rejects malformed check declarations', t => {
  const { root } = fixture(t);
  editConfig(root, cfg => { cfg.checks.push({ ...cfg.checks[0] }); });
  assert.throws(() => project.config(root), /duplicate/);
});

test('verification configuration refuses excluding the declared source tree', t => {
  const { root } = fixture(t);
  editConfig(root, cfg => { cfg.verification.exclude = ['src']; });
  assert.throws(() => project.config(root), /Do not exclude source/);
});
