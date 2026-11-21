#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { parseArgs } = require('node:util');
const io = require('../lib/io');
const project = require('../lib/project');
const validation = require('../lib/check');
const lifecycle = require('../lib/verification');
const installation = require('../lib/install');
const adapters = require('../lib/adapters');

const HELP = [
  'sdd-flow ' + installation.VERSION + ' — portable, evidence-based spec-driven development',
  '',
  'sdd init [--mode light|standard|rigorous] [--harness claude-code|opencode] [--docs]',
  'sdd docs [--types prd,roadmap,sd,ds,adr] [--dry-run]',
  'sdd new <name> [--mode light|standard|rigorous]',
  'sdd context <spec> [--phase implement] [--task T01] [--inspect] [--max-bytes N] [--json]',
  'sdd skills list | show <name>',
  'sdd check <spec> [--phase plan|implement|validate|close] [--final] [--json]',
  'sdd approve <spec> --by <name>',
  'sdd revise <spec> --by <name> --reason <reason> [--dry-run]',
  'sdd evidence <spec> [--out path.json]',
  'sdd handoff <spec>',
  'sdd verify <spec> [--scope full|partial] [--evidence path.json] [--handoff path.json] [--run-external]',
  'sdd close <spec> --by <name> [--note reason] [--archive]',
  'sdd reopen <spec> --by <name> --reason <reason>',
  'sdd cancel <spec> --by <name> --reason <reason>',
  'sdd rename <spec> [--name folder-name] [--number N] --by <name> --reason <reason> [--dry-run]',
  'sdd archive <spec> --by <name> --reason <reason> [--dry-run]',
  'sdd restore <spec> [--name folder-name] --by <name> --reason <reason> [--dry-run]',
  'sdd remove <spec> --by <name> --reason <reason> [--permanent] [--dry-run]',
  'sdd reconcile [--dry-run]',
  'sdd status [<spec>] [--all] [--json]',
  'sdd doctor [--json]',
  'sdd update [--dry-run] [--replace-managed]',
  'sdd migrate <spec> [--dry-run]',
  'sdd harness <claude-code|opencode> [--remove] [--dry-run]',
  'sdd export <claude-code|opencode|agent-skills> --out <new-directory>',
  '',
  'All commands accept --json. Paths are relative to the project root.',
  'Verification commands run with your account permissions. Use isolated test environments.',
  'Approval records user authorization; it does not grant tool permissions.',
].join('\n');

const OPTIONS = {
  json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' },
  mode: { type: 'string' }, harness: { type: 'string' }, phase: { type: 'string' }, task: { type: 'string' },
  'max-bytes': { type: 'string' }, final: { type: 'boolean' }, by: { type: 'string' },
  out: { type: 'string' }, scope: { type: 'string' }, evidence: { type: 'string' },
  note: { type: 'string' }, archive: { type: 'boolean' }, reason: { type: 'string' },
  'dry-run': { type: 'boolean' }, 'replace-managed': { type: 'boolean' }, remove: { type: 'boolean' },
  inspect: { type: 'boolean' },
  handoff: { type: 'string' }, 'run-external': { type: 'boolean' },
  docs: { type: 'boolean' }, types: { type: 'string' },
  name: { type: 'string' }, number: { type: 'string' }, permanent: { type: 'boolean' }, all: { type: 'boolean' },
};
const ALLOWED = {
  init: ['mode', 'harness', 'docs'], docs: ['types', 'dry-run'], new: ['mode'], context: ['phase', 'task', 'max-bytes', 'inspect'],
  skills: [], check: ['phase', 'final'], approve: ['by'], evidence: ['out'], handoff: [], verify: ['scope', 'evidence', 'handoff', 'run-external'],
  close: ['by', 'note', 'archive'], reopen: ['by', 'reason'], cancel: ['by', 'reason'],
  status: ['all'], doctor: [], update: ['dry-run', 'replace-managed'], migrate: ['dry-run'],
  harness: ['remove', 'dry-run'], export: ['out'],
  revise: ['by', 'reason', 'dry-run'],
  rename: ['name', 'number', 'by', 'reason', 'dry-run'],
  archive: ['by', 'reason', 'dry-run'], restore: ['by', 'reason', 'name', 'dry-run'],
  remove: ['by', 'reason', 'permanent', 'dry-run'], reconcile: ['dry-run'],
};

async function main(argv = process.argv.slice(2), root = process.cwd()) {
  const { values, positionals } = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  if (values.version) { console.log(installation.VERSION); return 0; }
  const [command = 'help', first, second] = positionals;
  if (values.help || command === 'help') { console.log(HELP); return 0; }
  if (!ALLOWED[command]) throw new Error('Unknown command: ' + command + '\nRun sdd help');
  for (const key of Object.keys(values)) {
    if (key !== 'json' && !ALLOWED[command].includes(key)) throw new Error('--' + key + ' is not supported by ' + command);
  }
  const maximum = command === 'skills' ? 3 : ['init', 'doctor', 'update', 'docs', 'reconcile'].includes(command) ? 1 : 2;
  if (positionals.length > maximum) throw new Error('Unexpected positional arguments');
  const mutating = new Set(['init', 'docs', 'new', 'approve', 'revise', 'evidence', 'handoff', 'verify', 'close', 'reopen', 'cancel', 'update', 'migrate', 'harness', 'export', 'rename', 'archive', 'restore', 'remove', 'reconcile']);
  async function action() {
    switch (command) {
      case 'init': {
        if (values.mode && !project.MODES.includes(values.mode)) throw new Error('Mode must be light, standard or rigorous');
        if (values.harness && !adapters.NAMES.includes(values.harness)) throw new Error('Unsupported adapter');
        if (values.docs) require('../lib/documents').scaffold(root, { dryRun: true });
        const existed = io.exists(root, 'agents/config.yaml');
        const result = installation.install(root);
        if (values.mode && !existed) {
          const YAML = require('yaml');
          const cfg = project.config(root);
          cfg.mode = values.mode;
          io.write(root, 'agents/config.yaml', YAML.stringify(cfg));
        }
        if (values.harness) result.adapter = adapters.harness(root, values.harness);
        if (values.docs) result.documents = require('../lib/documents').scaffold(root);
        result.next = existed
          ? 'Existing project configuration was preserved. Run sdd doctor and review any reported maintenance needs; no new setup is required.'
          : 'Complete agents/PROJECT.md, documentation language and checks in agents/config.yaml using agents/SETUP.md; then run sdd doctor.';
        return result;
      }
      case 'docs': return require('../lib/documents').scaffold(root, { types: values.types, dryRun: values['dry-run'] });
      case 'new': return project.createSpec(root, first, values.mode);
      case 'context': return require('../lib/context').context(root, first, { phase: values.phase, task: values.task, maxBytes: values['max-bytes'] ? Number(values['max-bytes']) : undefined, inspect: values.inspect });
      case 'skills': {
        const catalog = project.skills(root);
        if (first === 'list') return catalog;
        if (first === 'show' && second) {
          const found = catalog.find(item => item.name === second);
          if (!found) throw new Error('Unknown skill: ' + second);
          return { ...found, content: io.read(root, found.path) };
        }
        throw new Error('Use sdd skills list or sdd skills show <name>');
      }
      case 'check': {
        const result = validation.check(root, first, { phase: values.phase, final: values.final });
        return { valid: result.valid, errors: result.errors, warnings: result.warnings };
      }
      case 'approve': return validation.approve(root, first, values.by);
      case 'revise': return require('../lib/revisions').revise(root, first, { by: values.by, reason: values.reason, dryRun: values['dry-run'] });
      case 'evidence': return lifecycle.evidenceTemplate(root, first, values.out);
      case 'handoff': return require('../lib/handoff').template(root, first);
      case 'verify': return lifecycle.verify(root, first, { scope: values.scope, evidence: values.evidence, handoff: values.handoff, runExternal: values['run-external'] });
      case 'close': return lifecycle.close(root, first, { by: values.by, note: values.note, archive: values.archive });
      case 'rename':
      case 'archive':
      case 'restore':
      case 'remove': return require('../lib/management').manage(root, command, first, {
        name: values.name, number: values.number, by: values.by, reason: values.reason,
        permanent: values.permanent, dryRun: values['dry-run'],
      });
      case 'reconcile': return require('../lib/management').reconcile(root, { dryRun: values['dry-run'] });
      case 'reopen':
      case 'cancel': {
        if (!values.by?.trim() || !values.reason?.trim()) throw new Error('Provide --by and --reason');
        const spec = project.loadSpec(root, first);
        if (spec.legacy) throw new Error('Migrate the spec before changing its lifecycle');
        if (command === 'reopen') {
          if (!['closed', 'cancelled'].includes(spec.change.status)) throw new Error('Only closed/cancelled changes can be reopened');
          const target = 'agents/specs/' + require('node:path').posix.basename(spec.relative);
          if (spec.relative !== target) {
            if (io.exists(root, target)) throw new Error('Active spec destination exists');
            fs.renameSync(io.resolve(root, spec.relative), io.resolve(root, target));
            spec.relative = target;
          }
          const receipt = spec.relative + '/verification.json';
          if (io.exists(root, receipt)) {
            fs.mkdirSync(io.resolve(root, spec.relative + '/runs'), { recursive: true });
            fs.renameSync(io.resolve(root, receipt), io.resolve(root, spec.relative + '/runs/reopened-' + Date.now() + '.json'));
          }
          spec.change.status = 'implementing';
          spec.change.reopened = { by: values.by, reason: values.reason, at: new Date().toISOString() };
        } else {
          if (spec.change.status === 'closed') throw new Error('Reopen a closed change before cancelling it');
          spec.change.status = 'cancelled';
          spec.change.cancellation = { by: values.by, reason: values.reason, at: new Date().toISOString() };
        }
        require('../lib/history').record(root, spec, command, { by: values.by, reason: values.reason, status: spec.change.status });
        project.writeChange(root, spec);
        return { id: spec.id, status: spec.change.status };
      }
      case 'status': {
        const options = { includeTrash: values.all || Boolean(first) };
        const records = require('../lib/catalog').registry(root).records;
        if (first && records[first] && (!records[first].path || !io.exists(root, records[first].path))) {
          const existing = project.specDirectories(root).some(spec => spec.id === first);
          if (!existing) return [{ id: first, ...records[first], retained: true, historical_only: true }];
        }
        const items = first ? [project.locate(root, first, options)] : project.specDirectories(root, options).filter(item => values.all || item.location === 'active');
        const result = items.map(item => {
          try {
            const spec = project.loadSpec(root, item.id, options);
            return { id: spec.id, name: item.name, location: item.location, path: spec.relative, status: spec.legacy ? 'legacy' : spec.change.status,
              approval: spec.legacy ? 'legacy' : project.approvalValid(root, spec) ? 'current' : 'missing-or-stale',
              closure: spec.change?.closure || null };
          } catch (error) {
            return { id: item.id, name: item.name, path: item.relative, status: 'invalid', error: error.message };
          }
        });
        if (!first && values.all) for (const [id, record] of Object.entries(records)) {
          if (!result.some(item => item.id === id)) result.push({ id, ...record, retained: true, historical_only: true });
        }
        return result;
      }
      case 'doctor': return installation.doctor(root);
      case 'update': return installation.install(root, { update: true, dryRun: values['dry-run'], replaceManaged: values['replace-managed'] });
      case 'migrate': return installation.migrate(root, first, { dryRun: values['dry-run'] });
      case 'harness': return adapters.harness(root, first, { remove: values.remove, dryRun: values['dry-run'] });
      case 'export': return adapters.exportBundle(root, first, values.out);
    }
  }
  const result = await (mutating.has(command) && !values['dry-run'] ? io.locked(root, action) : action());
  if (!values.json && typeof result.content === 'string') console.log(result.content);
  else console.log(JSON.stringify(result, null, 2));
  if (result.valid === false || result.verdict === 'failed' || result.conflicts?.length) return 1;
  if (result.verdict === 'partial') return 2;
  return 0;
}

if (require.main === module) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    if (process.argv.includes('--json')) console.log(JSON.stringify({ error: error.message, ...(error.code && { code: error.code }), ...(error.diagnostics && { diagnostics: error.diagnostics }) }));
    else console.error('SDD: ' + error.message);
    process.exitCode = 1;
  });
}
module.exports = { main, HELP };
