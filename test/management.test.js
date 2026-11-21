'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const io = require('../lib/io');
const md = require('../lib/markdown');
const project = require('../lib/project');
const catalog = require('../lib/catalog');
const { check, approve } = require('../lib/check');
const { verify, close, currentReceipt, evidenceTemplate } = require('../lib/verification');
const { context } = require('../lib/context');
const { revise } = require('../lib/revisions');
const { manage, reconcile } = require('../lib/management');
const { fixture, editConfig, cli } = require('../test-support/project');

const author = { by: 'Reviewer', reason: 'Organize project knowledge.' };

function followup(root, source, dependencies = []) {
  const next = project.createSpec(root, 'followup', 'light');
  const data = md.load(root, source.relative + '/SPEC.md');
  data.data.id = next.id;
  io.write(root, next.relative + '/SPEC.md', md.markdown(data.data, '# Independent consumer change'));
  next.change.depends_on = dependencies;
  project.writeChange(root, next);
  return next;
}

function snapshot(root) {
  return Object.fromEntries(io.walk(root).map(file => [file, io.hash(fs.readFileSync(io.resolve(root, file)))]));
}

test('rename and renumber preserve stable identity, approved scope, run bytes and valid closure', async t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  const run = await verify(root, spec.id);
  const fingerprint = project.inputDigest(root, project.loadSpec(root, spec.id)).digest;
  const previousRun = io.read(root, spec.relative + '/runs/' + run.run_id + '/receipt.json');
  const approved = project.loadSpec(root, spec.id).change.approval;
  const scope = io.read(root, spec.relative + '/' + approved.snapshot);
  const moved = manage(root, 'rename', spec.id, { ...author, name: 'Relatórios', number: '7' });
  assert.equal(moved.to, 'agents/specs/007-relatorios');
  const renamed = project.loadSpec(root, '007-relatorios');
  assert.equal(renamed.id, spec.id);
  assert.equal(project.approvalValid(root, renamed), true);
  assert.equal(project.inputDigest(root, renamed).digest, fingerprint);
  assert.equal(io.read(root, renamed.relative + '/runs/' + run.run_id + '/receipt.json'), previousRun);
  assert.equal(io.read(root, renamed.relative + '/' + approved.snapshot), scope);
  assert.equal(currentReceipt(root, renamed).verdict, 'passed');
  const closed = close(root, spec.id, { by: 'Reviewer', note: 'Local change.', archive: true });
  assert.equal(closed.path, 'agents/archive/007-relatorios');
  assert.equal(catalog.registry(root).records[spec.id].path, closed.path);
  assert.equal(cli(root, ['reopen', spec.id, '--by', 'Reviewer', '--reason', 'Recheck', '--json']).status, 0);
  assert.equal(project.loadSpec(root, spec.id).relative, 'agents/specs/007-relatorios');
  assert.throws(() => close(root, spec.id, { by: 'Reviewer', note: 'Local change.' }), /verification receipt/);
});

test('manual folder rename is discovered by manifest and reconciled without editing scope', t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  const before = project.scopeDigest(root, project.loadSpec(root, spec.id));
  fs.renameSync(io.resolve(root, spec.relative), io.resolve(root, 'agents/specs/preferred-name'));
  assert.equal(project.loadSpec(root, spec.id).relative, 'agents/specs/preferred-name');
  const unchanged = snapshot(root);
  assert.ok(reconcile(root, { dryRun: true }).updates.some(item => item.id === spec.id));
  assert.deepEqual(snapshot(root), unchanged);
  reconcile(root);
  assert.equal(catalog.registry(root).records[spec.id].path, 'agents/specs/preferred-name');
  assert.equal(project.scopeDigest(root, project.loadSpec(root, spec.id)), before);
  assert.equal(project.loadSpec(root, 'preferred-name').id, spec.id);
});

test('archive and restore are organizational operations for unfinished and cancelled specs', t => {
  const { root, spec } = fixture(t);
  const archived = manage(root, 'archive', spec.id, author);
  assert.equal(archived.status, 'draft');
  assert.equal(check(root, spec.id).valid, true);
  assert.match(check(root, spec.id, { phase: 'implement' }).errors.join('\n'), /archived/);
  assert.throws(() => approve(root, spec.id, 'Reviewer'), /Restore/);
  manage(root, 'restore', spec.id, author);
  assert.equal(project.loadSpec(root, spec.id).change.status, 'draft');
  assert.equal(cli(root, ['cancel', spec.id, '--by', 'Reviewer', '--reason', 'No longer needed', '--json']).status, 0);
  manage(root, 'archive', spec.id, author);
  assert.equal(project.loadSpec(root, spec.id).change.status, 'cancelled');
  manage(root, 'restore', spec.id, author);
  assert.equal(project.loadSpec(root, spec.id).change.status, 'cancelled');
  assert.equal(io.read(root, 'arithmetic.js'), 'exports.add = (a, b) => a + b;\n');
});

test('recoverable removal leaves application code intact and restore recovers the original spec', t => {
  const { root, spec } = fixture(t);
  const contract = io.read(root, spec.relative + '/SPEC.md');
  const removed = manage(root, 'remove', spec.id, author);
  assert.ok(removed.to.startsWith('agents/.sdd/trash/'));
  assert.equal(project.specDirectories(root).length, 0);
  assert.equal(catalog.dependency(root, spec.id).missing, true);
  assert.equal(io.read(root, 'arithmetic.js'), 'exports.add = (a, b) => a + b;\n');
  manage(root, 'restore', spec.id, author);
  assert.equal(io.read(root, spec.relative + '/SPEC.md'), contract);
  assert.equal(project.loadSpec(root, spec.id).change.status, 'draft');
  assert.notEqual(project.createSpec(root, 'new-work', 'light').id.split('-')[0], spec.id.split('-')[0]);
});

test('permanent removal retains historical closure and permits a consumer to perform its own fresh verification', async t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  await verify(root, spec.id);
  close(root, spec.id, { by: 'Reviewer', note: 'No lasting contract.', archive: true });
  const archived = project.loadSpec(root, spec.id);
  const next = followup(root, archived, [spec.id]);
  const preview = manage(root, 'remove', spec.id, { ...author, permanent: true, dryRun: true });
  assert.ok(preview.impacts.some(item => item.spec === next.id && item.field === 'depends_on'));
  manage(root, 'remove', spec.id, { ...author, permanent: true });
  assert.equal(io.exists(root, archived.relative), false);
  assert.equal(catalog.registry(root).records[spec.id].availability, 'purged');
  approve(root, next.id, 'Reviewer');
  const checked = check(root, next.id, { phase: 'implement' });
  assert.equal(checked.valid, true, checked.errors.join('\n'));
  assert.match(checked.warnings.join('\n'), /retained historical closure/);
  assert.equal((await verify(root, next.id)).verdict, 'passed');
  const status = cli(root, ['status', spec.id, '--json']);
  assert.equal(status.status, 0, status.stdout);
  assert.equal(JSON.parse(status.stdout)[0].historical_only, true);
});

test('manual deletion of a closed spec is diagnosed without invalidating a consumer solely for historical loss', async t => {
  const { root, spec } = fixture(t);
  approve(root, spec.id, 'Reviewer');
  await verify(root, spec.id);
  close(root, spec.id, { by: 'Reviewer', note: 'No lasting contract.' });
  const next = followup(root, spec, [spec.id]);
  fs.rmSync(io.resolve(root, spec.relative), { recursive: true });
  const result = reconcile(root);
  assert.ok(result.missing.some(item => item.id === spec.id && item.retained_closure));
  approve(root, next.id, 'Reviewer');
  assert.equal(check(root, next.id, { phase: 'implement' }).valid, true);
  assert.ok(context(root, next.id).warnings.some(item => item.includes('retained historical closure')));
});

test('missing unfinished prerequisites allow planning and explicit local repair but never invent completion', t => {
  const { root, spec } = fixture(t);
  const next = followup(root, spec, [spec.id]);
  fs.rmSync(io.resolve(root, spec.relative), { recursive: true });
  const plan = check(root, next.id);
  assert.equal(plan.valid, true);
  assert.match(plan.warnings.join('\n'), /Unresolved dependency/);
  approve(root, next.id, 'Reviewer');
  assert.match(check(root, next.id, { phase: 'implement' }).errors.join('\n'), /Unresolved dependency/);
  assert.ok(context(root, next.id, { phase: 'plan' }).warnings.some(item => item.includes('Unresolved dependency')));
  assert.equal(reconcile(root, { dryRun: true }).issues.find(item => item.spec === next.id).kind, 'unresolved-prerequisite');
  const repaired = project.loadSpec(root, next.id);
  repaired.change.depends_on = [];
  repaired.change.related = [spec.id];
  project.writeChange(root, repaired);
  revise(root, next.id, { by: 'Reviewer', reason: 'Inspected current arithmetic contract and consumer regression; historical plan is no longer a prerequisite.' });
  approve(root, next.id, 'Reviewer');
  assert.equal(check(root, next.id, { phase: 'implement' }).valid, true);
  assert.equal(project.loadSpec(root, next.id).id, next.id);
  assert.equal(catalog.dependency(root, spec.id).missing, true);
});

test('historical links and explicitly historical sources are optional; required sources remain required', t => {
  const { root, spec } = fixture(t);
  spec.change.related = ['999-deleted'];
  spec.change.context = [{ path: 'agents/specs/999-deleted/RESEARCH.md', historical: true }];
  project.writeChange(root, spec);
  assert.equal(check(root, spec.id).valid, true);
  assert.match(check(root, spec.id).warnings.join('\n'), /Historical/);
  assert.ok(context(root, spec.id).warnings.some(item => item.includes('unavailable')));
  const digest = project.inputDigest(root, spec).digest;
  assert.equal(typeof digest, 'string');
  spec.change.context = ['agents/specs/999-deleted/RESEARCH.md'];
  project.writeChange(root, spec);
  assert.equal(check(root, spec.id).valid, false);
  assert.throws(() => context(root, spec.id), /ENOENT/);
});

test('renaming a referenced spec preserves consumer approval and fingerprints with actual source provenance', t => {
  const { root, spec } = fixture(t);
  const next = followup(root, spec);
  next.change.context = [{ path: spec.relative + '/SPEC.md', section: 'Scope' }];
  project.writeChange(root, next);
  approve(root, next.id, 'Reviewer');
  const before = project.inputDigest(root, project.loadSpec(root, next.id)).digest;
  const moved = manage(root, 'rename', spec.id, { ...author, name: 'new-folder', number: '12' });
  const current = project.loadSpec(root, next.id);
  assert.equal(project.approvalValid(root, current), true);
  assert.equal(project.inputDigest(root, current).digest, before);
  assert.equal(check(root, next.id).valid, true);
  assert.ok(context(root, next.id).entries.some(item => item.path === moved.to + '/SPEC.md'));
  fs.rmSync(io.resolve(root, moved.to), { recursive: true });
  assert.equal(check(root, next.id).valid, false);
});

test('dry-run lifecycle operations and rejected collisions do not change any files', t => {
  const { root, spec } = fixture(t);
  const next = followup(root, spec);
  const before = snapshot(root);
  for (const operation of ['rename', 'archive', 'remove']) {
    manage(root, operation, spec.id, { ...author, name: 'another-name', dryRun: true });
    assert.deepEqual(snapshot(root), before);
  }
  assert.throws(() => manage(root, 'rename', spec.id, { ...author, name: next.id, dryRun: true }), /destination already exists|conflicts/);
  assert.deepEqual(snapshot(root), before);
  assert.throws(() => manage(root, 'rename', spec.id, { ...author, name: '../../' }), /Folder name/);
  assert.throws(() => manage(root, 'rename', spec.id, { ...author, number: '0' }), /positive/);
  assert.deepEqual(snapshot(root), before);
});

test('manual duplicate identities are rejected instead of guessed or satisfied from retained metadata', t => {
  const { root, spec } = fixture(t);
  fs.cpSync(io.resolve(root, spec.relative), io.resolve(root, 'agents/specs/copy'), { recursive: true });
  assert.throws(() => project.loadSpec(root, spec.id), /Ambiguous/);
  assert.throws(() => reconcile(root), /Duplicate/);
  assert.throws(() => catalog.dependency(root, spec.id), /Ambiguous/);
});

test('renamed manual evidence paths and artifacts remain usable without rewriting observations', async t => {
  const { root, spec } = fixture(t, { method: 'manual' });
  approve(root, spec.id, 'Reviewer');
  const evidence = evidenceTemplate(root, spec.id);
  io.write(root, spec.relative + '/observation.txt', 'Observed 2 + 3 = 5.');
  const value = io.json(root, evidence.path);
  value.cases[0] = { ...value.cases[0], result: 'passed', by: 'Tester', at: new Date().toISOString(), notes: 'Observed locally.', artifacts: [spec.relative + '/observation.txt'] };
  io.writeJson(root, evidence.path, value);
  const observed = io.read(root, evidence.path);
  assert.equal((await verify(root, spec.id, { evidence: evidence.path })).verdict, 'passed');
  const moved = manage(root, 'rename', spec.id, { ...author, name: 'manual-renamed' });
  const current = project.loadSpec(root, spec.id);
  assert.equal(currentReceipt(root, current).verdict, 'passed');
  assert.equal(io.read(root, moved.to + '/EVIDENCE.json'), observed);
  assert.equal((await verify(root, spec.id, { evidence: evidence.path })).verdict, 'passed');
  io.write(root, moved.to + '/observation.txt', 'Altered observation.');
  assert.throws(() => currentReceipt(root, project.loadSpec(root, spec.id)), /artifact changed/);
});

test('renaming never turns a failed receipt into a passing one', async t => {
  const { root, spec } = fixture(t);
  editConfig(root, cfg => { cfg.checks[0].command = 'node -e "process.exit(1)"'; });
  approve(root, spec.id, 'Reviewer');
  assert.equal((await verify(root, spec.id)).verdict, 'failed');
  manage(root, 'rename', spec.id, { ...author, name: 'still-failing' });
  assert.throws(() => close(root, spec.id, { by: 'Reviewer', note: 'No lasting contract.' }), /full passed/);
});

test('historical-source disappearance invalidates the old receipt but does not prevent an honest new verification', async t => {
  const { root, spec } = fixture(t);
  io.write(root, 'agents/specs/historical-notes/source.md', '# Original supporting note');
  spec.change.sources = [{ path: 'agents/specs/historical-notes/source.md', historical: true }];
  project.writeChange(root, spec);
  approve(root, spec.id, 'Reviewer');
  await verify(root, spec.id);
  fs.rmSync(io.resolve(root, 'agents/specs/historical-notes'), { recursive: true });
  assert.throws(() => currentReceipt(root, project.loadSpec(root, spec.id)), /stale/);
  assert.equal((await verify(root, spec.id)).verdict, 'passed');
});

test('status defaults to active specs, --all includes archives and recoverable removals', t => {
  const { root, spec } = fixture(t);
  const next = followup(root, spec);
  manage(root, 'archive', spec.id, author);
  manage(root, 'remove', next.id, author);
  const active = cli(root, ['status', '--json']);
  assert.equal(active.status, 0, active.stdout);
  assert.deepEqual(JSON.parse(active.stdout), []);
  const all = cli(root, ['status', '--all', '--json']);
  assert.equal(all.status, 0, all.stdout);
  const result = JSON.parse(all.stdout);
  assert.equal(result.find(item => item.id === spec.id).location, 'archive');
  assert.equal(result.find(item => item.id === next.id).location, 'trash');
});

test('CLI supports management and read-only reconciliation diagnostics without requiring native harnesses', t => {
  const { root, spec } = fixture(t);
  const before = snapshot(root);
  const preview = cli(root, ['rename', spec.id, '--name', 'novo-nome', '--number', '8', '--by', 'Moisés', '--reason', 'Organização', '--dry-run', '--json']);
  assert.equal(preview.status, 0, preview.stdout);
  assert.deepEqual(snapshot(root), before);
  const renamed = cli(root, ['rename', spec.id, '--name', 'novo-nome', '--number', '8', '--by', 'Moisés', '--reason', 'Organização', '--json']);
  assert.equal(renamed.status, 0, renamed.stdout);
  assert.equal(JSON.parse(renamed.stdout).to, 'agents/specs/008-novo-nome');
  const inspected = cli(root, ['reconcile', '--dry-run', '--json']);
  assert.equal(inspected.status, 0, inspected.stdout);
  assert.equal(JSON.parse(inspected.stdout).dry_run, true);
});

test('failed registry persistence rolls back the folder move and administrative event', t => {
  const { root, spec } = fixture(t);
  const before = snapshot(root);
  const original = io.writeJson;
  let interrupted = false;
  io.writeJson = (projectRoot, file, value, options) => {
    if (file === catalog.REGISTRY && !interrupted) {
      interrupted = true;
      throw new Error('Simulated full disk.');
    }
    return original(projectRoot, file, value, options);
  };
  try {
    assert.throws(() => manage(root, 'rename', spec.id, { ...author, name: 'rollback' }), /full disk/);
  } finally { io.writeJson = original; }
  assert.deepEqual(snapshot(root), before);
  assert.equal(io.exists(root, 'agents/specs/rollback'), false);
  assert.equal(project.loadSpec(root, spec.id).relative, spec.relative);
});

test('a legacy ID-only registry cannot manufacture the state of manually discarded content', t => {
  const { root, spec } = fixture(t);
  fs.rmSync(io.resolve(root, spec.relative), { recursive: true });
  io.writeJson(root, catalog.REGISTRY, { ids: [spec.id] });
  const result = reconcile(root);
  assert.ok(result.missing.some(item => item.id === spec.id && item.previous_status === null && !item.retained_closure));
  assert.equal(catalog.registry(root).records[spec.id].status, 'unknown');
  assert.equal(catalog.dependency(root, spec.id).missing, true);
});


test('permanently discarded unfinished work is never accepted as a completed prerequisite', t => {
  const { root, spec } = fixture(t);
  const next = followup(root, spec, [spec.id]);
  manage(root, 'remove', spec.id, { ...author, permanent: true });
  assert.equal(catalog.dependency(root, spec.id).missing, true);
  assert.equal(check(root, next.id).valid, true);
  approve(root, next.id, 'Reviewer');
  assert.match(check(root, next.id, { phase: 'implement' }).errors.join('\n'), /Unresolved dependency/);
});

test('a corrupted unrelated manifest is diagnosed locally without blocking a healthy spec', t => {
  const { root, spec } = fixture(t);
  const broken = followup(root, spec);
  io.write(root, broken.relative + '/change.yaml', 'id: [broken\n');
  assert.equal(check(root, spec.id).valid, true);
  assert.equal(check(root, broken.id).valid, false);
  const healthy = project.loadSpec(root, spec.id);
  healthy.change.related = [broken.id];
  project.writeChange(root, healthy);
  assert.equal(check(root, spec.id).valid, true);
  assert.match(check(root, spec.id).warnings.join('\n'), /Historical spec cannot be consulted/);
  assert.ok(reconcile(root, { dryRun: true }).issues.some(item => item.kind === 'invalid-manifest' && item.path === broken.relative));
  const status = cli(root, ['status', '--json']);
  assert.equal(status.status, 0, status.stdout);
  assert.equal(JSON.parse(status.stdout).find(item => item.id === broken.id).status, 'invalid');
  assert.equal(JSON.parse(status.stdout).find(item => item.id === spec.id).status, 'draft');
  const moved = manage(root, 'rename', spec.id, { ...author, name: 'healthy-renamed' });
  assert.ok(moved.impacts.some(item => item.spec === broken.id && item.field === 'manifest'));
});

test('missing manifest in a manually renamed folder is reported without fabricating a retained closure', t => {
  const { root, spec } = fixture(t);
  manage(root, 'rename', spec.id, { ...author, name: 'different-name' });
  fs.unlinkSync(io.resolve(root, 'agents/specs/different-name/change.yaml'));
  assert.throws(() => project.loadSpec(root, spec.id), /missing its manifest/);
  assert.ok(reconcile(root, { dryRun: true }).issues.some(item => item.kind === 'invalid-manifest'));
});

test('reserved identities cannot be reassigned to another spec, including after permanent removal', t => {
  const { root, spec } = fixture(t);
  const next = followup(root, spec);
  manage(root, 'remove', spec.id, { ...author, permanent: true });
  assert.throws(() => manage(root, 'rename', next.id, { ...author, name: spec.id, dryRun: true }), /reserved/);
  fs.renameSync(io.resolve(root, next.relative), io.resolve(root, spec.relative));
  assert.equal(catalog.dependency(root, spec.id).missing, true);
  assert.throws(() => catalog.referencePath(root, spec.relative + '/SPEC.md'), /conflicts with a reserved/);
  assert.equal(project.loadSpec(root, next.id).id, next.id);
});

test('visual numbering can be reorganized while ambiguous numeric shortcuts require a full identity', t => {
  const { root, spec } = fixture(t);
  const next = followup(root, spec);
  manage(root, 'rename', spec.id, { ...author, number: '2' });
  assert.throws(() => project.loadSpec(root, '002'), /Ambiguous/);
  assert.equal(project.loadSpec(root, spec.id).id, spec.id);
  assert.equal(project.loadSpec(root, next.id).id, next.id);
});

test('manual folder names with spaces and accents remain discoverable and reconcilable', t => {
  const { root, spec } = fixture(t);
  const target = 'agents/specs/Relatórios da equipe';
  fs.renameSync(io.resolve(root, spec.relative), io.resolve(root, target));
  reconcile(root);
  assert.equal(project.loadSpec(root, 'Relatórios da equipe').id, spec.id);
  assert.equal(catalog.referencePath(root, spec.relative + '/SPEC.md'), target + '/SPEC.md');
});

test('renamed external handoffs retain limited truth, guide hashes and reusable current paths', async t => {
  const { root, spec } = fixture(t, { mode: 'light', method: 'manual' });
  const doc = md.load(root, spec.relative + '/SPEC.md');
  doc.data.acceptance[0].environment = 'external';
  io.write(root, spec.relative + '/SPEC.md', md.markdown(doc.data, doc.body));
  approve(root, spec.id, 'Reviewer');
  const prepared = require('../lib/handoff').template(root, spec.id);
  const handoff = io.json(root, prepared.path);
  Object.assign(handoff.items[0], { reason: 'No isolated environment.', owner: 'Tester', expected: 'Observe the acceptance result.',
    safety: 'Do not modify production.', resume_when: 'An isolated environment is available.' });
  io.writeJson(root, prepared.path, handoff);
  assert.equal((await verify(root, spec.id, { handoff: prepared.path })).verdict, 'limited');
  manage(root, 'rename', spec.id, { ...author, name: 'external-renamed', number: '9' });
  assert.equal(currentReceipt(root, project.loadSpec(root, spec.id)).acceptance_verified, false);
  assert.equal((await verify(root, spec.id, { handoff: prepared.path })).verdict, 'limited');
  assert.equal(close(root, spec.id, { by: 'Reviewer', note: 'Await external validation.' }).closure.outcome, 'implemented_with_limitations');
});

test('interrupted permanent deletion is reported honestly and preserves recoverable remaining content', t => {
  const { root, spec } = fixture(t);
  const original = fs.rmSync;
  let interrupted = false;
  fs.rmSync = (file, options) => {
    if (!interrupted && String(file).replace(/\\/g, '/').includes('/agents/.sdd/trash/')) {
      interrupted = true;
      throw new Error('Simulated filesystem failure.');
    }
    return original(file, options);
  };
  try {
    assert.throws(() => manage(root, 'remove', spec.id, { ...author, permanent: true }), /interrupted/);
  } finally { fs.rmSync = original; }
  assert.equal(catalog.registry(root).records[spec.id].availability, 'purge-incomplete');
  manage(root, 'restore', spec.id, author);
  assert.equal(project.loadSpec(root, spec.id).relative, spec.relative);
});
