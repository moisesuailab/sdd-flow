'use strict';

const GROUPS = {
  requirements: ['Requisitos', 'Requirements'],
  acceptance: ['Critérios de aceitação', 'Acceptance criteria'],
  tasks: ['Tarefas', 'Tasks'],
};
const MARKS = { pending: ' ', in_progress: ' ', done: 'x', cancelled: '-', deferred: ' ' };
const READ_MARKS = { ' ': 'pending', '/': 'in_progress', x: 'done', '-': 'cancelled', '>': 'deferred' };
const OPEN_STATES = {
  in_progress: ['em andamento', 'in progress'],
  deferred: ['verificação externa pendente', 'pending external verification'],
};
const FIELDS = {
  status: ['Situação', 'Status'],
  covers: ['Cobre', 'Covers'], depends_on: ['Depende de', 'Depends on'], verify: ['Verificação', 'Verify'],
  method: ['Método', 'Method'], checks: ['Checks', 'Checks'], environment: ['Ambiente', 'Environment'],
  kind: ['Tipo', 'Kind'], notes: ['Notas', 'Notes'], evidence: ['Evidência', 'Evidence'],
  cancellation_by: ['Cancelado por', 'Cancelled by'], cancellation_reason: ['Motivo do cancelamento', 'Cancellation reason'],
  deferral_by: ['Adiado por', 'Deferred by'], deferral_reason: ['Motivo do adiamento', 'Deferral reason'],
  extra: ['Campos adicionais', 'Additional fields'],
};
const ARRAYS = new Set(['covers', 'depends_on', 'checks']);
const line = value => String(value ?? '').replace(/\r?\n/g, ' ').trim();
const labelKey = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function render(data, body) {
  const pt = data.language?.toLowerCase().startsWith('pt');
  const locale = pt ? 0 : 1;
  const groups = data.artifact === 'spec' ? ['requirements', 'acceptance'] : ['tasks'];
  const sections = [];
  for (const group of groups) {
    const records = data[group] || [];
    const lines = ['## ' + GROUPS[group][locale], ''];
    for (const item of records) {
      const task = group === 'tasks';
      if (task && !Object.hasOwn(MARKS, item.status)) throw new Error('Invalid task status: ' + item.id);
      lines.push('- ' + (task ? '[' + MARKS[item.status] + '] ' : '') + '**' + item.id + '** — ' + line(task ? item.title : item.description));
      const fields = { ...item };
      delete fields.id;
      delete fields.title;
      delete fields.description;
      if (task) {
        delete fields.status;
        if (OPEN_STATES[item.status]) fields.status = OPEN_STATES[item.status][locale];
      }
      for (const field of ['cancellation', 'deferral']) if (fields[field]) {
        fields[field + '_by'] = fields[field].by;
        fields[field + '_reason'] = fields[field].reason;
        const extra = Object.fromEntries(Object.entries(fields[field]).filter(([key]) => !['by', 'reason'].includes(key)));
        delete fields[field];
        if (Object.keys(extra).length) fields[field] = extra;
      }
      const unknown = {};
      const ordered = [...Object.keys(FIELDS).filter(key => Object.hasOwn(fields, key)), ...Object.keys(fields).filter(key => !FIELDS[key]).sort()];
      for (const key of ordered) {
        const value = fields[key];
        if (!FIELDS[key]) { unknown[key] = value; continue; }
        const text = ARRAYS.has(key) ? value.join(', ') || '—' : line(value);
        lines.push('  - ' + FIELDS[key][locale] + ': ' + text);
      }
      if (Object.keys(unknown).length) lines.push('  - ' + FIELDS.extra[locale] + ': ' + JSON.stringify(unknown));
      lines.push('');
    }
    sections.push(lines.join('\n'));
  }
  const metadata = { ...data };
  for (const group of groups) delete metadata[group];
  return { data: metadata, body: [body.trim(), ...sections].filter(Boolean).join('\n\n').trim() };
}

function parse(data, body, label) {
  if (!['spec', 'tasks'].includes(data.artifact)) throw new Error(label + ': Markdown format is supported for spec/tasks only');
  const groups = data.artifact === 'spec' ? ['requirements', 'acceptance'] : ['tasks'];
  for (const group of groups) if (Object.hasOwn(data, group)) throw new Error(label + ': keep ' + group + ' in Markdown only, not in front matter');
  const result = { ...data };
  for (const group of groups) result[group] = [];
  const prose = [];
  const seen = new Set();
  let group;
  let item;
  let fields = new Set();
  let marker;
  let fence;
  for (const text of body.split('\n')) {
    const boundary = text.match(/^\s*(`{3,}|~{3,})/);
    if (boundary) {
      if (group) throw new Error(label + ': put code examples outside the structured Markdown sections');
      if (!fence) fence = boundary[1];
      else if (boundary[1][0] === fence[0] && boundary[1].length >= fence.length) fence = null;
    }
    const heading = !fence && text.match(/^##\s+(.+?)\s*#*\s*$/);
    if (heading) {
      group = groups.find(key => GROUPS[key].some(name => labelKey(name) === labelKey(heading[1])));
      item = null;
      if (group) {
        if (seen.has(group)) throw new Error(label + ': duplicate Markdown section: ' + heading[1]);
        seen.add(group);
        continue;
      }
    }
    if (!group) { prose.push(text); continue; }
    if (!text.trim()) continue;
    const record = group === 'tasks'
      ? text.match(/^- \[([ xX/\->])\]\s+(?:\*\*)?(T\d+)(?:\*\*)?\s+[—–-]\s+(.+)$/)
      : text.match(/^- (?:\*\*)?((?:REQ|BR|EB|AC|TC)\d+)(?:\*\*)?\s+[—–-]\s+(.+)$/);
    if (record) {
      const task = group === 'tasks';
      marker = task ? record[1].toLowerCase() : null;
      item = task ? { id: record[2], title: record[3], status: READ_MARKS[marker] }
        : { id: record[1], description: record[2] };
      if (task) { item.covers = []; item.depends_on = []; }
      result[group].push(item);
      fields = new Set();
      continue;
    }
    const field = text.match(/^\s+- ([^:]+):\s*(.*)$/);
    if (item && !field && /^\s{2,}[^\s-]/.test(text)) {
      const key = group === 'tasks' ? 'title' : 'description';
      item[key] += ' ' + text.trim();
      continue;
    }
    if (!item || !field) throw new Error(label + ': invalid structured Markdown line; use the documented list format');
    const key = Object.keys(FIELDS).find(key => FIELDS[key].some(name => labelKey(name) === labelKey(field[1])));
    if (!key || fields.has(key)) throw new Error(label + ': unknown, duplicate or conflicting task field: ' + field[1]);
    fields.add(key);
    const value = field[2];
    if (key === 'status' && group === 'tasks') {
      const state = Object.keys(OPEN_STATES).find(name => name === value || OPEN_STATES[name].some(text => labelKey(text) === labelKey(value)));
      if (marker !== ' ' || !state) throw new Error(label + ': Situação/Status only qualifies [ ] tasks as in progress or pending external verification; remove it when completing/cancelling the task');
      item.status = state;
    } else if (key === 'extra') {
      let extra;
      try { extra = require('./markdown').parseYaml(value, label); } catch { throw new Error(label + ': invalid additional fields mapping'); }
      if (!extra || typeof extra !== 'object' || Array.isArray(extra)) throw new Error(label + ': additional fields must be an object');
      for (const [name, content] of Object.entries(extra)) {
        if (['cancellation', 'deferral'].includes(name) && item[name]) {
          if (!content || typeof content !== 'object' || Array.isArray(content) || Object.keys(content).some(key => Object.hasOwn(item[name], key))) throw new Error(label + ': conflicting additional field');
          Object.assign(item[name], content);
        } else {
          if (['__proto__', 'prototype', 'constructor', 'id', 'title', 'description', 'status'].includes(name) || Object.hasOwn(item, name)) throw new Error(label + ': conflicting additional field');
          item[name] = content;
        }
      }
    } else if (/^(cancellation|deferral)_/.test(key)) {
      const [parent, child] = key.split('_');
      item[parent] ||= {};
      item[parent][child] = value;
    } else item[key] = ARRAYS.has(key) ? value === '—' || value === '' ? [] : value.split(',').map(x => x.trim()) : value;
  }
  return { data: result, body: prose.join('\n').trim() + '\n' };
}

module.exports = { parse, render, MARKS };
