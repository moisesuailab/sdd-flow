'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const io = require('../lib/io');
const md = require('../lib/markdown');
const { install, TEMPLATES } = require('../lib/install');
const { exportBundle, harness } = require('../lib/adapters');
const project = require('../lib/project');

const root = path.join(__dirname, '..');
assert.equal(io.exists(TEMPLATES, 'agents/.gitignore'), false, 'Remove the obsolete agents/.gitignore source; only agents/_gitignore is distributed.');
for (const directory of ['bin', 'lib', 'scripts', 'test', 'test-support']) {
  for (const file of io.walk(root, directory).filter(file => file.endsWith('.js'))) {
    const result = spawnSync(process.execPath, ['--check', io.resolve(root, file)], { encoding: 'utf8' });
    assert.equal(result.status, 0, file + '\n' + result.stderr);
  }
}
for (const file of io.walk(TEMPLATES).filter(file => file.endsWith('.md'))) {
  const source = io.read(TEMPLATES, file);
  require('../lib/privacy').assertSafe(source);
  if (source.startsWith('---\n')) md.parseMarkdown(source, file);
  assert.doesNotMatch(source, /grep -A 8|One task = one file|spec-driven-workflow/);
}
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-layout-'));
try {
  install(temporary);
  assert.equal(project.skills(temporary).length, 0);
  for (const adapter of ['claude-code', 'opencode']) harness(temporary, adapter);
  for (const format of ['claude-code', 'opencode', 'agent-skills']) {
    const exported = exportBundle(temporary, format, 'packages/' + format);
    const skill = exported.files.find(file => file.endsWith('SKILL.md'));
    const metadata = md.load(temporary, exported.path + '/' + skill);
    assert.equal(metadata.data.name, 'sdd-flow');
    assert.equal(typeof metadata.data.description, 'string');
    for (const reference of ['references/workflow.md', 'references/rules.md', 'references/intake.md', 'references/privacy.md']) {
      assert.ok(io.exists(temporary, exported.path + '/' + path.posix.dirname(skill) + '/' + reference));
    }
  }
  console.log('Package syntax, canonical templates and generated adapter/export contracts passed.');
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
