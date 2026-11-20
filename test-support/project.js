'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const YAML = require('yaml');
const io = require('../lib/io');
const md = require('../lib/markdown');
const project = require('../lib/project');
const { install } = require('../lib/install');

const CLI = path.join(__dirname, '..', 'bin', 'cli.js');

function fixture(t, { mode = 'standard', method = 'automated', approval = 'required' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  install(root);
  io.write(root, 'agents/PROJECT.md', md.markdown({ schema_version: 2, kind: 'project', description: 'Fixture' }, '# Fixture\n\nA Node.js arithmetic module.'));
  const cfg = project.config(root);
  cfg.approval = approval;
  if (method === 'automated') cfg.checks = [{ name: 'unit', command: 'node --test arithmetic.test.js', timeout_ms: 10000 }];
  io.write(root, 'agents/config.yaml', YAML.stringify(cfg));
  io.write(root, 'arithmetic.js', "exports.add = (a, b) => a + b;\n");
  io.write(root, 'arithmetic.test.js', "const assert = require('node:assert/strict'); const { test } = require('node:test'); const { add } = require('./arithmetic'); test('AC01 addition', () => assert.equal(add(2, 3), 5));\n");
  const spec = project.createSpec(root, 'addition', mode);
  const acceptance = { id: 'AC01', description: 'Adding 2 and 3 produces 5.', covers: ['REQ01'], method };
  if (method === 'automated') acceptance.checks = ['unit'];
  io.write(root, spec.relative + '/SPEC.md', md.markdown({ schema_version: 2, artifact: 'spec', id: spec.id,
    requirements: [{ id: 'REQ01', description: 'Add two numbers.' }], acceptance: [acceptance],
  }, '# Addition\n\n## Scope\n\nAdd numbers without unrelated changes.'));
  if (mode !== 'light') {
    io.write(root, spec.relative + '/TASK.md', md.markdown({ schema_version: 2, artifact: 'tasks', id: spec.id, tasks: [
      { id: 'T01', title: 'Implement addition and its regression test.', status: 'done', covers: ['REQ01', 'AC01'], depends_on: [], verify: '2 + 3 is 5 in the unit test.' },
    ] }, '# Tasks'));
  }
  if (mode === 'rigorous') io.write(root, spec.relative + '/RESEARCH.md', md.markdown({ schema_version: 2, artifact: 'research', id: spec.id }, '# Research\n\nObserved the existing arithmetic API and its callers.'));
  return { root, spec };
}

function editMarkdown(root, file, edit) {
  const document = md.load(root, file);
  edit(document.data, document);
  io.write(root, file, md.markdown(document.data, document.body));
}

function editConfig(root, edit) {
  const cfg = project.config(root);
  edit(cfg);
  io.write(root, 'agents/config.yaml', YAML.stringify(cfg));
}

function cli(root, args, { timeout = 20000 } = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd: root, encoding: 'utf8', timeout });
}

module.exports = { fixture, editMarkdown, editConfig, cli, CLI };
