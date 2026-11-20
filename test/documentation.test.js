'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const io = require('../lib/io');
const md = require('../lib/markdown');
const project = require('../lib/project');
const { context } = require('../lib/context');
const { fixture, editConfig, editMarkdown, cli } = require('../test-support/project');

test('documentation language is optional for existing configurations and validates locale tags', t => {
  const { root } = fixture(t);
  editConfig(root, cfg => { delete cfg.documentation; });
  assert.deepEqual(project.documentationSettings(project.config(root)), { language: 'auto', encoding: 'UTF-8' });
  for (const language of ['pt_br', '', 42]) {
    editConfig(root, cfg => { cfg.documentation = { language }; });
    assert.throws(() => project.config(root), /documentation.language/);
    // Restore directly because editConfig intentionally validates its starting configuration.
    const YAML = require('yaml');
    const cfg = md.parseYaml(io.read(root, project.CONFIG));
    delete cfg.documentation;
    io.write(root, project.CONFIG, YAML.stringify(cfg));
  }
  editConfig(root, cfg => { cfg.documentation = { language: 'pt-br' }; });
  assert.equal(project.documentationSettings(project.config(root)).language, 'pt-BR');
});

test('Portuguese project artifacts and selected context preserve accents while machine identifiers stay stable', t => {
  const { root, spec } = fixture(t);
  editConfig(root, cfg => { cfg.documentation = { language: 'pt-BR' }; });
  const created = project.createSpec(root, 'Ação de exportação', 'standard');
  assert.equal(created.id, '002-acao-de-exportacao');
  const generated = md.load(root, created.relative + '/SPEC.md');
  assert.match(generated.body, /Ação de exportação/);
  assert.match(generated.body, /resultado observável/);
  assert.match(md.load(root, created.relative + '/TASK.md').body, /resultados coesos e verificáveis/);
  editMarkdown(root, spec.relative + '/SPEC.md', (data, document) => {
    data.requirements[0].description = 'Validar autorização, execução e revisão sem omissões.';
    document.body = '# Adição\n\n## Escopo\n\nPreservar informação e rastreabilidade.';
  });
  const packet = context(root, spec.id, { task: 'T01' });
  assert.deepEqual(packet.documentation, { language: 'pt-BR', encoding: 'UTF-8' });
  assert.match(packet.content, /autorização, execução e revisão sem omissões/);
  assert.match(packet.content, /Preservar informação/);
  assert.equal(packet.bytes, Buffer.byteLength(packet.content, 'utf8'));
});

test('reinitialization preserves language and configured mode without requesting a removed setup guide', t => {
  const { root } = fixture(t);
  editConfig(root, cfg => { cfg.documentation = { language: 'pt-BR' }; });
  const original = io.read(root, project.CONFIG);
  fs.unlinkSync(io.resolve(root, 'agents/SETUP.md'));
  const result = cli(root, ['init', '--mode', 'rigorous', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(io.read(root, project.CONFIG), original);
  assert.equal(io.exists(root, 'agents/SETUP.md'), false);
  assert.doesNotMatch(JSON.parse(result.stdout).next, /SETUP.md/);
  assert.match(JSON.parse(result.stdout).next, /no new setup/);
});

test('CLI reports invalid documentation configuration before creating a change', t => {
  const { root } = fixture(t);
  editConfig(root, cfg => { cfg.documentation = { language: 'pt_BR' }; });
  const result = cli(root, ['new', 'invalid-language', '--json']);
  assert.equal(result.status, 1);
  assert.match(JSON.parse(result.stdout).error, /documentation.language/);
  assert.equal(io.exists(root, 'agents/specs/002-invalid-language'), false);
});
