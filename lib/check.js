'use strict';

const io = require('./io');
const md = require('./markdown');
const project = require('./project');
const quality = require('./quality');

function check(root, id, { phase = 'plan', final = false } = {}) {
  const errors = [];
  const warnings = [];
  let spec;
  let specification;
  let tasks = [];
  const fail = message => errors.push(message);
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  try {
    if (!project.PHASES.includes(phase)) throw new Error('Unknown phase: ' + phase);
    const cfg = project.config(root);
    spec = project.loadSpec(root, id);
    if (spec.legacy) throw new Error('Legacy spec: run sdd migrate ' + spec.id + ', then normalize its front matter using docs/migration.md');
    const change = spec.change;
    if (!nonempty(change.title)) fail('change.title is required');
    if (!project.MODES.includes(change.mode)) fail('Invalid change.mode');
    if (!['draft', 'implementing', 'implemented', 'verified', 'closed', 'cancelled'].includes(change.status)) fail('Invalid change.status');
    for (const field of ['capabilities', 'decisions', 'skills', 'depends_on', 'sources', 'context']) {
      if (!Array.isArray(change[field])) throw new Error('change.' + field + ' must be an array');
      if (!['context', 'sources'].includes(field) && change[field].some(x => !nonempty(x))) throw new Error('change.' + field + ' must contain strings');
      if (new Set(change[field].map(x => JSON.stringify(x))).size !== change[field].length) fail('Duplicate change.' + field + ' entry');
    }
    for (const ref of [...change.capabilities, ...change.decisions]) {
      md.load(root, ref, false);
    }
    for (const ref of [...change.context, ...change.sources]) {
      const file = typeof ref === 'string' ? ref : ref?.path;
      const document = md.load(root, file, false);
      if (typeof ref === 'object' && ref.section) md.section(document.body, ref.section, file);
    }
    for (const [field, kind] of [['capabilities', 'capability'], ['decisions', 'decision']]) {
      for (const file of change[field]) {
        const { data } = md.load(root, file);
        if (data.kind !== kind || data.status !== 'active') fail(file + ': expected active ' + kind);
      }
    }
    const catalog = project.skills(root);
    for (const name of change.skills) if (!catalog.some(s => s.name === name)) fail('Unknown skill: ' + name);
    specification = md.load(root, spec.relative + '/SPEC.md');
    const data = specification.data;
    if (data.schema_version !== 2 || data.artifact !== 'spec' || data.id !== spec.id) fail('SPEC.md metadata does not match this spec');
    if (data.legacy) fail('Legacy content needs reviewed requirements and acceptance metadata; preserved Markdown is not automatically approved');
    if (!Array.isArray(data.requirements) || !Array.isArray(data.acceptance)) throw new Error('SPEC.md requires requirements and acceptance arrays');
    if (!data.requirements.length || !data.acceptance.length) fail('Define at least one requirement and one acceptance criterion');
    const requirements = new Map();
    const allRequirementIds = [];
    for (const requirement of data.requirements) {
      if (!/^(REQ|BR|EB)\d+$/.test(requirement.id) || requirements.has(requirement.id) || allRequirementIds.includes(requirement.id)) fail('Invalid or duplicate requirement ID: ' + requirement.id);
      allRequirementIds.push(requirement.id);
      if (!nonempty(requirement.description)) fail('Requirement description is required: ' + requirement.id);
      if (requirement.status === 'cancelled') {
        if (!nonempty(requirement.cancellation?.reason) || !nonempty(requirement.cancellation?.by)) fail('Cancelled requirement needs reason and actor: ' + requirement.id);
      } else {
        if (requirement.status && requirement.status !== 'active') fail('Invalid requirement status: ' + requirement.id);
        requirements.set(requirement.id, requirement);
      }
    }
    const acceptance = new Map();
    const allAcceptanceIds = [];
    const covered = new Set();
    const checkNames = new Set(cfg.checks.map(x => x.name));
    for (const criterion of data.acceptance) {
      if (!/^(AC|TC)\d+$/.test(criterion.id) || allAcceptanceIds.includes(criterion.id)) fail('Invalid or duplicate acceptance ID: ' + criterion.id);
      allAcceptanceIds.push(criterion.id);
      if (!nonempty(criterion.description)) fail('Acceptance description is required: ' + criterion.id);
      if (criterion.status === 'cancelled') {
        if (!nonempty(criterion.cancellation?.reason) || !nonempty(criterion.cancellation?.by)) fail('Cancelled acceptance needs reason and actor: ' + criterion.id);
        continue;
      }
      if (criterion.status && criterion.status !== 'active') fail('Invalid acceptance status: ' + criterion.id);
      acceptance.set(criterion.id, criterion);
      if (!['automated', 'manual', 'inspection'].includes(criterion.method)) fail('Invalid verification method: ' + criterion.id);
      if (criterion.environment !== undefined && !['local', 'external'].includes(criterion.environment)) fail('Invalid criterion environment: ' + criterion.id);
      if (!Array.isArray(criterion.covers) || !criterion.covers.length) fail('Acceptance needs covers: ' + criterion.id);
      else for (const ref of criterion.covers) {
        if (!requirements.has(ref)) fail(criterion.id + ' references inactive/unknown requirement ' + ref);
        else covered.add(ref);
      }
      if (criterion.method === 'automated') {
        if (!Array.isArray(criterion.checks) || !criterion.checks.length) fail('Automated acceptance needs configured checks: ' + criterion.id);
        else for (const name of criterion.checks) {
          if (!checkNames.has(name)) fail('Unknown check ' + name + ' in ' + criterion.id);
          else if (quality.checkSettings(cfg.checks.find(x => x.name === name)).level === 'advisory') fail('Acceptance must use required checks, not advisory checks: ' + criterion.id);
        }
        if (criterion.environment === 'external' && !quality.externalCriterion(criterion, cfg)) fail('Automated external acceptance needs an external configured check: ' + criterion.id);
      }
    }
    for (const requirement of requirements.keys()) if (!covered.has(requirement)) fail('Requirement has no active acceptance criterion: ' + requirement);
    if (!requirements.size || !acceptance.size) fail('A change needs at least one active requirement and acceptance criterion');

    const tasksPath = spec.relative + '/TASK.md';
    if (io.exists(root, tasksPath)) {
      const source = md.load(root, tasksPath);
      if (source.data.schema_version !== 2 || source.data.artifact !== 'tasks' || source.data.id !== spec.id) fail('TASK.md metadata does not match this spec');
      if (!Array.isArray(source.data.tasks)) throw new Error('TASK.md requires a tasks array');
      tasks = source.data.tasks;
    } else if (change.mode !== 'light') fail('TASK.md is required for standard and rigorous changes');
    if (change.mode !== 'light' && !tasks.length) fail('Define at least one task');
    const taskIds = new Set();
    const taskCoverage = new Set();
    for (const task of tasks) {
      if (!/^T\d+$/.test(task.id) || taskIds.has(task.id)) fail('Invalid or duplicate task ID: ' + task.id);
      taskIds.add(task.id);
      if (!nonempty(task.title) || !nonempty(task.verify)) fail('Task needs title and observable verify: ' + task.id);
      if (!['pending', 'in_progress', 'done', 'deferred', 'cancelled'].includes(task.status)) fail('Invalid task status: ' + task.id);
      if (task.kind !== undefined && !['implementation', 'verification'].includes(task.kind)) fail('Invalid task kind: ' + task.id);
      if (!Array.isArray(task.depends_on) || !Array.isArray(task.covers)) fail('Task requires covers and depends_on arrays: ' + task.id);
      else {
        for (const ref of task.covers) {
          const known = task.status === 'cancelled'
            ? allRequirementIds.includes(ref) || allAcceptanceIds.includes(ref)
            : requirements.has(ref) || acceptance.has(ref);
          if (!known) fail(task.id + ' references inactive/unknown item ' + ref);
          if (task.status !== 'cancelled') taskCoverage.add(ref);
        }
        if (!task.covers.length && task.status !== 'cancelled') fail('Task needs covers: ' + task.id);
      }
      if (task.status === 'cancelled' && (!nonempty(task.cancellation?.reason) || !nonempty(task.cancellation?.by))) fail('Cancelled task needs reason and actor: ' + task.id);
      if (task.status === 'deferred') {
        if (task.kind !== 'verification' || !nonempty(task.deferral?.reason) || !nonempty(task.deferral?.by)) fail('Only verification tasks may be deferred, with reason and actor: ' + task.id);
        if (!task.covers?.length || task.covers.some(ref => !acceptance.has(ref) || !quality.externalCriterion(acceptance.get(ref), cfg))) fail('Deferred tasks must cover external acceptance IDs only: ' + task.id);
      }
      if (final && !['done', 'deferred', 'cancelled'].includes(task.status)) fail('Task is unfinished: ' + task.id);
    }
    for (const task of tasks) for (const dependency of task.depends_on || []) {
      if (!taskIds.has(dependency)) fail(task.id + ' has unknown dependency ' + dependency);
      const target = tasks.find(t => t.id === dependency);
      if (['done', 'in_progress'].includes(task.status) && target && target.status !== 'done') fail(task.id + ' depends on an unfinished/cancelled task: ' + dependency);
    }
    if (tasks.length) {
      for (const requirement of requirements.keys()) {
        const indirect = [...acceptance.values()].filter(ac => ac.covers?.includes(requirement)).some(ac => taskCoverage.has(ac.id));
        if (!taskCoverage.has(requirement) && !indirect) fail('Requirement has no active implementing task: ' + requirement);
      }
    }
    cycle(tasks.map(t => [t.id, t.depends_on || []]), fail, 'task');
    for (const field of ['requirements', 'acceptance', 'tasks']) {
      const ids = field === 'requirements' ? allRequirementIds : field === 'acceptance' ? allAcceptanceIds : [...taskIds];
      for (const old of change.id_ledger?.[field] || []) if (!ids.includes(old)) fail('Do not delete historical ID ' + old + '; retain it with status cancelled and a reason');
    }
    if (change.mode === 'rigorous') {
      const research = md.load(root, spec.relative + '/RESEARCH.md');
      if (research.data.schema_version !== 2 || research.data.artifact !== 'research' || research.data.id !== spec.id || !research.body.trim()) fail('Rigorous mode requires reviewed RESEARCH.md with matching metadata');
    }
    const graph = [];
    const visiting = new Set();
    function dependencies(current) {
      if (visiting.has(current.id)) return;
      visiting.add(current.id);
      graph.push([current.id, current.change.depends_on]);
      for (const dependency of current.change.depends_on) {
        const target = project.loadSpec(root, dependency);
        if (target.legacy) { fail('Dependency needs migration: ' + dependency); continue; }
        if (!Array.isArray(target.change.depends_on)) throw new Error('Invalid dependency manifest: ' + dependency);
        if (['implement', 'validate', 'close'].includes(phase) && target.change.status !== 'closed') fail('Dependency is not closed: ' + dependency);
        if (target.change.closure?.validation === 'limited') warnings.push('Dependency has pending external verification: ' + dependency);
        dependencies(target);
      }
    }
    dependencies(spec);
    cycle(graph, fail, 'spec');
    if (['implement', 'validate', 'close'].includes(phase) && (cfg.approval === 'required' || change.mode === 'rigorous') && !project.approvalValid(root, spec)) {
      fail('Scope approval is missing or stale. Review the plan and record the user authorization with sdd approve ' + spec.id + ' --by NAME');
    }
    if (['implement', 'validate'].includes(phase) && ['closed', 'cancelled'].includes(change.status)) fail('Change is ' + change.status + '; reopen it before further implementation or verification');
    if (!change.capabilities.length) warnings.push('No lasting capability document selected; close will require an explicit consolidation note');
    return { valid: !errors.length, errors, warnings, spec, specification, tasks };
  } catch (error) {
    fail(error.message);
    return { valid: false, errors, warnings, spec, specification, tasks };
  }
}

function cycle(entries, fail, kind) {
  const graph = new Map(entries);
  const active = new Set();
  const done = new Set();
  function visit(id) {
    if (active.has(id)) { fail('Circular ' + kind + ' dependency at ' + id); return; }
    if (done.has(id)) return;
    active.add(id);
    for (const child of graph.get(id) || []) if (graph.has(child)) visit(child);
    active.delete(id);
    done.add(id);
  }
  for (const id of graph.keys()) visit(id);
}

function requireValid(result) {
  if (!result.valid) throw new Error(result.errors.join('\n'));
  return result;
}

function approve(root, id, by) {
  if (typeof by !== 'string' || !by.trim()) throw new Error('Provide --by to record who authorized this scope');
  const result = requireValid(check(root, id));
  const { spec, specification, tasks } = result;
  if (['closed', 'cancelled'].includes(spec.change.status)) throw new Error('Reopen this change before approving it');
  const previous = spec.change.id_ledger || {};
  spec.change.id_ledger = Object.fromEntries(['requirements', 'acceptance', 'tasks'].map(field => {
    const current = field === 'tasks' ? tasks : specification.data[field];
    return [field, [...new Set([...(previous[field] || []), ...current.map(x => x.id)])]];
  }));
  const digest = project.scopeDigest(root, spec);
  const snapshot = require('./history').record(root, spec, 'approval', {
    by: by.trim(), scope_digest: digest, scope: project.scopeDocument(root, spec),
  });
  spec.change.approval = { by: by.trim(), at: snapshot.at, digest, snapshot: snapshot.path };
  spec.change.status = 'implementing';
  project.writeChange(root, spec);
  return spec.change.approval;
}

module.exports = { check, requireValid, approve };
