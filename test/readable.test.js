'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const io = require('../lib/io');
const md = require('../lib/markdown');
const project = require('../lib/project');
const { check, approve } = require('../lib/check');
const { verify, currentReceipt, close } = require('../lib/verification');
const { context } = require('../lib/context');
const { adopt } = require('../lib/adopt-readable');
const { manage } = require('../lib/management');
const { fixture, editMarkdown, editConfig, cli } = require('../test-support/project');

test('three visible markers and short open-task notes preserve all five logical states', t => {
  const { root, spec } = fixture(t, { format: 'markdown' });
  const source = io.read(root, spec.relative + '/SPEC.md');
  assert.doesNotMatch(source.split('---')[1], /requirements:|acceptance:/);
  assert.match(source, /\*\*REQ01\*\* — Add two numbers/);
  assert.match(source, /\*\*AC01\*\*/);
  const tasks = Object.entries(require('../lib/readable').MARKS).map(([status], i) => ({
    id: 'T0' + (i + 1), title: 'Outcome ' + status, status, evidence: 'Short observed note.', covers: ['REQ01'], depends_on: [], verify: 'Check the outcome.',
    ...(status === 'cancelled' && { cancellation: { by: 'Reviewer', reason: 'Scope changed.' } }),
    ...(status === 'deferred' && { kind: 'verification', deferral: { by: 'Reviewer', reason: 'External environment unavailable.' } }),
  }));
  const text = md.markdown({ schema_version: 2, artifact: 'tasks', id: spec.id, format: 'markdown', language: 'pt-BR', tasks }, '# Plano');
  assert.match(text, /- \[x\] \*\*T03\*\*/);
  assert.match(text, /- \[-\] \*\*T04\*\*/);
  assert.match(text, /- \[ \] \*\*T02\*\*[^\n]*\n  - Situação: em andamento/);
  assert.match(text, /- \[ \] \*\*T05\*\*[^\n]*\n  - Situação: verificação externa pendente/);
  assert.doesNotMatch(text, /\[\/\]|\[>\]/);
  assert.deepEqual(md.parseMarkdown(text).data.tasks, tasks);
  const parsed = md.parseMarkdown(text);
  assert.equal(md.markdown(parsed.data, parsed.body), text);
});

test('manual checkbox edits change task state without invalidating scope and normative edits do invalidate it', t => {
  const { root, spec } = fixture(t, { format: 'markdown' });
  approve(root, spec.id, 'Reviewer');
  const file = spec.relative + '/TASK.md';
  io.write(root, file, io.read(root, file).replace(/- \[x\]([^\n]*)/, '- [ ]$1\n  - Situação: em andamento'));
  assert.equal(md.load(root, file).data.tasks[0].status, 'in_progress');
  assert.equal(project.approvalValid(root, project.loadSpec(root, spec.id)), true);
  io.write(root, file, io.read(root, file).replace('Implement addition', 'Implement subtraction'));
  assert.equal(project.approvalValid(root, project.loadSpec(root, spec.id)), false);
});

test('legacy open-task markers remain readable and normalize without losing their states', () => {
  const header = '---\nschema_version: 2\nartifact: tasks\nid: 001-example\nformat: markdown\n---\n\n# Plan\n\n## Tasks\n\n';
  const legacy = header + '- [/] **T01** — Work in progress\n- [>] **T02** — External check\n';
  const parsed = md.parseMarkdown(legacy);
  assert.deepEqual(parsed.data.tasks.map(item => item.status), ['in_progress', 'deferred']);
  const normalized = md.markdown(parsed.data, parsed.body);
  assert.doesNotMatch(normalized, /\[\/\]|\[>\]/);
  assert.match(normalized, /Status: in progress/);
  assert.match(normalized, /Status: pending external verification/);
  assert.deepEqual(md.parseMarkdown(normalized).data, parsed.data);
  for (const marker of ['x', '-']) {
    assert.throws(() => md.parseMarkdown(header + '- [' + marker + '] **T01** — Conflicting\n  - Status: in progress\n'), /only qualifies/);
  }
  assert.throws(() => md.parseMarkdown(header + '- [ ] **T01** — Conflicting\n  - Status: done\n'), /only qualifies/);
  assert.throws(() => md.parseMarkdown(header + '- [ ] **T01** — Conflicting\n  - Status: in progress\n  - Situação: em andamento\n'), /duplicate/);
});

test('an unchecked external-verification task can close implementation with an explicit pending handoff', async t => {
  const { root, spec } = fixture(t, { format: 'markdown', method: 'manual' });
  editMarkdown(root, spec.relative + '/SPEC.md', data => { data.acceptance[0].environment = 'external'; });
  editMarkdown(root, spec.relative + '/TASK.md', data => {
    Object.assign(data.tasks[0], { title: 'Observe the external result', status: 'deferred', kind: 'verification', covers: ['AC01'],
      deferral: { by: 'Reviewer', reason: 'An isolated external environment is unavailable.' } });
  });
  const source = io.read(root, spec.relative + '/TASK.md');
  assert.match(source, /- \[ \] \*\*T01\*\*/);
  assert.doesNotMatch(source, /\[>\]/);
  assert.equal(check(root, spec.id).valid, true);
  approve(root, spec.id, 'Reviewer');
  const handoff = require('../lib/handoff').template(root, spec.id);
  for (const item of handoff.items) Object.assign(item, { reason: 'An isolated environment is unavailable.', safety: 'Wait for an isolated environment.', resume_when: 'An isolated environment is available.' });
  io.writeJson(root, handoff.path, handoff);
  const result = await verify(root, spec.id, { handoff: handoff.path });
  assert.equal(result.verdict, 'limited');
  assert.equal(result.acceptance_verified, false);
  assert.deepEqual(result.deferred_tasks.map(item => item.id), ['T01']);
  assert.equal(close(root, spec.id, { by: 'Reviewer', note: 'External verification remains explicit.' }).closure.acceptance_verified, false);
});

test('new standard specs expose research and Markdown tasks; light remains minimal', t => {
  const { root } = fixture(t);
  editConfig(root, cfg => { delete cfg.artifact_format; cfg.documentation.language = 'pt-BR'; });
  const created = project.createSpec(root, 'Ação com pesquisa', 'standard');
  assert.equal(md.load(root, created.relative + '/RESEARCH.md').data.status, 'pending');
  assert.equal(md.load(root, created.relative + '/TASK.md').data.format, 'markdown');
  assert.match(io.read(root, created.relative + '/TASK.md'), /Tarefas|Plano de execução/);
  assert.equal(io.exists(root, created.relative + '/STATE.md'), false);
  const light = project.createSpec(root, 'Small', 'light');
  assert.equal(io.exists(root, light.relative + '/TASK.md'), false);
  assert.equal(io.exists(root, light.relative + '/RESEARCH.md'), false);
});

test('short task notes support resumption without new files or stale approvals/receipts', async t => {
  const { root, spec } = fixture(t, { format: 'markdown' });
  approve(root, spec.id, 'Reviewer');
  const verified = await verify(root, spec.id);
  const original = project.inputDigest(root, project.loadSpec(root, spec.id)).digest;
  editMarkdown(root, spec.relative + '/TASK.md', data => {
    data.tasks[0].notes = 'Next action: review the current validation with the user.';
  });
  assert.match(io.read(root, spec.relative + '/TASK.md'), /  - Notes: Next action:/);
  assert.equal(project.approvalValid(root, project.loadSpec(root, spec.id)), true);
  assert.equal(project.inputDigest(root, project.loadSpec(root, spec.id)).digest, original);
  assert.equal(currentReceipt(root, project.loadSpec(root, spec.id)).run_id, verified.run_id);
  assert.match(context(root, spec.id, { task: 'T01' }).content, /Next action: review the current validation/);
  assert.equal(io.exists(root, spec.relative + '/STATE.md'), false);
  editMarkdown(root, spec.relative + '/TASK.md', data => { data.tasks[0].verify = 'Verify a changed acceptance condition.'; });
  assert.equal(project.approvalValid(root, project.loadSpec(root, spec.id)), false);
  assert.throws(() => currentReceipt(root, project.loadSpec(root, spec.id)), /stale/);
});

test('legacy STATE is preserved but only loaded when explicitly selected', t => {
  const { root, spec } = fixture(t, { format: 'markdown' });
  const file = spec.relative + '/STATE.md';
  const previous = '# Prior checkpoint\n\nLEGACY_RESUMPTION_DETAIL';
  io.write(root, file, previous);
  const selected = context(root, spec.id, { task: 'T01' });
  assert.equal(selected.entries.some(item => item.path === file), false);
  assert.doesNotMatch(selected.content, /LEGACY_RESUMPTION_DETAIL/);
  assert.equal(io.read(root, file), previous);
  spec.change.context.push(file);
  project.writeChange(root, spec);
  assert.match(context(root, spec.id, { task: 'T01' }).content, /LEGACY_RESUMPTION_DETAIL/);
});

test('task notes do not substitute for completion, real evidence or required task fields', async t => {
  const { root, spec } = fixture(t, { format: 'markdown' });
  editMarkdown(root, spec.relative + '/TASK.md', data => {
    Object.assign(data.tasks[0], { status: 'pending', notes: 'A note claims completion; the task is still pending.' });
  });
  approve(root, spec.id, 'Reviewer');
  assert.equal((await verify(root, spec.id, { scope: 'partial' })).verdict, 'partial');
  await assert.rejects(verify(root, spec.id), /Task is unfinished/);
  assert.throws(() => close(root, spec.id, { by: 'Reviewer', note: 'Not ready.' }), /Task is unfinished/);
  const legacy = project.createSpec(root, 'Legacy notes', 'standard');
  io.write(root, legacy.relative + '/SPEC.md', io.read(root, spec.relative + '/SPEC.md').replaceAll(spec.id, legacy.id));
  const task = md.load(root, spec.relative + '/TASK.md').data;
  delete task.format;
  task.id = legacy.id;
  task.tasks[0].notes = ['An invalid array'];
  io.write(root, legacy.relative + '/TASK.md', md.markdown(task, '# Plan'));
  assert.ok(check(root, legacy.id).errors.some(error => error.includes('notes must be short text')));
});

test('readable context selects task requirements and visible source headings without loading runtime records', async t => {
  const { root, spec } = fixture(t, { format: 'markdown' });
  editMarkdown(root, spec.relative + '/SPEC.md', data => {
    data.requirements.push({ id: 'REQ02', description: 'OTHER_REQUIREMENT' });
    data.acceptance.push({ id: 'AC02', description: 'OTHER_ACCEPTANCE', covers: ['REQ02'], method: 'manual' });
  });
  let packet = context(root, spec.id, { task: 'T01' });
  assert.match(packet.entries.find(entry => entry.path.endsWith('/TASK.md')).content, /- \[x\] \*\*T01\*\*/);
  assert.match(packet.content, /Adding 2 and 3/);
  assert.doesNotMatch(packet.content, /OTHER_REQUIREMENT|OTHER_ACCEPTANCE/);
  spec.change.context = [{ path: spec.relative + '/SPEC.md', section: 'Requirements' }];
  project.writeChange(root, spec);
  packet = context(root, spec.id);
  assert.match(packet.content, /OTHER_REQUIREMENT/);
  assert.equal(packet.entries.find(entry => entry.section === 'Requirements').content.includes('OTHER_ACCEPTANCE'), false);
});

test('readable lifecycle writes private records, preserves them after rename and permits truthful closure', async t => {
  const { root, spec } = fixture(t, { format: 'markdown' });
  approve(root, spec.id, 'Reviewer');
  const run = await verify(root, spec.id);
  assert.equal(run.verdict, 'passed');
  assert.ok(io.exists(root, spec.relative + '/.sdd/runs/' + run.run_id + '/receipt.json'));
  assert.equal(io.exists(root, spec.relative + '/runs'), false);
  assert.equal(io.exists(root, spec.relative + '/verification.json'), false);
  assert.match(io.read(root, spec.relative + '/.gitignore'), /\/\.sdd\//);
  manage(root, 'rename', spec.id, { name: 'new-name', by: 'Reviewer', reason: 'Organization' });
  assert.equal(currentReceipt(root, project.loadSpec(root, spec.id)).verdict, 'passed');
  assert.equal(close(root, spec.id, { by: 'Reviewer', note: 'Isolated behavior.' }).status, 'closed');
});

test('readable external verification keeps handoff/guide hashes valid without claiming pending acceptance passed', async t => {
  const { root, spec } = fixture(t, { format: 'markdown', method: 'manual' });
  editMarkdown(root, spec.relative + '/SPEC.md', data => { data.acceptance[0].environment = 'external'; });
  approve(root, spec.id, 'Reviewer');
  const handoff = require('../lib/handoff').template(root, spec.id);
  for (const item of handoff.items) Object.assign(item, { reason: 'An isolated browser is unavailable.', safety: 'Wait for an isolated environment.', resume_when: 'A browser is available.' });
  io.writeJson(root, handoff.path, handoff);
  assert.ok(handoff.path.includes('/.sdd/'));
  const result = await verify(root, spec.id, { handoff: handoff.path });
  assert.equal(result.verdict, 'limited');
  assert.equal(result.acceptance_verified, false);
  assert.ok(result.handoff.guide.path.startsWith('.sdd/'));
  manage(root, 'rename', spec.id, { name: 'external-renamed', by: 'Reviewer', reason: 'Organization' });
  assert.equal(currentReceipt(root, project.loadSpec(root, spec.id)).verdict, 'limited');
  const closed = close(root, spec.id, { by: 'Reviewer', note: 'Local work complete with an explicit pending observation.' });
  assert.equal(closed.closure.acceptance_verified, false);
});

test('readable migration is previewable, preserves IDs/states and records, and requires review without fabricating evidence', async t => {
  const { root, spec } = fixture(t);
  io.write(root, spec.relative + '/USER_TESTS.md', '# Prior steps');
  io.write(root, spec.relative + '/STATE.md', '# Prior resumption note');
  approve(root, spec.id, 'Reviewer');
  const run = await verify(root, spec.id);
  const previousReceipt = io.read(root, project.receiptFile(spec));
  const original = io.read(root, spec.relative + '/SPEC.md');
  const oldGuide = io.read(root, spec.relative + '/USER_TESTS.md');
  const files = io.walk(root);
  assert.equal(adopt(root, spec.id, { dryRun: true }).review_required, true);
  assert.deepEqual(io.walk(root), files);
  const result = adopt(root, spec.id);
  assert.equal(io.read(root, result.backup + '/' + spec.relative + '/SPEC.md'), original);
  const loaded = project.loadSpec(root, spec.id);
  assert.equal(loaded.id, spec.id);
  assert.equal(loaded.change.approval, null);
  assert.equal(loaded.change.status, 'draft');
  assert.equal(md.load(root, spec.relative + '/TASK.md').data.tasks[0].status, 'done');
  assert.equal(io.read(root, spec.relative + '/.sdd/legacy/verification.json'), previousReceipt);
  assert.equal(io.read(root, spec.relative + '/.sdd/legacy/USER_TESTS.md'), oldGuide);
  assert.match(io.read(root, spec.relative + '/STATE.md'), /Notes below precede conversion/);
  assert.ok(io.exists(root, spec.relative + '/.sdd/runs/' + run.run_id + '/receipt.json'));
  assert.equal(check(root, spec.id, { phase: 'implement' }).valid, false);
  assert.throws(() => currentReceipt(root, loaded), /No verification receipt/);
  assert.equal(adopt(root, spec.id).migrated, false);
  approve(root, spec.id, 'Reviewer');
  assert.equal((await verify(root, spec.id)).verdict, 'passed');
});

test('parser rejects duplicate sources of truth, duplicate sections, malformed markers and unknown fields', () => {
  const data = { schema_version: 2, artifact: 'tasks', id: '001-test', format: 'markdown', tasks: [] };
  const source = md.markdown(data, '# Plan');
  assert.throws(() => md.parseMarkdown(source.replace('format: markdown', 'format: markdown\ntasks: []')), /Markdown only/);
  assert.throws(() => md.parseMarkdown(source + '\n## Tasks\n'), /duplicate/);
  assert.throws(() => md.parseMarkdown(source + '\n- [?] **T01** — Bad\n'), /invalid structured/);
  assert.throws(() => md.parseMarkdown(source + '\n- [ ] **T01** — Bad\n  - Unknown: value\n'), /unknown/);
});

test('ordinary Markdown indentation, plain IDs and wrapped descriptions remain editable without a second state', () => {
  const source = '---\nschema_version: 2\nartifact: tasks\nid: 001-example\nformat: markdown\n---\n\n# Plano\n\n## TAREFAS ##\n\n- [x] T01 — Validar\n  os consumidores.\n    - cobre: REQ01\n    - depende de: —\n    - Verificacao: As regressões passam.\n';
  const task = md.parseMarkdown(source).data.tasks[0];
  assert.equal(task.status, 'done');
  assert.equal(task.title, 'Validar os consumidores.');
  assert.deepEqual(task.covers, ['REQ01']);
  assert.equal(task.verify, 'As regressões passam.');
});

test('scope revision still works conservatively on a clone without local approval snapshots', t => {
  const { root, spec } = fixture(t, { format: 'markdown' });
  approve(root, spec.id, 'Reviewer');
  const loaded = project.loadSpec(root, spec.id);
  fs.unlinkSync(io.resolve(root, spec.relative + '/' + loaded.change.approval.snapshot));
  editMarkdown(root, spec.relative + '/SPEC.md', data => { data.requirements[0].description = 'Add only finite numbers.'; });
  const revision = require('../lib/revisions').revise(root, spec.id, { by: 'Reviewer', reason: 'Changed requirement.' });
  assert.equal(revision.conservative, true);
  assert.deepEqual(revision.reopened_tasks, ['T01']);
});

test('CLI supports read-only migration previews and new privacy command', t => {
  const { root, spec } = fixture(t);
  assert.equal(cli(root, ['migrate', spec.id, '--readable', '--dry-run', '--json']).status, 0);
  assert.equal(md.load(root, spec.relative + '/TASK.md').data.format, undefined);
  assert.equal(cli(root, ['privacy', '--json']).status, 0);
});

test('readable migration restores documents, local records and inventory after a persistence failure', async t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  await verify(root, spec.id);
  const before = Object.fromEntries(io.walk(root, spec.relative).map(file => [file, io.read(root, file)]));
  const inventory = io.read(root, require('../lib/catalog').REGISTRY);
  const writeJson = io.writeJson;
  let interrupted = false;
  io.writeJson = (projectRoot, file, value, options) => {
    if (file === require('../lib/catalog').REGISTRY && !interrupted) { interrupted = true; throw new Error('Simulated migration persistence failure'); }
    return writeJson(projectRoot, file, value, options);
  };
  try { assert.throws(() => adopt(root, spec.id), /persistence failure/); }
  finally { io.writeJson = writeJson; }
  assert.deepEqual(Object.fromEntries(io.walk(root, spec.relative).map(file => [file, io.read(root, file)])), before);
  assert.equal(io.read(root, require('../lib/catalog').REGISTRY), inventory);
  assert.equal(adopt(root, spec.id).migrated, true);
});

test('additional task fields survive readable round trips and nested prototype keys are rejected', () => {
  const data = { schema_version: 2, artifact: 'tasks', id: '001-test', format: 'markdown', tasks: [
    { id: 'T01', title: 'Verify a case', status: 'deferred', covers: ['AC01'], depends_on: [], verify: 'Observe the result.',
      kind: 'verification', deferral: { by: 'Reviewer', reason: 'Needs environment', owner: 'Team' }, estimate: 3 },
  ] };
  const source = md.markdown(data, '# Plan');
  assert.deepEqual(md.parseMarkdown(source).data.tasks, data.tasks);
  assert.throws(() => md.parseMarkdown(source.replace(/  - Additional fields:.*/, '  - Additional fields: {"bad":{"__proto__":1}}')), /additional fields/);
});
