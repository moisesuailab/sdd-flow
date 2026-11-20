'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const io = require('../lib/io');
const md = require('../lib/markdown');
const project = require('../lib/project');
const { approve, check } = require('../lib/check');
const { verify, close, currentReceipt } = require('../lib/verification');
const handoff = require('../lib/handoff');
const { install } = require('../lib/install');
const { revise } = require('../lib/revisions');
const { fixture, editConfig, editMarkdown, cli } = require('../test-support/project');

function externalManual(t, options = {}) {
  const data = fixture(t, { method: 'manual', ...options });
  editMarkdown(data.root, data.spec.relative + '/SPEC.md', doc => { doc.acceptance[0].environment = 'external'; });
  return data;
}
function transfer(root, spec, edit = () => {}) {
  const value = handoff.template(root, spec.id);
  for (const item of value.items) {
    Object.assign(item, {
      reason: 'The developer has no authorized access to this environment.',
      owner: 'Project maintainer', environment: 'unavailable',
      safety: 'Do not modify production. Wait for a safe environment.',
      resume_when: 'An authorized isolated environment becomes available.',
    });
    edit(item);
  }
  io.writeJson(root, value.path, value);
  return value;
}
function externalAutomation(t) {
  const data = fixture(t);
  editConfig(data.root, cfg => {
    cfg.checks.push({ name: 'remote', command: 'node -e "process.stdout.write(\'EXTERNAL-RAN\')"', timeout_ms: 5000, environment: 'external' });
  });
  editMarkdown(data.root, data.spec.relative + '/SPEC.md', doc => { doc.acceptance[0].checks.push('remote'); });
  return data;
}

test('advisory failures remain visible without blocking successful required acceptance', async t => {
  const { root, spec } = fixture(t);
  editConfig(root, cfg => { cfg.checks.push({ name: 'complexity', level: 'advisory', command: 'node -e "process.exit(4)"', timeout_ms: 5000 }); });
  approve(root, spec.id, 'Reviewer');
  const receipt = await verify(root, spec.id);
  assert.equal(receipt.verdict, 'passed');
  assert.equal(receipt.checks[1].result, 'failed');
  assert.equal(receipt.checks[1].exit_code, 4);
  assert.match(receipt.warnings[0], /complexity/);
  assert.equal(close(root, spec.id, { by: 'Reviewer', note: 'No lasting change.' }).closure.validation, 'passed');
});

test('required behavior cannot be declared covered only by an advisory metric', t => {
  const { root, spec } = fixture(t);
  editConfig(root, cfg => { cfg.checks[0].level = 'advisory'; });
  assert.match(check(root, spec.id).errors.join('\n'), /Acceptance must use required/);
});

test('quality policy edits invalidate authorization and updates preserve project quality policy', t => {
  const { root, spec } = fixture(t);
  io.write(root, 'agents/QUALITY.md', '# Project quality\nRequire boundary tests.');
  approve(root, spec.id, 'Reviewer');
  io.write(root, 'agents/QUALITY.md', '# Project quality\nRequire boundary and authorization tests.');
  assert.equal(project.approvalValid(root, project.loadSpec(root, spec.id)), false);
  const before = io.read(root, 'agents/QUALITY.md');
  install(root, { update: true });
  assert.equal(io.read(root, 'agents/QUALITY.md'), before);
  const result = revise(root, spec.id, { by: 'Reviewer', reason: 'Expand quality criteria.' });
  assert.deepEqual(result.reopened_tasks, ['T01']);
});

test('missing environment can close as implemented with limitations without fabricated test success', async t => {
  const { root, spec } = externalManual(t, { mode: 'light' });
  approve(root, spec.id, 'Reviewer');
  const pending = await verify(root, spec.id);
  assert.equal(pending.verdict, 'partial');
  const plan = transfer(root, spec);
  const receipt = await verify(root, spec.id, { handoff: plan.path });
  assert.equal(receipt.verdict, 'limited');
  assert.equal(receipt.acceptance_verified, false);
  assert.equal(receipt.criteria[0].result, 'deferred');
  assert.equal(project.loadSpec(root, spec.id).change.status, 'implemented');
  assert.match(io.read(root, spec.relative + '/USER_TESTS.md'), /No safe test is available now/);
  const result = close(root, spec.id, { by: 'Reviewer', note: 'Local implementation reviewed; environment unavailable.', archive: true });
  assert.equal(result.status, 'closed');
  assert.equal(result.closure.outcome, 'implemented_with_limitations');
  assert.equal(result.closure.acceptance_verified, false);
  assert.equal(result.closure.pending_verification[0].id, 'AC01');
  assert.equal(currentReceipt(root, project.loadSpec(root, spec.id)).verdict, 'limited');
});

test('external commands are not executed by default and handoff does not need external access', async t => {
  const { root, spec } = externalAutomation(t);
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec);
  const receipt = await verify(root, spec.id, { handoff: plan.path });
  assert.equal(receipt.verdict, 'limited');
  assert.equal(receipt.checks[0].executed, true);
  assert.equal(receipt.checks[1].executed, false);
  assert.equal(receipt.checks[1].exit_code, null);
  assert.doesNotMatch(io.read(root, spec.relative + '/' + receipt.checks[1].log), /EXTERNAL-RAN/);
  assert.equal(receipt.criteria[0].result, 'deferred');
});

test('explicit external execution records its actual result rather than preserving an old deferral', async t => {
  const { root, spec } = externalAutomation(t);
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec);
  const receipt = await verify(root, spec.id, { handoff: plan.path, runExternal: true });
  assert.equal(receipt.verdict, 'passed');
  assert.equal(receipt.checks[1].executed, true);
  assert.match(io.read(root, spec.relative + '/' + receipt.checks[1].log), /EXTERNAL-RAN/);
  assert.deepEqual(receipt.pending_verification, []);
});

test('actual required failures cannot be hidden by an environment handoff', async t => {
  const { root, spec } = externalAutomation(t);
  io.write(root, 'arithmetic.js', 'exports.add = (a, b) => a - b;\n');
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec);
  const receipt = await verify(root, spec.id, { handoff: plan.path });
  assert.equal(receipt.verdict, 'failed');
  assert.equal(receipt.criteria[0].result, 'failed');
  assert.throws(() => close(root, spec.id, { by: 'Reviewer', note: 'No lasting change.' }), /full passed/);
});

test('executed external failures and failed manual observations stay failed even with a handoff', async t => {
  const first = externalAutomation(t);
  editConfig(first.root, cfg => { cfg.checks[1].command = 'node -e "process.exit(9)"'; });
  approve(first.root, first.spec.id, 'Reviewer');
  const plan = transfer(first.root, first.spec);
  assert.equal((await verify(first.root, first.spec.id, { handoff: plan.path, runExternal: true })).verdict, 'failed');
  assert.equal((await verify(first.root, first.spec.id, { handoff: plan.path })).verdict, 'failed', 'An observed failure cannot disappear when external execution is skipped');
  const second = externalManual(t, { mode: 'light' });
  approve(second.root, second.spec.id, 'Reviewer');
  const observed = require('../lib/verification').evidenceTemplate(second.root, second.spec.id);
  observed.cases[0] = { ...observed.cases[0], result: 'failed', by: 'Observer', at: new Date().toISOString(), notes: 'Actual observed failure.' };
  io.writeJson(second.root, observed.path, observed);
  const next = transfer(second.root, second.spec);
  assert.equal((await verify(second.root, second.spec.id, { evidence: observed.path, handoff: next.path })).verdict, 'failed');
  assert.equal((await verify(second.root, second.spec.id, { handoff: next.path })).verdict, 'failed', 'Omitting failed manual evidence must not waive the known failure');
});

test('handoff is bound to the tested source and cannot waive a local check', async t => {
  const { root, spec } = externalAutomation(t);
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec);
  const original = io.read(root, plan.path);
  plan.items[0].id = 'unit';
  io.writeJson(root, plan.path, plan);
  await assert.rejects(verify(root, spec.id, { handoff: plan.path }), /Unknown, local/);
  io.write(root, plan.path, original);
  io.write(root, 'changed-source.txt', 'Changed');
  await assert.rejects(verify(root, spec.id, { handoff: plan.path }), /stale/);
});

test('partial verification remains partial even when all external limitations are documented', async t => {
  const { root, spec } = externalManual(t);
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec);
  const receipt = await verify(root, spec.id, { handoff: plan.path, scope: 'partial' });
  assert.equal(receipt.verdict, 'partial');
  assert.throws(() => close(root, spec.id, { by: 'Reviewer', note: 'No lasting change.' }), /full passed/);
});

test('only external verification tasks can be deferred and actual unfinished implementation still blocks closure', async t => {
  const { root, spec } = externalManual(t);
  editMarkdown(root, spec.relative + '/TASK.md', doc => {
    doc.tasks.push({ id: 'T02', kind: 'verification', title: 'External observation.', status: 'deferred', covers: ['AC01'], depends_on: ['T01'], verify: 'User observes the real behavior.', deferral: { by: 'Reviewer', reason: 'No environment access.' } });
  });
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec);
  const receipt = await verify(root, spec.id, { handoff: plan.path });
  assert.equal(receipt.verdict, 'limited');
  assert.equal(receipt.deferred_tasks[0].id, 'T02');
  editMarkdown(root, spec.relative + '/TASK.md', doc => { doc.tasks[0].status = 'pending'; });
  await assert.rejects(verify(root, spec.id, { handoff: plan.path }), /unfinished/);
  editMarkdown(root, spec.relative + '/TASK.md', doc => { doc.tasks[0].status = 'deferred'; doc.tasks[0].deferral = { by: 'Reviewer', reason: 'Unavailable.' }; });
  assert.match(check(root, spec.id).errors.join('\n'), /Only verification tasks/);
});

test('a changed external requirement reopens a previously deferred verification task', t => {
  const { root, spec } = externalManual(t);
  editMarkdown(root, spec.relative + '/TASK.md', doc => {
    doc.tasks[0] = { ...doc.tasks[0], kind: 'verification', status: 'deferred', covers: ['AC01'], deferral: { by: 'Reviewer', reason: 'No access.' } };
  });
  approve(root, spec.id, 'Reviewer');
  editMarkdown(root, spec.relative + '/SPEC.md', doc => { doc.requirements[0].description = 'A revised observable rule.'; });
  assert.deepEqual(revise(root, spec.id, { by: 'Reviewer', reason: 'New rule.' }).reopened_tasks, ['T01']);
});

test('actionable handoffs require simple steps; unavailable environments do not require unsafe production tests', async t => {
  const { root, spec } = externalManual(t, { mode: 'light' });
  editConfig(root, cfg => { cfg.documentation.language = 'pt-BR'; });
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec, item => { item.environment = 'non-production'; });
  await assert.rejects(verify(root, spec.id, { handoff: plan.path }), /numbered steps/);
  plan.items[0].steps = ['Abra a cópia isolada com dados fictícios.', 'Confira o resultado sem acessar produção.'];
  plan.items[0].expected = 'Autorização e revisão corretas, sem alteração de dados reais.';
  io.writeJson(root, plan.path, plan);
  const receipt = await verify(root, spec.id, { handoff: plan.path });
  assert.equal(receipt.verdict, 'limited');
  assert.match(io.read(root, spec.relative + '/USER_TESTS.md'), /1\. Abra a cópia isolada/);
  assert.match(io.read(root, spec.relative + '/USER_TESTS.md'), /Não faça escritas/);
  io.write(root, spec.relative + '/USER_TESTS.md', 'Changed instructions.');
  assert.throws(() => close(root, spec.id, { by: 'Reviewer', note: 'No lasting change.' }), /guide changed/);
});

test('not-applicable external cases are explained, recorded and never reported as observed success', async t => {
  const { root, spec } = externalManual(t, { mode: 'light' });
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec, item => { item.result = 'not_applicable'; item.reason = 'This deployment has no such optional integration.'; });
  const receipt = await verify(root, spec.id, { handoff: plan.path });
  assert.equal(receipt.verdict, 'limited');
  assert.equal(receipt.criteria[0].result, 'not_applicable');
  assert.equal(receipt.acceptance_verified, false);
});

test('CLI reports limited completion successfully and status preserves the pending verification', async t => {
  const { root, spec } = externalManual(t, { mode: 'light' });
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec);
  const output = cli(root, ['verify', spec.id, '--handoff', plan.path, '--json']);
  assert.equal(output.status, 0, output.stderr || output.stdout);
  assert.equal(JSON.parse(output.stdout).verdict, 'limited');
  const closed = cli(root, ['close', spec.id, '--by', 'Reviewer', '--note', 'No contract.', '--archive', '--json']);
  assert.equal(closed.status, 0, closed.stdout);
  const status = JSON.parse(cli(root, ['status', spec.id, '--json']).stdout)[0];
  assert.equal(status.closure.validation, 'limited');
  assert.equal(status.closure.pending_verification.length, 1);
});

test('invalid gate configuration is rejected instead of silently weakening a required check', t => {
  assert.throws(() => require('../lib/quality').settings({ quality: { tdd: 'pretend' } }), /quality.tdd/);
  assert.throws(() => require('../lib/quality').checkSettings({ name: 'unit', level: 'ignore' }), /level/);
  assert.throws(() => require('../lib/quality').checkSettings({ name: 'unit', environment: 'production' }), /environment/);
});

test('each verification preserves its user-test instructions while the latest guide remains easy to find', async t => {
  const { root, spec } = externalManual(t, { mode: 'light' });
  approve(root, spec.id, 'Reviewer');
  const firstPlan = transfer(root, spec, item => { item.reason = 'First recorded limitation.'; });
  const first = await verify(root, spec.id, { handoff: firstPlan.path });
  const firstFile = spec.relative + '/' + first.handoff.guide.path;
  const bytes = io.read(root, firstFile);
  const secondPlan = transfer(root, spec, item => { item.reason = 'A revised safe handoff.'; });
  const second = await verify(root, spec.id, { handoff: secondPlan.path });
  assert.notEqual(second.handoff.guide.path, first.handoff.guide.path);
  assert.equal(io.read(root, firstFile), bytes);
  assert.match(io.read(root, spec.relative + '/USER_TESTS.md'), /A revised safe handoff/);
  assert.equal(currentReceipt(root, project.loadSpec(root, spec.id)).run_id, second.run_id);
});

test('a limited archived change can later be reopened and actually verified without losing its earlier limitation record', async t => {
  const { root, spec } = externalManual(t, { mode: 'light' });
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec);
  await verify(root, spec.id, { handoff: plan.path });
  close(root, spec.id, { by: 'Reviewer', note: 'Environment unavailable.', archive: true });
  const archived = project.loadSpec(root, spec.id);
  const historyFile = io.walk(root, archived.relative + '/history').find(file => file.includes('/closure-'));
  const original = io.read(root, historyFile);
  assert.equal(cli(root, ['reopen', spec.id, '--by', 'Reviewer', '--reason', 'User can now test.', '--json']).status, 0);
  const evidence = require('../lib/verification').evidenceTemplate(root, spec.id);
  evidence.cases[0] = { ...evidence.cases[0], result: 'passed', by: 'Actual tester', at: new Date().toISOString(), notes: 'Observed the expected result in the isolated environment.' };
  io.writeJson(root, evidence.path, evidence);
  const receipt = await verify(root, spec.id, { evidence: evidence.path });
  assert.equal(receipt.verdict, 'passed');
  const result = close(root, spec.id, { by: 'Reviewer', note: 'Observed behavior.', archive: true });
  assert.equal(result.closure.outcome, 'verified');
  assert.deepEqual(result.closure.pending_verification, []);
  assert.match(io.read(root, result.path + '/USER_TESTS.md'), /No delegated tests are pending/);
  assert.equal(io.read(root, historyFile), original);
});

test('a handoff cannot invent success or omit the reason/safety just to make an incomplete case pass', async t => {
  const { root, spec } = externalManual(t, { mode: 'light' });
  approve(root, spec.id, 'Reviewer');
  const plan = handoff.template(root, spec.id);
  await assert.rejects(verify(root, spec.id, { handoff: plan.path }), /reason, owner, expected and safety/);
  const valid = transfer(root, spec);
  valid.items[0].result = 'passed';
  io.writeJson(root, valid.path, valid);
  await assert.rejects(verify(root, spec.id, { handoff: valid.path }), /deferred or not_applicable/);
});

test('editing a handoff after verification invalidates closure even when source is unchanged', async t => {
  const { root, spec } = externalManual(t, { mode: 'light' });
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec);
  await verify(root, spec.id, { handoff: plan.path });
  plan.items[0].reason = 'Different limitation.';
  io.writeJson(root, plan.path, plan);
  assert.throws(() => close(root, spec.id, { by: 'Reviewer', note: 'No contract.' }), /Handoff/);
});

test('unexecuted advisory external analysis warns without becoming an unavailable-environment gate', async t => {
  const { root, spec } = fixture(t);
  editConfig(root, cfg => { cfg.checks.push({ name: 'optional-load', level: 'advisory', environment: 'external', command: 'node -e "process.exit(8)"', timeout_ms: 1000 }); });
  approve(root, spec.id, 'Reviewer');
  const receipt = await verify(root, spec.id);
  assert.equal(receipt.verdict, 'passed');
  assert.equal(receipt.checks[1].executed, false);
  assert.match(receipt.warnings[0], /not_run/);
});

test('a successful observation requires a deferred verification task to be completed rather than silently ignored', async t => {
  const { root, spec } = externalManual(t);
  editMarkdown(root, spec.relative + '/TASK.md', doc => { doc.tasks[0] = { ...doc.tasks[0], kind: 'verification', status: 'deferred', covers: ['AC01'], deferral: { by: 'Reviewer', reason: 'No access.' } }; });
  approve(root, spec.id, 'Reviewer');
  const evidence = require('../lib/verification').evidenceTemplate(root, spec.id);
  evidence.cases[0] = { ...evidence.cases[0], result: 'passed', by: 'Observer', at: new Date().toISOString(), notes: 'Observed now.' };
  io.writeJson(root, evidence.path, evidence);
  assert.equal((await verify(root, spec.id, { evidence: evidence.path })).verdict, 'partial');
});

test('quality details are loaded for planning/review without bloating every implementation task packet', t => {
  const { root, spec } = fixture(t);
  const { context } = require('../lib/context');
  assert.equal(context(root, spec.id, { phase: 'plan' }).entries.some(entry => entry.path === 'agents/QUALITY.md'), true);
  const execution = context(root, spec.id, { task: 'T01' });
  assert.equal(execution.entries.some(entry => entry.path === 'agents/QUALITY.md'), false);
  assert.equal(execution.quality.tdd, 'preferred');
});

test('a closed dependency with limitations permits progress but surfaces the unresolved external verification', async t => {
  const { root, spec } = externalManual(t, { mode: 'light' });
  approve(root, spec.id, 'Reviewer');
  const plan = transfer(root, spec);
  await verify(root, spec.id, { handoff: plan.path });
  close(root, spec.id, { by: 'Reviewer', note: 'No contract.' });
  const next = project.createSpec(root, 'followup', 'light');
  io.write(root, next.relative + '/SPEC.md', md.markdown({
    schema_version: 2, artifact: 'spec', id: next.id,
    requirements: [{ id: 'REQ01', description: 'An independent followup.' }],
    acceptance: [{ id: 'AC01', covers: ['REQ01'], description: 'Observed review.', method: 'inspection' }],
  }, '# Followup'));
  next.change.depends_on = [spec.id];
  project.writeChange(root, next);
  approve(root, next.id, 'Reviewer');
  const result = check(root, next.id, { phase: 'implement' });
  assert.equal(result.valid, true);
  assert.match(result.warnings.join('\n'), /pending external verification/);
});
