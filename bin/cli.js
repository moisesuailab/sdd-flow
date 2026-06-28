#!/usr/bin/env node

'use strict';

const fs   = require('fs');
const path = require('path');
const rl   = require('readline');

const TEMPLATES = path.join(__dirname, '..', 'templates');
const CWD       = process.cwd();
const VERSION   = require('../package.json').version;
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

const c = useColor
  ? { reset: '\x1b[0m', bold: '\x1b[1m', green: '\x1b[32m',
      yellow: '\x1b[33m', cyan: '\x1b[36m', red: '\x1b[31m', dim: '\x1b[2m' }
  : { reset: '', bold: '', green: '', yellow: '', cyan: '', red: '', dim: '' };

const log   = (msg = '') => console.log(msg);
const ok    = (msg)      => console.log(`${c.green}✔${c.reset}  ${msg}`);
const warn  = (msg)      => console.log(`${c.yellow}⚠${c.reset}  ${msg}`);
const info  = (msg)      => console.log(`${c.cyan}ℹ${c.reset}  ${msg}`);
const error = (msg)      => console.log(`${c.red}✖${c.reset}  ${msg}`);
const bold  = (msg)      => `${c.bold}${msg}${c.reset}`;
const dim   = (msg)      => `${c.dim}${msg}${c.reset}`;

function ask(prompt) {
  const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve =>
    iface.question(prompt, answer => { iface.close(); resolve(answer.trim()); })
  );
}

function copy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest, exclude = []) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(srcPath, destPath) : copy(srcPath, destPath);
  }
}

const HARNESS_CONFIG = {
  '2': {
    name:         'claude-code',
    commandsDest: path.join(CWD, '.claude', 'commands'),
  },
  '3': {
    name:         'opencode',
    commandsDest: path.join(CWD, '.opencode', 'commands'),
  },
};

function showSlashCommands() {
  log(bold('Slash commands disponíveis:'));
  log(`  ${c.cyan}/sdd-research${c.reset}   001-nome-da-feature`);
  log(`  ${c.cyan}/sdd-plan${c.reset}       001-nome-da-feature`);
  log(`  ${c.cyan}/sdd-implement${c.reset}  001-nome-da-feature`);
  log(`  ${c.cyan}/sdd-validate${c.reset}   001-nome-da-feature`);
}

function removeSddCommands(commandsDest) {
  if (!fs.existsSync(commandsDest)) return;
  for (const f of fs.readdirSync(commandsDest)) {
    if (f.startsWith('sdd-')) fs.rmSync(path.join(commandsDest, f));
  }
}

async function init() {
  log();
  log(bold('sdd-cli') + dim(' — Spec Driven Development workflow'));
  log();

  const agentsDir = path.join(CWD, 'agents');
  if (fs.existsSync(agentsDir)) {
    warn('A pasta agents/ já existe neste projeto.');
    const answer = await ask('  Deseja sobrescrever os arquivos do workflow? (s/N) ');
    if (answer.toLowerCase() !== 's') {
      info('Operação cancelada. Use ' + bold('sdd update') + ' para atualizar prompts e regras.');
      log();
      process.exit(0);
    }
    log();
  }

  copy(path.join(TEMPLATES, 'AGENTS.md'),    path.join(CWD, 'AGENTS.md'));
  ok('AGENTS.md criado na raiz do projeto');

  copy(path.join(TEMPLATES, 'QUICKSTART.md'), path.join(CWD, 'QUICKSTART.md'));
  ok('QUICKSTART.md criado na raiz do projeto');

  copyDir(path.join(TEMPLATES, 'agents'), agentsDir, ['harness']);
  ok('Workflow instalado em agents/');

  log();
  info('O harness instala hooks de segurança e slash commands ' + dim('(opcional)'));
  log('  1) Pular esta etapa');
  log('  2) Claude Code');
  log('  3) OpenCode');
  const choice = await ask('  Escolha [1]: ');

  const harnessCfg = HARNESS_CONFIG[choice];
  let harnessInstalled = false;

  if (harnessCfg) {
    const { name, commandsDest } = harnessCfg;
    const harnessSrc = path.join(TEMPLATES, 'agents', 'harness', name);

    if (fs.existsSync(harnessSrc)) {
      copyDir(harnessSrc, path.join(agentsDir, 'harness', name), ['commands']);
      ok(`Harness instalado: ${name}`);

      const cmdSrc = path.join(harnessSrc, 'commands');
      if (fs.existsSync(cmdSrc)) {
        copyDir(cmdSrc, commandsDest);
        ok(`Slash commands instalados em ${path.relative(CWD, commandsDest)}/`);
      }

      harnessInstalled = true;
    } else {
      warn(`Harness "${name}" não encontrado. Use sdd harness para instalar depois.`);
    }
  } else {
    info('Harness ignorado. Use ' + bold('sdd harness') + ' para instalar depois.');
  }

  log();
  log(bold('Próximos passos:'));
  log(`  ${c.cyan}1.${c.reset} Abra uma sessão do seu agente no projeto`);
  log(`  ${c.cyan}2.${c.reset} Instrua: ${dim('"Leia e siga agents/SETUP.md"')}`);
  log(`  ${c.cyan}3.${c.reset} Forneça seu PRD ou descreva o projeto`);
  log(`  ${c.cyan}4.${c.reset} Revise os arquivos gerados e delete agents/SETUP.md`);
  log();

  if (harnessInstalled) {
    showSlashCommands();
  } else {
    log(dim('  Sem slash commands — consulte QUICKSTART.md para instruções manuais.'));
    log(dim('  Para instalar depois: sdd harness'));
  }

  log();
  log(dim('  Documentação: https://github.com/moisesuailab/spec-driven-workflow'));
  log();
}

async function harness() {
  log();
  log(bold('sdd harness'));
  log();

  const agentsDir = path.join(CWD, 'agents');
  if (!fs.existsSync(agentsDir)) {
    error('Pasta agents/ não encontrada. Rode ' + bold('sdd init') + ' primeiro.');
    log();
    process.exit(1);
  }

  info('O que deseja fazer?');
  log('  1) Remover harness atual');
  log('  2) Instalar / trocar para Claude Code');
  log('  3) Instalar / trocar para OpenCode');
  const choice = await ask('  Escolha: ');

  if (choice === '1') {
    const harnessDir = path.join(agentsDir, 'harness');
    if (fs.existsSync(harnessDir)) {
      fs.rmSync(harnessDir, { recursive: true });
      ok('Hooks removidos de agents/harness/');
    }
    for (const cfg of Object.values(HARNESS_CONFIG)) {
      removeSddCommands(cfg.commandsDest);
      if (fs.existsSync(cfg.commandsDest)) {
        ok(`Slash commands removidos de ${path.relative(CWD, cfg.commandsDest)}/`);
      }
    }
    log();
    ok('Harness desinstalado.');
    log();
    return;
  }

  const harnessCfg = HARNESS_CONFIG[choice];
  if (!harnessCfg) {
    info('Operação cancelada.');
    log();
    process.exit(0);
  }

  const { name, commandsDest } = harnessCfg;
  const harnessSrc = path.join(TEMPLATES, 'agents', 'harness', name);

  if (!fs.existsSync(harnessSrc)) {
    error(`Harness "${name}" não encontrado nos templates.`);
    process.exit(1);
  }

  for (const cfg of Object.values(HARNESS_CONFIG)) {
    removeSddCommands(cfg.commandsDest);
  }

  copyDir(harnessSrc, path.join(agentsDir, 'harness', name), ['commands']);
  ok(`Harness instalado: ${name}`);

  const cmdSrc = path.join(harnessSrc, 'commands');
  if (fs.existsSync(cmdSrc)) {
    copyDir(cmdSrc, commandsDest);
    ok(`Slash commands instalados em ${path.relative(CWD, commandsDest)}/`);
  }

  log();
  showSlashCommands();
  log();
}

async function update() {
  log();
  log(bold('sdd update'));
  log();

  const agentsDir = path.join(CWD, 'agents');
  if (!fs.existsSync(agentsDir)) {
    error('Pasta agents/ não encontrada. Rode ' + bold('sdd init') + ' primeiro.');
    log();
    process.exit(1);
  }

  warn('Isso atualizará AGENTS.md, RULES.md, QUICKSTART.md e todos os prompts.');
  const answer = await ask('  Deseja continuar? (s/N) ');
  if (answer.toLowerCase() !== 's') {
    info('Operação cancelada.');
    log();
    process.exit(0);
  }
  log();

  const coreFiles = [
    { rel: ['AGENTS.md'],           dest: path.join(CWD, 'AGENTS.md') },
    { rel: ['QUICKSTART.md'],       dest: path.join(CWD, 'QUICKSTART.md') },
    { rel: ['agents', 'AGENTS.md'], dest: path.join(agentsDir, 'AGENTS.md') },
    { rel: ['agents', 'RULES.md'],  dest: path.join(agentsDir, 'RULES.md') },
  ];

  for (const { rel, dest } of coreFiles) {
    copy(path.join(TEMPLATES, ...rel), dest);
    ok(`Atualizado: ${rel.join('/')}`);
  }

  copyDir(
    path.join(TEMPLATES, 'agents', 'prompts'),
    path.join(agentsDir, 'prompts')
  );
  ok('Atualizado: agents/prompts/');

  log();
  info('Preservados (dados do projeto):');
  ['agents/PROJECT.md', 'agents/DECISIONS.md', 'agents/skills/', 'agents/specs/', 'agents/harness/']
    .forEach(f => log(`  ${dim(f)}`));
  log();
  ok('Workflow atualizado com sucesso.');
  log();
}

function help() {
  log();
  log(bold('sdd-cli') + dim(' — Spec Driven Development workflow'));
  log();
  log('Uso:');
  log(`  sdd-cli ${c.cyan}init${c.reset}       Instala o workflow no projeto atual`);
  log(`  sdd-cli ${c.cyan}harness${c.reset}    Instala, troca ou remove o harness do agente`);
  log(`  sdd-cli ${c.cyan}update${c.reset}     Atualiza prompts e regras, preserva dados do projeto`);
  log(`  sdd-cli ${c.cyan}help${c.reset}       Exibe esta mensagem`);
  log(`  sdd-cli ${c.cyan}--version${c.reset}  Exibe a versão instalada`);
  log();
  log(dim('  Alias: sdd init / sdd harness / sdd update / sdd help / sdd --version'));
  log();
  log(dim('  Documentação: https://github.com/moisesuailab/spec-driven-workflow'));
  log();
}

const cmd = process.argv[2];

switch (cmd) {
  case 'init':
    init().catch(e => { error(e.message); process.exit(1); });
    break;
  case 'harness':
    harness().catch(e => { error(e.message); process.exit(1); });
    break;
  case 'update':
    update().catch(e => { error(e.message); process.exit(1); });
    break;
  case 'help':
  case '--help':
  case '-h':
    help();
    break;
  case '--version':
  case '-v':
    log(VERSION);
    break;
  case undefined:
    help();
    break;
  default:
    error(`Comando desconhecido: "${cmd}"`);
    help();
    process.exit(1);
}
