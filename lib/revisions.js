'use strict';

const io = require('./io');
const md = require('./markdown');
const project = require('./project');
const { check, requireValid } = require('./check');
const history = require('./history');

function revise(root, id, { by, reason, dryRun = false } = {}) {
  if (!by?.trim() || !reason?.trim()) throw new Error('Provide --by and --reason for the scope revision');
  const { spec, tasks } = requireValid(check(root, id));
  if (['closed', 'cancelled'].includes(spec.change.status)) throw new Error('Reopen the change before revising its approved scope');
  const previous = spec.change.approval;
  if (!previous) throw new Error('No prior approval to revise; complete the plan and record actual authorization first');
  const digest = project.scopeDigest(root, spec);
  if (previous.digest === digest) throw new Error('The normative scope is unchanged; continue implementation or verification');
  const current = project.scopeDocument(root, spec);
  let old;
  if (previous.snapshot && io.exists(root, spec.relative + '/' + previous.snapshot)) {
    const snapshot = io.json(root, spec.relative + '/' + previous.snapshot);
    if (snapshot.id !== spec.id || snapshot.type !== 'approval' || io.digest(snapshot.scope) !== previous.digest) throw new Error('Prior approval snapshot does not match its recorded digest');
    old = snapshot.scope;
  }
  const changed = new Set();
  const compareItems = (before, after) => {
    const a = new Map((before || []).map(item => [item.id, item]));
    const b = new Map((after || []).map(item => [item.id, item]));
    for (const key of new Set([...a.keys(), ...b.keys()])) if (io.digest(a.get(key) ?? null) !== io.digest(b.get(key) ?? null)) changed.add(key);
  };
  compareItems(old?.specification?.data?.requirements, current.specification.data.requirements);
  compareItems(old?.specification?.data?.acceptance, current.specification.data.acceptance);
  const criteria = [...(old?.specification?.data?.acceptance || []), ...current.specification.data.acceptance];
  let linked;
  do {
    linked = changed.size;
    for (const criterion of criteria) {
      if (changed.has(criterion.id) || criterion.covers?.some(id => changed.has(id))) {
        changed.add(criterion.id);
        for (const id of criterion.covers || []) changed.add(id);
      }
    }
  } while (linked !== changed.size);
  const oldTasks = old?.tasks?.data?.tasks || [];
  const newTasks = current.tasks?.data?.tasks || [];
  const changedTasks = new Set(newTasks.filter(item => io.digest(item) !== io.digest(oldTasks.find(t => t.id === item.id) ?? null)).map(item => item.id));
  const reopenAll = !old || io.digest(old.change) !== io.digest(current.change) ||
    io.digest(old.policy) !== io.digest(current.policy) || old.specification.body !== current.specification.body ||
    old.tasks?.body !== current.tasks?.body;
  const reopened = new Set();
  for (const task of tasks) {
    if (['done', 'in_progress', 'deferred'].includes(task.status) && (reopenAll || changedTasks.has(task.id) || task.covers.some(item => changed.has(item)))) reopened.add(task.id);
  }
  let expanded;
  do {
    expanded = false;
    for (const task of tasks) {
      if (['done', 'in_progress', 'deferred'].includes(task.status) && !reopened.has(task.id) && task.depends_on.some(id => reopened.has(id))) {
        reopened.add(task.id);
        expanded = true;
      }
    }
  } while (expanded);
  const result = { id: spec.id, dry_run: dryRun, changed_items: [...changed], reopened_tasks: [...reopened],
    conservative: reopenAll, previous_digest: previous.digest, new_digest: digest };
  if (dryRun) return result;
  if (io.exists(root, spec.relative + '/TASK.md')) {
    const document = md.load(root, spec.relative + '/TASK.md');
    for (const task of document.data.tasks) if (reopened.has(task.id)) task.status = 'pending';
    io.write(root, spec.relative + '/TASK.md', md.markdown(document.data, document.body));
  }
  const event = history.record(root, spec, 'revision', { by: by.trim(), reason: reason.trim(), ...result, previous_approval: previous });
  spec.change.approval = null;
  spec.change.status = 'draft';
  spec.change.last_revision = { by: by.trim(), reason: reason.trim(), at: event.at, event: event.path };
  project.writeChange(root, spec);
  return { ...result, event: event.path, next: 'Review impacted code/tests and record authorization for the revised scope with sdd approve.' };
}

module.exports = { revise };
