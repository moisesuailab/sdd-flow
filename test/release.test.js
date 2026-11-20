'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { validateReleaseInputs, ensureUnpublished } = require('../scripts/release-check');

const manifest = require('../package.json');

test('release validation binds package identity, exact version and intended distribution channel', () => {
  assert.equal(validateReleaseInputs(manifest, { version: manifest.version }).tag, 'next');
  assert.throws(() => validateReleaseInputs(manifest, { version: '1.3.3' }), /exactly match/);
  assert.throws(() => validateReleaseInputs(manifest, { version: manifest.version, tag: 'unreviewed' }), /tag/);
  const candidate = { ...manifest, version: '2.0.0-rc.1' };
  assert.throws(() => validateReleaseInputs(candidate, { version: candidate.version, tag: 'latest' }), /Prereleases/);
  assert.equal(validateReleaseInputs(candidate, { version: candidate.version, tag: 'next' }).version, candidate.version);
});

test('registry failures do not masquerade as an available version', () => {
  assert.doesNotThrow(() => ensureUnpublished({ status: 1, stdout: JSON.stringify({ error: { code: 'E404' } }) }));
  for (const code of ['E401', 'E403', 'ENETUNREACH']) {
    assert.throws(() => ensureUnpublished({ status: 1, stdout: JSON.stringify({ error: { code } }) }), /could not be established/);
  }
  assert.throws(() => ensureUnpublished({ status: 0, stdout: '"2.0.0"' }), /already published/);
});

test('publication is manual, constrained to main and dependent on a full validation matrix', () => {
  const workflow = YAML.parse(fs.readFileSync(path.join(__dirname, '../.github/workflows/publish.yml'), 'utf8'));
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']);
  assert.equal(workflow.on.workflow_dispatch.inputs.dist_tag.default, 'next');
  assert.match(workflow.jobs.validate.if, /refs\/heads\/main/);
  assert.deepEqual(workflow.jobs.validate.strategy.matrix.node, [22, 24]);
  assert.deepEqual(workflow.jobs.validate.strategy.matrix.os, ['ubuntu-latest', 'windows-latest']);
  assert.equal(workflow.jobs.publish.needs, 'validate');
  assert.equal(workflow.jobs.publish.permissions['id-token'], 'write');
  assert.equal(workflow.jobs.publish.environment, 'npm');
  assert.ok(workflow.jobs.publish.steps.some(step => step.run?.includes('--require-main --check-registry')));
  assert.equal(workflow.jobs.publish.steps.some(step => /NODE_AUTH_TOKEN|NPM_TOKEN/.test(JSON.stringify(step))), false);
});
