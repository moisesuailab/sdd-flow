'use strict';

const crypto = require('node:crypto');
const io = require('./io');
const project = require('./project');
const quality = require('./quality');
const { check, requireValid } = require('./check');

function targets(specification, cfg) {
  return [
    ...cfg.checks.filter(def => quality.checkSettings(def).environment === 'external').map(def => ({ kind: 'check', id: def.name, expected: 'Meet the configured check thresholds: ' + def.command })),
    ...specification.data.acceptance.filter(ac => ac.status !== 'cancelled' && ac.method !== 'automated' && ac.environment === 'external').map(ac => ({ kind: 'criterion', id: ac.id, expected: ac.description })),
  ];
}

function template(root, id) {
  const { spec, specification } = requireValid(check(root, id));
  const cfg = project.config(root);
  const items = targets(specification, cfg).map(target => ({
    ...target, result: 'deferred', reason: '', owner: 'user', environment: 'unavailable',
    prerequisites: [], steps: [], safety: '', resume_when: '',
  }));
  if (!items.length) throw new Error('No external checks or external manual/inspection criteria. Classify the actual environment dependency in the plan before creating a handoff.');
  const file = spec.relative + '/HANDOFF-' + crypto.randomUUID().slice(0, 8) + '.json';
  const value = { schema_version: 2, id: spec.id, input_digest: project.inputDigest(root, spec).digest, items };
  io.writeJson(root, file, value, { exclusive: true });
  return { path: file, ...value };
}

function read(root, file, spec, fingerprint, specification, cfg) {
  if (!file) return { items: new Map(), record: null };
  file = require('./catalog').referencePath(root, file);
  if (!file.startsWith(spec.relative + '/')) throw new Error('Handoff files must stay inside this change directory');
  const value = io.json(root, file);
  if (value.schema_version !== 2 || value.id !== spec.id || value.input_digest !== fingerprint) throw new Error('Handoff is stale or belongs to another spec; generate a current handoff and review its instructions.');
  if (!Array.isArray(value.items) || !value.items.length) throw new Error('Handoff items must be a nonempty array');
  const valid = new Set(targets(specification, cfg).map(item => item.kind + ':' + item.id));
  const items = new Map();
  const nonempty = value => typeof value === 'string' && value.trim();
  const strings = value => Array.isArray(value) && value.every(nonempty);
  for (const item of value.items) {
    const key = item.kind + ':' + item.id;
    if (!valid.has(key) || items.has(key)) throw new Error('Unknown, local or duplicate handoff target: ' + key);
    if (!['deferred', 'not_applicable'].includes(item.result)) throw new Error('Handoff result must be deferred or not_applicable: ' + key);
    if (![item.reason, item.owner, item.expected, item.safety].every(nonempty)) throw new Error('Handoff needs reason, owner, expected and safety: ' + key);
    if (!['unavailable', 'isolated', 'non-production', 'production-read-only'].includes(item.environment)) throw new Error('Invalid handoff environment: ' + key);
    if (!strings(item.prerequisites) || !strings(item.steps)) throw new Error('Handoff prerequisites/steps must contain nonempty strings: ' + key);
    if (item.result === 'deferred' && !nonempty(item.resume_when)) throw new Error('Deferred handoff needs resume_when: ' + key);
    if (item.result === 'deferred' && item.environment !== 'unavailable' && !item.steps.length) throw new Error('An actionable handoff needs simple numbered steps: ' + key);
    items.set(key, item);
  }
  return { items, record: { path: file.slice(spec.relative.length + 1), hash: io.hash(io.read(root, file)) } };
}

function guide(root, spec, items, runId) {
  const pt = project.documentationSettings(project.config(root)).language.toLowerCase().startsWith('pt');
  const lines = pt
    ? ['# Testes pendentes para o usuário', '', 'Implementação concluída não significa validação externa concluída nem autorização de publicação.',
      'Este roteiro não executa ações. Não faça escritas, exclusões, carga ou alterações de permissão em produção para testar.',
      'Sem um teste seguro, aguarde um ambiente adequado. Permissões e autorização precisam ser conferidas no ambiente real.', '']
    : ['# Pending user verification', '', 'Implementation completion is not external verification or deployment authorization.',
      'This guide executes nothing. Do not perform production writes, deletions, load tests or permission changes just to test.',
      'If no safe test is possible, wait for a suitable environment. Check actual permissions and authorization.', ''];
  lines.push('Run: ' + runId, pt ? 'Consulte VALIDATION.md para o resultado corrente antes de seguir este roteiro.' : 'Check VALIDATION.md for the current result before following this guide.', '');
  for (const item of items.values()) {
    lines.push('## ' + item.kind + ': ' + item.id, '', (pt ? 'Resultado: ' : 'Result: ') + item.result,
      (pt ? 'Responsável: ' : 'Owner: ') + item.owner, (pt ? 'Ambiente: ' : 'Environment: ') + item.environment,
      '', item.reason, '', (pt ? 'Pré-requisitos:' : 'Prerequisites:'),
      ...item.prerequisites.map(x => '- ' + x), '', (pt ? 'Passos:' : 'Steps:'),
      ...(item.steps.length ? item.steps.map((x, i) => (i + 1) + '. ' + x) : [pt ? 'Não há teste seguro disponível agora; não improvise em produção.' : 'No safe test is available now; do not improvise in production.']),
      '', (pt ? 'Esperado: ' : 'Expected: ') + item.expected, (pt ? 'Cuidados: ' : 'Safety: ') + item.safety,
      (pt ? 'Retomar quando: ' : 'Resume when: ') + (item.resume_when || '—'), '');
  }
  const content = lines.join('\n');
  const file = 'runs/' + runId + '/USER_TESTS.md';
  io.write(root, spec.relative + '/' + file, content, { exclusive: true });
  io.write(root, spec.relative + '/USER_TESTS.md', content);
  const hash = io.hash(content);
  return { path: file, hash, latest: { path: 'USER_TESTS.md', hash } };
}

module.exports = { targets, template, read, guide };
