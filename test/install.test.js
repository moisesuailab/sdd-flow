'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const io = require('../lib/io');
const project = require('../lib/project');
const { install, doctor, migrate } = require('../lib/install');
const { harness, exportBundle } = require('../lib/adapters');
const { fixture } = require('../test-support/project');

test('init preserves existing user instructions/config and repeated installation is idempotent', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-preserve-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  io.write(root, 'AGENTS.md', '# Team instructions\nKeep the integration invariant.\n');
  install(root);
  const first = io.read(root, 'AGENTS.md');
  assert.match(first, /Keep the integration invariant/);
  install(root);
  assert.equal(io.read(root, 'AGENTS.md'), first);
  assert.equal((first.match(/sdd-flow:start/g) || []).length, 1);
  io.write(root, 'agents/PROJECT.md', '# Custom project map');
  install(root, { update: true });
  assert.equal(io.read(root, 'agents/PROJECT.md'), '# Custom project map');
});

test('updates preflight conflicts and only replace customized core with explicit backup', t => {
  const { root } = fixture(t);
  const original = io.read(root, 'agents/RULES.md');
  io.write(root, 'agents/RULES.md', original + '\nCUSTOM RULE\n');
  const plan = install(root, { update: true, dryRun: true });
  assert.ok(plan.conflicts.includes('agents/RULES.md'));
  assert.throws(() => install(root, { update: true }), /preserved/);
  assert.match(io.read(root, 'agents/RULES.md'), /CUSTOM RULE/);
  const result = install(root, { update: true, replaceManaged: true });
  assert.match(io.read(root, result.backup + '/agents/RULES.md'), /CUSTOM RULE/);
  assert.equal(io.read(root, 'agents/RULES.md'), original);
});

test('completed setup can be removed without doctor failure or updater resurrection', t => {
  const { root } = fixture(t);
  fs.unlinkSync(io.resolve(root, 'agents/SETUP.md'));
  assert.equal(doctor(root).valid, true);
  install(root, { update: true });
  assert.equal(io.exists(root, 'agents/SETUP.md'), false);
});

test('numbering supports IDs beyond 999, archives and reserved deleted history', t => {
  const { root } = fixture(t);
  fs.mkdirSync(io.resolve(root, 'agents/archive/1000-old'), { recursive: true });
  const next = project.createSpec(root, 'next', 'light');
  assert.equal(next.id, '1001-next');
  fs.rmSync(io.resolve(root, next.relative), { recursive: true });
  assert.equal(project.createSpec(root, 'after-deletion', 'light').id, '1002-after-deletion');
});

test('native adapters activate commands/skills without overwriting unrelated settings or commands', t => {
  const { root } = fixture(t);
  io.write(root, '.claude/settings.json', '{"model":"existing","permissions":{"deny":["Read(secret)"]}}\n');
  io.write(root, '.claude/commands/sdd-personal.md', 'Keep my custom command.');
  io.write(root, 'CLAUDE.md', '# Existing Claude instructions\n');
  harness(root, 'claude-code');
  harness(root, 'opencode');
  assert.ok(io.exists(root, '.claude/skills/sdd-flow/SKILL.md'));
  assert.ok(io.exists(root, '.opencode/commands/sdd-close.md'));
  assert.match(io.read(root, 'CLAUDE.md'), /Existing Claude/);
  assert.equal(JSON.parse(io.read(root, '.claude/settings.json')).model, 'existing');
  io.write(root, '.claude/commands/sdd-plan.md', 'Local customized wrapper.');
  const removed = harness(root, 'claude-code', { remove: true });
  assert.ok(removed.preserved.includes('.claude/commands/sdd-plan.md'));
  assert.equal(io.read(root, '.claude/commands/sdd-personal.md'), 'Keep my custom command.');
  assert.equal(io.read(root, '.claude/commands/sdd-plan.md'), 'Local customized wrapper.');
  assert.match(io.read(root, 'CLAUDE.md'), /Existing Claude/);
  assert.doesNotMatch(io.read(root, 'CLAUDE.md'), /sdd-flow:start/);
});

test('adapter conflicts prevent any partial writes', t => {
  const { root } = fixture(t);
  io.write(root, '.claude/commands/sdd-validate.md', 'Unowned command.');
  assert.throws(() => harness(root, 'claude-code'), /preserved/);
  assert.equal(io.exists(root, '.claude/commands/sdd-plan.md'), false);
});

test('exports use native layouts, licensing and references without a marketplace publication', t => {
  const { root } = fixture(t);
  for (const format of ['claude-code', 'opencode', 'agent-skills']) {
    const result = exportBundle(root, format, 'packages/' + format);
    assert.ok(io.exists(root, result.path + '/LICENSE'));
    assert.throws(() => exportBundle(root, format, result.path), /non-existing/);
  }
  const manifest = io.json(root, 'packages/claude-code/.claude-plugin/plugin.json');
  assert.equal(manifest.name, 'sdd-flow');
  assert.ok(io.exists(root, 'packages/claude-code/skills/sdd-flow/references/rules.md'));
  assert.ok(io.exists(root, 'packages/opencode/.opencode/skills/sdd-flow/SKILL.md'));
});

test('legacy migration preserves source bodies and never fabricates acceptance, approval or execution', t => {
  const { root } = fixture(t);
  io.write(root, 'agents/specs/002-legacy/SPEC.md', '# Legacy scope\n\nDo the original thing.');
  io.write(root, 'agents/specs/002-legacy/TASK.md', '# Tasks\n\n- [x] T01 — Original task\n');
  const plan = migrate(root, '002-legacy', { dryRun: true });
  assert.equal(plan.review_required, true);
  assert.equal(io.exists(root, 'agents/specs/002-legacy/change.yaml'), false);
  const result = migrate(root, '002-legacy');
  const migrated = project.loadSpec(root, '002-legacy');
  assert.equal(migrated.change.approval, null);
  assert.equal(migrated.change.status, 'draft');
  assert.match(io.read(root, result.backup + '/agents/specs/002-legacy/SPEC.md'), /original thing/);
  assert.match(io.read(root, 'agents/specs/002-legacy/SPEC.md'), /legacy: true/);
});

test('read-only dry runs do not acquire mutation locks or create an installation', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-preview-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const before = fs.readdirSync(root);
  const preview = install(root, { update: true, dryRun: true });
  assert.ok(preview.files.length);
  assert.deepEqual(fs.readdirSync(root), before);
});
