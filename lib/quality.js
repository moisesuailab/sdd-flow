'use strict';

function settings(cfg) {
  const value = cfg.quality;
  if (value !== undefined && (!value || typeof value !== 'object' || Array.isArray(value))) throw new Error('quality must be a mapping');
  const tdd = value?.tdd ?? 'preferred';
  if (!['optional', 'preferred', 'required'].includes(tdd)) throw new Error('quality.tdd must be optional, preferred or required');
  return { tdd };
}

function checkSettings(definition) {
  const level = definition.level ?? 'required';
  const environment = definition.environment ?? 'local';
  if (!['required', 'advisory'].includes(level)) throw new Error('Check level must be required or advisory: ' + definition.name);
  if (!['local', 'external'].includes(environment)) throw new Error('Check environment must be local or external: ' + definition.name);
  return { level, environment };
}

function externalCriterion(criterion, cfg) {
  if (criterion.method !== 'automated') return criterion.environment === 'external';
  return criterion.checks?.some(name => cfg.checks.some(def => def.name === name && checkSettings(def).environment === 'external'));
}

module.exports = { settings, checkSettings, externalCriterion };
