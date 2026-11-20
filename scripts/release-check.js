'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { spawnSync } = require('node:child_process');

const REGISTRY = 'https://registry.npmjs.org';

function validateReleaseInputs(manifest, { version, tag = 'next' } = {}) {
  if (manifest.name !== 'sdd-flow') throw new Error('Unexpected package name');
  if (version !== manifest.version) throw new Error('Requested version must exactly match package.json');
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:alpha|beta|rc)\.(?:0|[1-9]\d*))?$/.test(version)) {
    throw new Error('Release versions must use x.y.z or x.y.z-alpha/beta/rc.N');
  }
  if (!['next', 'latest'].includes(tag)) throw new Error('Release tag must be next or latest');
  if (tag === 'latest' && version.includes('-')) throw new Error('Prereleases must not replace latest');
  if (manifest.repository?.url !== 'git+https://github.com/moisesuailab/sdd-flow.git') throw new Error('repository.url must match the trusted publisher repository');
  if (manifest.publishConfig?.registry !== REGISTRY || manifest.publishConfig?.access !== 'public') throw new Error('Expected the public npm registry and public access');
  return { name: manifest.name, version, tag, registry: REGISTRY };
}

function ensureUnpublished(result) {
  if (result.error) throw result.error;
  if (result.status === 0) throw new Error('This package version is already published; choose a new version instead of overwriting it');
  for (const output of [result.stdout, result.stderr]) {
    try {
      const parsed = JSON.parse(output || '');
      if (parsed.error?.code === 'E404') return;
    } catch { /* Non-JSON environment diagnostics do not establish that a version is available. */ }
  }
  throw new Error('Registry availability could not be established; refusing to treat an authentication/network failure as an unused version');
}

function checkRelease(root, options = {}) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const result = validateReleaseInputs(manifest, options);
  const git = args => {
    const response = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    if (response.status !== 0) throw new Error('Release checks require a valid Git checkout');
    return response.stdout.trim();
  };
  if (options.expectedSha) {
    if (!/^[a-f0-9]{40}$/.test(options.expectedSha) || git(['rev-parse', 'HEAD']) !== options.expectedSha) throw new Error('Checkout does not match the requested immutable commit');
    if (git(['status', '--porcelain'])) throw new Error('Release checkout has uncommitted changes');
  }
  if (options.requireMain) {
    const ref = process.env.GITHUB_REF || git(['branch', '--show-current']);
    if (!['main', 'refs/heads/main'].includes(ref)) throw new Error('Publish only the reviewed main branch');
    if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY !== 'moisesuailab/sdd-flow') throw new Error('Refusing publication from a fork');
  }
  if (options.checkRegistry) {
    const args = ['view', result.name + '@' + result.version, 'version', '--json', '--registry=' + REGISTRY];
    const response = process.env.npm_execpath
      ? spawnSync(process.execPath, [process.env.npm_execpath, ...args], { cwd: root, encoding: 'utf8', timeout: 30000 })
      : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: root, encoding: 'utf8', timeout: 30000, shell: process.platform === 'win32' });
    ensureUnpublished(response);
  }
  return { ...result, registry_checked: Boolean(options.checkRegistry), published: false };
}

if (require.main === module) {
  try {
    const { values } = parseArgs({ options: {
      version: { type: 'string' }, tag: { type: 'string', default: 'next' }, 'expected-sha': { type: 'string' },
      'require-main': { type: 'boolean' }, 'check-registry': { type: 'boolean' },
    } });
    console.log(JSON.stringify(checkRelease(path.join(__dirname, '..'), {
      version: values.version, tag: values.tag, expectedSha: values['expected-sha'], requireMain: values['require-main'], checkRegistry: values['check-registry'],
    }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { validateReleaseInputs, ensureUnpublished, checkRelease };
