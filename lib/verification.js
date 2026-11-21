'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const io = require('./io');
const md = require('./markdown');
const project = require('./project');
const catalog = require('./catalog');
const { check, requireValid } = require('./check');
const quality = require('./quality');
const handoff = require('./handoff');

function evidenceTemplate(root, id, out) {
  const { spec, specification } = requireValid(check(root, id));
  const fingerprint = project.inputDigest(root, spec).digest;
  let file = out || spec.relative + '/EVIDENCE.json';
  if (!out && io.exists(root, file)) file = spec.relative + '/EVIDENCE-' + fingerprint.slice(0, 12) + '-' + crypto.randomUUID().slice(0, 8) + '.json';
  const value = {
    schema_version: 2, id: spec.id, input_digest: fingerprint,
    cases: specification.data.acceptance.filter(ac => ac.status !== 'cancelled' && ac.method !== 'automated').map(ac => ({
      id: ac.id, result: 'not_run', by: '', at: '', notes: '', artifacts: [],
    })),
  };
  io.writeJson(root, file, value, { exclusive: true });
  return { path: file, ...value };
}

function runCheck(root, checkDefinition) {
  return new Promise(resolve => {
    const started = new Date().toISOString();
    let output = '';
    let truncated = false;
    let timedOut = false;
    let settled = false;
    const env = { ...process.env };
    // A verification launched from node:test must run its own tests rather than inherit recursive-run suppression.
    delete env.NODE_TEST_CONTEXT;
    const child = spawn(checkDefinition.command, {
      cwd: root, env, shell: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
    });
    function capture(chunk) {
      const remaining = 1024 * 1024 - Buffer.byteLength(output);
      if (chunk.length > remaining) truncated = true;
      if (remaining > 0) output += chunk.subarray(0, remaining).toString();
    }
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    const timeout = setTimeout(() => {
      timedOut = true;
      try {
        if (process.platform === 'win32') {
          const termination = spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
          if (termination.status !== 0) child.kill('SIGKILL');
        }
        else process.kill(-child.pid, 'SIGKILL');
      } catch (error) {
        if (error.code !== 'ESRCH') capture(Buffer.from(error.message));
      }
    }, checkDefinition.timeout_ms);
    function finish(code, signal, error) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) capture(Buffer.from(error.message));
      resolve({
        name: checkDefinition.name, command: checkDefinition.command, started, finished: new Date().toISOString(),
        exit_code: code, signal: signal || null, timed_out: timedOut, truncated,
        result: code === 0 && !timedOut && !error ? 'passed' : 'failed', output,
      });
    }
    child.on('error', error => finish(null, null, error));
    child.on('close', (code, signal) => finish(code, signal));
  });
}

function readEvidence(root, file, spec, fingerprint) {
  if (!file) return { cases: [], artifacts: {} };
  file = catalog.referencePath(root, file);
  const evidence = io.json(root, file);
  if (evidence.schema_version !== 2 || evidence.id !== spec.id || evidence.input_digest !== fingerprint) {
    throw new Error('Manual/inspection evidence is stale or belongs to another spec. Run sdd evidence ' + spec.id + ', repeat the affected observations, and pass the returned path to --evidence.');
  }
  if (!Array.isArray(evidence.cases)) throw new Error('Evidence cases must be an array');
  const seen = new Set();
  const artifacts = {};
  const acceptance = md.load(root, spec.relative + '/SPEC.md').data.acceptance;
  for (const item of evidence.cases) {
    if (seen.has(item.id)) throw new Error('Duplicate evidence case: ' + item.id);
    seen.add(item.id);
    const criterion = acceptance.find(ac => ac.id === item.id && ac.status !== 'cancelled');
    if (!criterion || criterion.method === 'automated') throw new Error('Evidence must reference active manual/inspection criteria: ' + item.id);
    if (!['passed', 'failed', 'not_run', 'blocked'].includes(item.result)) throw new Error('Invalid evidence result: ' + item.id);
    if (!Array.isArray(item.artifacts)) throw new Error('Evidence artifacts must be an array: ' + item.id);
    if (['passed', 'failed'].includes(item.result)) {
      if (typeof item.by !== 'string' || !item.by.trim() || typeof item.notes !== 'string' || !item.notes.trim() || !Number.isFinite(Date.parse(item.at))) {
        throw new Error('Executed evidence needs by, at and notes: ' + item.id);
      }
    }
    for (const artifact of item.artifacts) {
      artifacts[artifact] = io.hash(fs.readFileSync(io.resolve(root, catalog.referencePath(root, artifact))));
    }
  }
  return { cases: evidence.cases, artifacts };
}

async function verify(root, id, { scope = 'full', evidence: evidenceFile, handoff: handoffFile, runExternal = false } = {}) {
  if (!['full', 'partial'].includes(scope)) throw new Error('Verification scope must be full or partial');
  const { spec, specification, tasks } = requireValid(check(root, id, { phase: 'validate', final: scope === 'full' }));
  const fingerprint = project.inputDigest(root, spec).digest;
  const evidence = readEvidence(root, evidenceFile, spec, fingerprint);
  const cfg = project.config(root);
  const transfer = handoff.read(root, handoffFile, spec, fingerprint, specification, cfg);
  const previousFile = spec.relative + '/verification.json';
  const previous = io.exists(root, previousFile) ? io.json(root, previousFile) : null;
  const prior = previous?.input_digest === fingerprint ? previous : null;
  const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID().slice(0, 8);
  const runs = [];
  for (const definition of cfg.checks) {
    const policy = quality.checkSettings(definition);
    const deferred = transfer.items.get('check:' + definition.name);
    const execute = policy.environment !== 'external' || runExternal;
    const run = execute ? { ...await runCheck(root, definition), executed: true } : {
      name: definition.name, command: definition.command, started: null, finished: new Date().toISOString(),
      exit_code: null, signal: null, timed_out: false, truncated: false, executed: false,
      result: deferred?.result || 'not_run', output: deferred?.reason || 'External command was not requested; no execution took place.',
    };
    const knownFailure = prior?.checks.find(item => item.name === definition.name && item.result === 'failed');
    if (!execute && knownFailure) {
      run.result = 'failed';
      run.previous_failure_run = knownFailure.previous_failure_run || prior.run_id;
      run.output = 'Not executed in this run. A known failure for these same inputs remains unresolved: ' + run.previous_failure_run;
    }
    const log = 'runs/' + runId + '/' + definition.name + '.log';
    io.write(root, spec.relative + '/' + log, run.output + (run.truncated ? '\n[Output truncated at 1 MiB]\n' : ''));
    const { output, ...record } = run;
    runs.push({ ...record, ...policy, ...(deferred && !execute && !knownFailure && { deferral: summary(deferred) }), log, log_hash: io.hash(io.read(root, spec.relative + '/' + log)) });
  }
  const criteria = specification.data.acceptance.filter(ac => ac.status !== 'cancelled').map(ac => {
    if (ac.method === 'automated') {
      const checks = runs.filter(run => ac.checks.includes(run.name));
      const result = checks.some(run => run.result === 'failed') ? 'failed'
        : !checks.length || checks.some(run => run.result === 'not_run') ? 'not_run'
        : checks.some(run => ['deferred', 'not_applicable'].includes(run.result)) ? 'deferred' : 'passed';
      return { id: ac.id, method: ac.method, result, checks: ac.checks };
    }
    const entry = evidence.cases.find(item => item.id === ac.id);
    const deferred = transfer.items.get('criterion:' + ac.id);
    const observed = entry && ['passed', 'failed'].includes(entry.result);
    const knownFailure = !observed && prior?.criteria.find(item => item.id === ac.id && item.result === 'failed');
    if (knownFailure) return { id: ac.id, method: ac.method, result: 'failed', evidence: knownFailure.evidence || null,
      previous_failure_run: knownFailure.previous_failure_run || prior.run_id };
    return { id: ac.id, method: ac.method, result: observed ? entry.result : deferred?.result || entry?.result || 'not_run',
      evidence: entry || null, ...(!observed && deferred && { deferral: summary(deferred) }) };
  });
  const unchanged = fingerprint === project.inputDigest(root, project.loadSpec(root, spec.id)).digest;
  const required = runs.filter(run => run.level === 'required');
  const deferredTasks = tasks.filter(task => task.status === 'deferred');
  const unresolvedTasks = deferredTasks.some(task => task.covers.some(id => !criteria.some(ac => ac.id === id && ['deferred', 'not_applicable'].includes(ac.result))));
  const unresolved = [...required, ...criteria].some(item => ['not_run', 'blocked'].includes(item.result)) || unresolvedTasks;
  const limited = [...required, ...criteria].some(item => ['deferred', 'not_applicable'].includes(item.result)) || deferredTasks.length;
  const pending = [
    ...runs.filter(run => run.deferral).map(run => ({ kind: 'check', id: run.name, ...run.deferral })),
    ...criteria.filter(ac => ac.deferral).map(ac => ({ kind: 'criterion', id: ac.id, ...ac.deferral })),
  ];
  const used = new Map([...transfer.items].filter(([key]) => pending.some(item => key === item.kind + ':' + item.id)));
  const guide = used.size ? handoff.guide(root, spec, used, runId) : null;
  const warnings = runs.filter(run => run.level === 'advisory' && run.result !== 'passed').map(run => 'Advisory check ' + run.name + ': ' + run.result);
  let verdict = 'passed';
  if (!unchanged || required.some(run => run.result === 'failed') || criteria.some(item => item.result === 'failed')) verdict = 'failed';
  else if (scope === 'partial' || unresolved) verdict = 'partial';
  else if (limited) verdict = 'limited';
  if (!used.size && verdict === 'passed' && scope === 'full' && io.exists(root, spec.relative + '/USER_TESTS.md')) {
    const pt = project.documentationSettings(cfg).language.toLowerCase().split('-')[0] === 'pt';
    io.write(root, spec.relative + '/USER_TESTS.md', (pt
      ? '# Verificação do usuário\n\nSem testes delegados pendentes nesta verificação. Consulte VALIDATION.md.\n'
      : '# User verification\n\nNo delegated tests are pending in this verification. See VALIDATION.md.\n') + '\nRun: ' + runId + '\n');
  }
  const receipt = {
    schema_version: 2, id: spec.id, run_id: runId, scope, verdict, at: new Date().toISOString(),
    input_digest: fingerprint, scope_digest: project.scopeDigest(root, spec), unchanged,
    task_states: tasks.map(t => ({ id: t.id, status: t.status })), checks: runs, criteria, artifacts: evidence.artifacts,
    acceptance_verified: unchanged && criteria.every(item => item.result === 'passed'),
    warnings, pending_verification: pending,
    handoff: transfer.record ? { ...transfer.record, ...(guide && { guide }) } : null,
    deferred_tasks: deferredTasks.map(task => ({ id: task.id, covers: task.covers, ...task.deferral })),
    limitations: ['Check-to-criterion links are declared by the project. Passing commands do not prove semantic test coverage.',
      'Commands execute with the current user permissions; configure an isolated test environment.'],
  };
  io.writeJson(root, spec.relative + '/runs/' + runId + '/receipt.json', receipt, { exclusive: true });
  io.writeJson(root, spec.relative + '/verification.json', receipt);
  const lines = [
    '# Verification — ' + spec.id, '', 'Verdict: ' + verdict, 'Scope: ' + scope,
    'Input digest: ' + fingerprint, 'Inputs unchanged during checks: ' + unchanged, '',
    'Acceptance fully verified: ' + receipt.acceptance_verified, '',
    '| Criterion | Method | Result |', '|---|---|---|',
    ...criteria.map(ac => '| ' + ac.id + ' | ' + ac.method + ' | ' + ac.result + ' |'), '',
    '## Checks', '', ...runs.map(run => '- ' + run.name + ': ' + run.result + ', ' + run.level + ', executed: ' + run.executed + ', exit ' + run.exit_code + ', log: ' + run.log),
    '', '## Limitations and user verification', '',
    ...(pending.length ? pending.map(item => '- ' + item.kind + ' ' + item.id + ': ' + item.result + '; ' + item.reason + '; owner: ' + item.owner) : ['No recorded external deferrals.']),
    ...(guide ? ['', 'Safe user-test instructions: USER_TESTS.md; preserved run copy: ' + guide.path] : []),
    ...warnings.map(item => '- ' + item),
    ...(unresolvedTasks ? ['Deferred tasks need matching current handoff results, or must be updated after actual verification.'] : []),
    '', '## Review', '', 'Review assertions, scope and failure cases. This report records execution; it is not a substitute for reviewing whether the tests exercise the intended behavior.',
  ];
  io.write(root, spec.relative + '/VALIDATION.md', md.markdown({ schema_version: 2, artifact: 'validation', id: spec.id, verdict, scope }, lines.join('\n')));
  spec.change.status = verdict === 'passed' && scope === 'full' ? 'verified' : verdict === 'limited' ? 'implemented' : 'implementing';
  project.writeChange(root, spec);
  return receipt;
}

function summary(item) {
  return Object.fromEntries(['result', 'reason', 'owner', 'environment', 'resume_when'].map(key => [key, item[key] ?? null]));
}

function currentReceipt(root, spec) {
  const file = spec.relative + '/verification.json';
  if (!io.exists(root, file)) throw new Error('No verification receipt; run sdd verify ' + spec.id);
  const receipt = io.json(root, file);
  if (receipt.schema_version !== 2 || receipt.id !== spec.id || receipt.scope !== 'full' || !['passed', 'limited'].includes(receipt.verdict) || !receipt.unchanged) {
    throw new Error('Closing requires a full passed verification or an explicit limited verification with a current handoff');
  }
  if (receipt.verdict === 'limited' && (!receipt.handoff || !receipt.pending_verification?.length)) throw new Error('Limited verification requires a recorded handoff');
  if (receipt.input_digest !== project.inputDigest(root, spec).digest || receipt.scope_digest !== project.scopeDigest(root, spec)) {
    throw new Error('Verification is stale; verify the current code and contract again');
  }
  for (const [file, expected] of Object.entries(receipt.artifacts || {})) {
    if (io.hash(fs.readFileSync(io.resolve(root, catalog.referencePath(root, file)))) !== expected) throw new Error('Evidence artifact changed: ' + file);
  }
  for (const run of receipt.checks || []) {
    if (io.hash(io.read(root, spec.relative + '/' + run.log)) !== run.log_hash) throw new Error('Verification log changed: ' + run.log);
  }
  for (const artifact of [receipt.handoff, receipt.handoff?.guide, receipt.handoff?.guide?.latest].filter(Boolean)) {
    if (io.hash(io.read(root, spec.relative + '/' + artifact.path)) !== artifact.hash) throw new Error('Handoff or user-test guide changed; verify again');
  }
  return receipt;
}

function close(root, id, { note, by, archive = false } = {}) {
  if (typeof by !== 'string' || !by.trim()) throw new Error('Provide --by to record the final review');
  const { spec } = requireValid(check(root, id, { phase: 'close', final: true }));
  if (spec.change.status === 'cancelled') throw new Error('A cancelled change cannot be closed');
  const receipt = currentReceipt(root, spec);
  if (!spec.change.capabilities.length && (typeof note !== 'string' || !note.trim())) {
    throw new Error('Provide --note explaining why this change needs no lasting capability update');
  }
  for (const file of spec.change.capabilities) {
    const doc = md.load(root, catalog.referencePath(root, file));
    if (!Array.isArray(doc.data.changes) || !doc.data.changes.includes(spec.id)) throw new Error(file + ': consolidate the verified behavior and add this spec ID to changes before verifying');
  }
  const target = 'agents/archive/' + require('node:path').posix.basename(spec.relative);
  if (archive && spec.relative !== target && io.exists(root, target)) throw new Error('Archive destination already exists: ' + target);
  spec.change.status = 'closed';
  spec.change.closure = { by: by.trim(), at: new Date().toISOString(), run_id: receipt.run_id,
    validation: receipt.verdict, acceptance_verified: receipt.acceptance_verified ?? true,
    pending_verification: receipt.pending_verification || [],
    outcome: receipt.verdict === 'limited' ? 'implemented_with_limitations' : 'verified',
    note: note || 'Consolidated in the selected capability documents.' };
  require('./history').record(root, spec, 'closure', spec.change.closure);
  project.writeChange(root, spec);
  if (archive && spec.relative !== target) {
    fs.mkdirSync(io.resolve(root, 'agents/archive'), { recursive: true });
    fs.renameSync(io.resolve(root, spec.relative), io.resolve(root, target));
    spec.relative = target;
    catalog.remember(root, spec);
  }
  return { id: spec.id, status: 'closed', path: spec.relative, closure: spec.change.closure };
}

module.exports = { evidenceTemplate, runCheck, readEvidence, verify, currentReceipt, close };
