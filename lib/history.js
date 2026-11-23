'use strict';

const crypto = require('node:crypto');
const io = require('./io');

function record(root, spec, type, payload) {
  require('./privacy').local(root, payload, spec.relative + '/history');
  if (!/^[a-z-]+$/.test(type)) throw new Error('Invalid history event type');
  const at = new Date().toISOString();
  const file = require('./project').internal(spec, 'history/' + type + '-' + crypto.randomUUID() + '.json');
  io.writeJson(root, spec.relative + '/' + file, {
    schema_version: 2, id: spec.id, type, at, ...payload,
  }, { exclusive: true });
  return { path: file, at };
}

module.exports = { record };
