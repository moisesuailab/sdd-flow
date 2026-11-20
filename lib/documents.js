'use strict';

const fs = require('node:fs');
const path = require('node:path');
const io = require('./io');
const project = require('./project');

const TYPES = ['prd', 'roadmap', 'sd', 'ds', 'adr'];
const DEFAULTS = ['prd', 'roadmap', 'sd'];

function selected(value) {
  const names = value === undefined ? DEFAULTS : typeof value === 'string' ? value.split(',').map(x => x.trim()) : [];
  if (!names.length || names.some(name => !TYPES.includes(name))) throw new Error('Document types must be a comma-separated selection of prd,roadmap,sd,ds,adr');
  return [...new Set(names)];
}

function contents(language, types) {
  const pt = language.toLowerCase().split('-')[0] === 'pt';
  const draft = pt
    ? 'Rascunho de referência: preencher com fatos e decisões autorizadas; manter dúvidas explícitas.'
    : 'Reference draft: fill with facts and authorized decisions; keep unresolved questions explicit.';
  const definitions = {
    prd: ['prd.md', 'PRD', pt ? ['Objetivo e usuários', 'Problema e resultados esperados', 'Escopo e limites', 'Regras de negócio e exemplos', 'Restrições e questões abertas'] : ['Goal and users', 'Problem and expected outcomes', 'Scope and boundaries', 'Business rules and examples', 'Constraints and open questions']],
    roadmap: ['roadmap.md', 'Roadmap', pt ? ['Resultados priorizados', 'Próxima entrega verificável', 'Dependências e incertezas'] : ['Prioritized outcomes', 'Next verifiable delivery', 'Dependencies and uncertainty']],
    sd: ['architecture.md', 'System Design', pt ? ['Contexto e componentes', 'Contratos, dados e integrações', 'Segurança e operação', 'Decisões e questões abertas'] : ['Context and components', 'Contracts, data and integrations', 'Security and operations', 'Decisions and open questions']],
    ds: ['design-system.md', 'Design System', pt ? ['Princípios de interface e fontes', 'Tokens e componentes', 'Estados e interações', 'Acessibilidade e responsividade'] : ['Interface principles and sources', 'Tokens and components', 'States and interactions', 'Accessibility and responsiveness']],
  };
  const files = {};
  files['docs/README.md'] = pt
    ? '# Documentos do projeto\n\nReferências opcionais do produto. Mapeie as fontes vigentes em agents/PROJECT.md e selecione apenas as pertinentes na mudança.\nNão duplique o estado das tarefas nem carregue todos os documentos em cada sessão. Preserve fontes e decisões anteriores.\n'
    : '# Project documents\n\nOptional product references. Map authoritative sources in agents/PROJECT.md and select only relevant documents for each change.\nDo not duplicate task state or load all documents every session. Preserve original sources and prior decisions.\n';
  for (const type of types) {
    if (type === 'adr') {
      files['docs/adr/README.md'] = pt
        ? '# Registros de decisões arquiteturais\n\nUse um registro por decisão real, com contexto, escolha, consequências e estado.\nSe já houver ADRs em agents/decisions/ ou outro local, mantenha essa fonte e apenas referencie-a aqui.\nO template não representa uma decisão tomada. Não duplique decisões nem invente justificativas históricas.\n'
        : '# Architecture decision records\n\nUse one record per actual decision, with context, choice, consequences and status.\nIf ADRs already live in agents/decisions/ or elsewhere, retain that source and reference it here.\nThe template is not an actual decision. Do not duplicate decisions or invent historical rationale.\n';
      const template = io.read(path.join(__dirname, '..', 'templates'), 'agents/decisions/_template.md').replace(/\r\n/g, '\n').replace('status: active\n', 'status: proposed\n');
      files['docs/adr/_template.md'] = pt ? template
        .replace('Explain the decision and when it applies.', 'Explique a decisão e quando ela se aplica.')
        .replace('# Decision\n', '# Decisão\n').replace('## Context\n', '## Contexto\n')
        .replace('Record evidence and constraints. Label inferred rationale instead of presenting it as historical fact.', 'Registre evidências e restrições. Identifique justificativas inferidas sem apresentá-las como fatos históricos.')
        .replace('## Decision\n', '## Decisão\n').replace('State the choice and scope.', 'Descreva a escolha e seu escopo.')
        .replace('## Consequences\n', '## Consequências\n').replace('Describe relevant trade-offs. When replaced, keep this ADR and mark it superseded.', 'Descreva os compromissos relevantes. Quando substituído, preserve este ADR com status superseded.') : template;
      continue;
    }
    const [name, title, headings] = definitions[type];
    files['docs/' + name] = '# ' + title + '\n\n' + draft + '\n\n' + headings.map(heading => '## ' + heading + '\n').join('\n') + '\n';
  }
  return files;
}

function scaffold(root, { types, dryRun = false } = {}) {
  const choice = selected(types);
  const cfg = io.exists(root, project.CONFIG) ? project.config(root) : {};
  const files = contents(project.documentationSettings(cfg).language, choice);
  const plan = Object.entries(files).map(([file, content]) => {
    const target = io.resolve(root, file);
    let parent = path.dirname(target);
    while (parent !== path.resolve(root)) {
      if (fs.existsSync(parent) && !fs.statSync(parent).isDirectory()) throw new Error('Document parent must be a directory: ' + file);
      parent = path.dirname(parent);
    }
    if (fs.existsSync(target) && !fs.statSync(target).isFile()) throw new Error('Document path must be a regular file: ' + file);
    return { path: file, action: fs.existsSync(target) ? 'preserve' : 'create', content };
  });
  if (!dryRun) for (const item of plan) if (item.action === 'create') io.write(root, item.path, item.content, { exclusive: true });
  return { types: choice, dry_run: dryRun, files: plan.map(({ path, action }) => ({ path, action })),
    next: 'These are optional drafts, not approved requirements or decisions. Review existing sources and map relevant paths in agents/PROJECT.md.' };
}

module.exports = { TYPES, DEFAULTS, selected, scaffold };
