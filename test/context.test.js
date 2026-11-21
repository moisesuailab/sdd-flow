'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const io = require('../lib/io');
const md = require('../lib/markdown');
const project = require('../lib/project');
const { context } = require('../lib/context');
const { fixture, editMarkdown, editConfig } = require('../test-support/project');

test('task context selects relevant acceptance and skills without loading history or every skill body', t => {
  const { root, spec } = fixture(t);
  editMarkdown(root, spec.relative + '/SPEC.md', data => {
    data.requirements.push({ id: 'REQ02', description: 'Unrelated behavior.' });
    data.acceptance.push({ id: 'AC02', description: 'Unrelated acceptance.', covers: ['REQ02'], method: 'manual' });
  });
  io.write(root, 'agents/skills/arithmetic/SKILL.md', md.markdown({ name: 'arithmetic', description: 'Implement numeric operations.' }, '# Arithmetic\nSELECTED_BODY'));
  io.write(root, 'agents/skills/unrelated/SKILL.md', md.markdown({ name: 'unrelated', description: 'Use for a separate domain.' }, '# Other\nUNRELATED_BODY'));
  io.write(root, spec.relative + '/PROGRESS.md', 'HISTORY_SHOULD_NOT_LOAD');
  spec.change.skills = ['arithmetic'];
  project.writeChange(root, spec);
  const packet = context(root, spec.id, { task: 'T01' });
  assert.match(packet.content, /SELECTED_BODY/);
  assert.doesNotMatch(packet.content, /UNRELATED_BODY|HISTORY_SHOULD_NOT_LOAD|Unrelated acceptance/);
  assert.equal(packet.skills.length, 2);
  assert.ok(packet.entries.every(entry => entry.reason));
});

test('heading references ignore fake headings in fenced code and do not cut by line count', t => {
  const { root, spec } = fixture(t);
  io.write(root, 'domain.md', '# Domain\n\n## Relevant\nStart\n~~~js\n## Fake\n~~~\n' + 'Detail\n'.repeat(30) + '## Other\nUNRELATED_SECTION\n');
  spec.change.context = [{ path: 'domain.md', section: 'Relevant' }];
  project.writeChange(root, spec);
  const packet = context(root, spec.id);
  assert.match(packet.content, /## Fake/);
  assert.match(packet.content, /Detail\nDetail/);
  assert.doesNotMatch(packet.content, /UNRELATED_SECTION/);
  assert.throws(() => md.section('# A', 'Missing', 'file'), /heading not found/);
});

test('overflow fails without silently dropping contracts or truncating a document', t => {
  const { root, spec } = fixture(t);
  io.write(root, 'domain.md', 'x'.repeat(12000));
  spec.change.context = ['domain.md'];
  project.writeChange(root, spec);
  assert.throws(() => context(root, spec.id, { maxBytes: 1024, budgetMode: 'strict' }), /Nothing was silently truncated/);
  assert.match(context(root, spec.id, { maxBytes: 60000, budgetMode: 'strict' }).content, /x{12000}/);
});

test('warn mode (default) keeps the full oversized packet with a warning; strict comes from config or option', t => {
  const { root, spec } = fixture(t);
  io.write(root, 'domain.md', 'x'.repeat(12000));
  spec.change.context = ['domain.md'];
  project.writeChange(root, spec);
  const packet = context(root, spec.id, { maxBytes: 1024 });
  assert.match(packet.content, /x{12000}/);
  assert.equal(packet.fits_budget, false);
  assert.equal(packet.budget_mode, 'warn');
  assert.ok(packet.warnings.some(text => text.includes('advisory budget')));
  assert.match(packet.content, /advisory budget/);
  editConfig(root, cfg => { cfg.context.budget_mode = 'strict'; });
  assert.throws(() => context(root, spec.id, { maxBytes: 1024 }), error => error.code === 'CONTEXT_BUDGET_EXCEEDED');
  assert.equal(context(root, spec.id, { maxBytes: 1024, budgetMode: 'warn' }).fits_budget, false);
  assert.equal(context(root, spec.id, { maxBytes: 1024, inspect: true }).fits_budget, false);
  assert.throws(() => context(root, spec.id, { budgetMode: 'loose' }), /Budget mode/);
  editConfig(root, cfg => { cfg.context.budget_mode = 'loose'; });
  assert.throws(() => project.config(root), /budget_mode/);
});

test('referenced files above 2 MiB load whole or by section; internal reads keep the limit', t => {
  const { root, spec } = fixture(t);
  io.write(root, 'big.md', '# Big\n\n## Wanted\nWANTED_TEXT\n\n## Rest\n' + 'y'.repeat(3 * 1024 * 1024));
  spec.change.context = [{ path: 'big.md', section: 'Wanted' }];
  project.writeChange(root, spec);
  const packet = context(root, spec.id, { maxBytes: 1024 });
  assert.match(packet.content, /WANTED_TEXT/);
  assert.doesNotMatch(packet.content, /y{100}/);
  assert.ok(project.inputDigest(root, project.loadSpec(root, spec.id)).digest);
  spec.change.context = ['big.md'];
  project.writeChange(root, spec);
  assert.match(context(root, spec.id, { maxBytes: 1024 }).content, /y{1000}/);
  assert.throws(() => io.read(root, 'big.md'), /exceeds 2 MiB/);
});

test('inactive decisions and malformed skill catalogs are reported', t => {
  const { root, spec } = fixture(t);
  io.write(root, 'agents/decisions/old.md', md.markdown({ kind: 'decision', status: 'superseded' }, '# Old decision'));
  spec.change.decisions = ['agents/decisions/old.md'];
  project.writeChange(root, spec);
  assert.throws(() => context(root, spec.id), /not active/);
  io.write(root, 'agents/skills/example/SKILL.md', md.markdown({ name: 'wrong-name', description: 'Example.' }, '# Body'));
  assert.throws(() => project.skills(root), /name must match/);
});

test('context inspection and overflow diagnostics expose sizes and remedies without source bodies', t => {
  const { root, spec } = fixture(t);
  io.write(root, 'large.md', 'PRIVATE_REFERENCE_BODY'.repeat(500));
  spec.change.context = ['large.md'];
  project.writeChange(root, spec);
  const summary = context(root, spec.id, { maxBytes: 1024, inspect: true });
  assert.equal(summary.fits_budget, false);
  assert.ok(summary.documents.some(doc => doc.path === 'large.md' && doc.bytes > 1000));
  assert.ok(summary.suggestions.some(text => text.includes('linked specs')));
  assert.doesNotMatch(JSON.stringify(summary), /PRIVATE_REFERENCE_BODY/);
  assert.throws(() => context(root, spec.id, { maxBytes: 1024, budgetMode: 'strict' }), error =>
    error.code === 'CONTEXT_BUDGET_EXCEEDED' && error.diagnostics.fits_budget === false);
});

test('large original requirement sources can be referenced by an exact section', t => {
  const { root, spec } = fixture(t);
  io.write(root, 'prd.md', '# Product\n\n## Addition\nAdd two numbers.\n\n## Other modules\n' + 'UNRELATED_FEATURE'.repeat(3000));
  spec.change.sources = [{ path: 'prd.md', section: 'Addition' }];
  project.writeChange(root, spec);
  const packet = context(root, spec.id, { phase: 'plan' });
  assert.match(packet.content, /Add two numbers/);
  assert.doesNotMatch(packet.content, /UNRELATED_FEATURE/);
  assert.ok(project.inputDigest(root, project.loadSpec(root, spec.id)).digest);
});
