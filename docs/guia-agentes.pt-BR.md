# Guia para trabalhar com agentes de IA

Este guia mostra como usar o sdd-flow com um agente de IA, do primeiro comando ao encerramento de uma mudança.
Ele reúne o fluxo, os comandos, os arquivos e prompts prontos para colar no agente.

Para aprofundar cada assunto, consulte [uso](usage.pt-BR.md), [metodologia](methodology.pt-BR.md),
[setup e documentos](setup-documents.pt-BR.md), [quality gates](quality-gates.pt-BR.md),
[gestão de specs](spec-management.pt-BR.md) e [formatos](formats.md). Em caso de divergência, valem o código
e os arquivos instalados no seu projeto (`agents/`), e não este guia. Confira a versão com `sdd --version`.

## 1. O que o sdd-flow é e o que não é

O sdd-flow é um CLI que instala e mantém, dentro de um projeto, uma estrutura de desenvolvimento orientado por
especificações. Cada mudança vira uma *spec* com requisitos, critérios de aceitação, tarefas e evidências.

Ele **não** é um modelo de IA, um editor, um framework de aplicação, um orquestrador de vários agentes nem uma
ferramenta que desenvolve sozinha. Também não é um sandbox: os comandos de verificação configurados rodam com as
permissões da conta que os executa.

Três papéis, com responsabilidades separadas:

| Papel | Responsabilidade |
|---|---|
| CLI | Operações objetivas: criar specs, montar contexto, validar estrutura, registrar aprovação, executar verificações, encerrar |
| Documentos | Memória persistente do projeto, em Markdown, YAML e JSON, dentro do repositório |
| Agente de IA | Pesquisar, planejar, implementar e analisar, seguindo as regras dos documentos |
| Pessoa responsável | Decidir produto, escopo e arquitetura, autorizar, revisar e aceitar o encerramento |

## 2. Instalar e ativar

Requer Node.js 22 ou superior para o CLI. O projeto desenvolvido pode usar qualquer linguagem.

~~~sh
npm install -g sdd-flow
sdd --version

cd /caminho/do/projeto
sdd init
sdd doctor
~~~

`sdd init` copia a estrutura para o projeto e preserva arquivos já existentes. Logo após o `init`, o `doctor` indica
pendência até que `agents/PROJECT.md` seja preenchido; isso é esperado.

Sem instalação global: `npx sdd-flow@latest --help`.

Integração nativa, opcional:

~~~sh
sdd harness claude-code   # ou: sdd harness opencode
~~~

Só Claude Code e OpenCode têm adaptador. Qualquer outro agente que consiga ler arquivos e executar comandos no
terminal pode seguir o fluxo a partir do `AGENTS.md` da raiz.

### Configuração inicial com o agente

Abra uma sessão com o agente e envie:

~~~text
Leia e siga integralmente agents/SETUP.md.

Inspecione o projeto real: estrutura, tecnologias, padrões, configurações e comandos de teste.
Preencha agents/PROJECT.md, agents/POLICIES.md, agents/QUALITY.md e agents/config.yaml
com informações verificáveis. Distinga fatos observados, convenções inferidas e decisões desconhecidas.

Não invente decisões, regras de negócio ou histórico. Não altere funcionalidades nesta etapa.
Ao terminar, liste o que preencheu e o que ficou pendente para minha decisão.
~~~

Revise o resultado. Depois de concluído, `agents/SETUP.md` pode ser removido; a manutenção normal não o recria.

## 3. Estrutura criada

Resultado de `sdd init` seguido de `sdd new`:

~~~text
projeto/
├── AGENTS.md                 ponto de entrada para agentes (bloco gerenciado)
├── QUICKSTART.md
└── agents/
    ├── AGENTS.md             mapa do fluxo
    ├── RULES.md              regras essenciais do método
    ├── PROJECT.md            mapa curto do projeto
    ├── POLICIES.md           restrições obrigatórias do projeto
    ├── QUALITY.md            critérios de qualidade do projeto
    ├── DECISIONS.md          decisões históricas
    ├── SETUP.md              configuração inicial (removível)
    ├── config.yaml           modo, autonomia, aprovação, orçamento de contexto, checks
    ├── prompts/              procedimentos das fases (rpi-*.md, intake, quality, commit, PR)
    ├── skills/               procedimentos técnicos reutilizáveis, com front matter YAML
    ├── current/              contratos e comportamento vigente por capacidade
    ├── decisions/            decisões (ADRs) ativas e substituídas
    ├── specs/
    │   └── 001-nome/
    │       ├── change.yaml   manifesto: ID estável, modo, referências, autorização
    │       ├── SPEC.md       requisitos e critérios de aceitação
    │       └── TASK.md       única fonte do estado das tarefas
    ├── archive/              mudanças encerradas
    └── .sdd/                 estado interno (registry.json, installed.json, lixeira, backups)
~~~

Outros arquivos aparecem conforme o modo e a execução: `RESEARCH.md` (obrigatório no modo rigorous), `STATE.md`
(nota curta opcional para retomar), `verification.json`, `VALIDATION.md`, `history/` e `runs/`.

O que cada documento responde:

| Documento | Pergunta que responde |
|---|---|
| `PROJECT.md` | O que é o sistema e onde está cada coisa? Mantenha curto, sem copiar a documentação inteira |
| `POLICIES.md` | O que é sempre proibido ou obrigatório? Regras obrigatórias ficam aqui, nunca só em uma skill |
| `QUALITY.md` | Como a qualidade é julgada (testes, segurança, acessibilidade, desempenho)? |
| `config.yaml` | Qual o modo, a autonomia, o orçamento de contexto e os comandos reais de verificação? |
| `SPEC.md` | O que deve ser feito e como saber que está correto? |
| `TASK.md` | Quais tarefas existem, suas dependências e seu estado? |
| `current/` | O que o sistema faz hoje, por capacidade? |
| `decisions/` | Por que foi decidido assim? |

## 4. Modos e autonomia

| Modo | Quando usar | O que exige |
|---|---|---|
| `light` | Correção pequena e delimitada | SPEC e manifesto; tarefas e pesquisa opcionais |
| `standard` | Funcionalidade com escopo definido (padrão) | Requisitos, critérios de aceitação e tarefas coesas |
| `rigorous` | Mudança ampla, crítica ou com incerteza | `RESEARCH.md` com evidências e autorização explícita de escopo |

Escolha pelo risco e pela incerteza, não só pelo tamanho. Verificação e consolidação valem em todos os modos.

~~~sh
sdd new corrigir-validacao-email --mode light
sdd new modulo-financeiro --mode standard
sdd new migracao-arquitetural --mode rigorous
~~~

**Autonomia** (`autonomy` em `config.yaml`). O padrão em projetos novos é `step`: o agente implementa uma tarefa,
verifica e para para revisão. Autorização explícita da pessoa para tarefas nomeadas, ou para todas, permite um lote
limitado sem mudar a configuração. Aprovar o plano, por si só, não autoriza executar todas as tarefas. Mesmo em lote,
cada tarefa é verificada e atualizada separadamente, respeitando as dependências. `batch` como configuração
permanente é uma escolha do projeto, e a configuração existente é preservada nas atualizações.

## 5. O ciclo: pesquisar, planejar, implementar, validar, encerrar

As fases são **responsabilidades**, não conversas obrigatoriamente separadas. Podem ocorrer na mesma sessão, em
sessões novas ou com delegação nativa do agente; os arquivos canônicos permitem retomar após compactação ou troca
de sessão.

| Fase | Objetivo | Procedimento | Produz |
|---|---|---|---|
| Research | Entender antes de especificar | `agents/prompts/rpi-research.md` | `RESEARCH.md` (obrigatório só no `rigorous`) |
| Plan | Definir escopo observável, aceitação e tarefas | `rpi-plan.md` | `SPEC.md`, `TASK.md`, `change.yaml` |
| Implement | Executar uma tarefa autorizada | `rpi-implement.md` | Código, testes, `TASK.md` atualizado |
| Validate | Provar o que foi realmente verificado | `rpi-validate.md` | Evidências, `verification.json` |
| Close | Consolidar o conhecimento e encerrar | `rpi-close.md` | Contratos em `current/`, decisões, spec encerrada |

Pontos de atenção em cada fase:

- **Research:** não implementar; separar fatos observados de hipóteses; registrar dúvidas materiais. Em mudança simples
  pode ser dispensada.
- **Plan:** não transformar suposição em requisito. Faltando decisão material, apresentar alternativas e pedir a decisão.
  Tarefas pequenas, com ID estável, dependências e critério de conclusão.
- **Implement:** carregar só o contexto da tarefa; respeitar políticas e contratos; não refatorar o que não foi pedido.
- **Validate:** rodar apenas os comandos configurados; nunca ajustar testes para esconder falha; registrar o que
  ocorreu de fato.
- **Close:** não encerrar spec incompleta. Arquivar não é excluir.

### Resultados de verificação

| Veredito | Significado |
|---|---|
| `passed` | Verificação completa aprovada para os inputs atuais |
| `limited` | Implementação concluída, mas há verificações externas pendentes, registradas com handoff |
| `partial` | Verificação parcial ou condições de encerramento ainda não atendidas; nunca fecha a mudança |
| `failed` | Falha obrigatória observada, ou inputs mudaram durante a execução |

`limited` não significa que testes externos passaram, nem autoriza publicação ou deploy. Ambiente indisponível não
transforma uma entrega em `passed`.

## 6. Comandos

IDs nos exemplos são ilustrativos; use o ID real retornado pelo CLI. Todos os comandos aceitam `--json`.

| Comando | Para quê |
|---|---|
| `sdd init [--mode] [--harness] [--docs]` | Instalar a estrutura no projeto |
| `sdd docs [--types prd,roadmap,sd,ds,adr] [--dry-run]` | Criar rascunhos de documentos-base (produto, roadmap, arquitetura, design system, ADR); nunca sobrescreve |
| `sdd new <nome> [--mode]` | Criar uma spec |
| `sdd context <spec> [--phase] [--task] [--inspect] [--max-bytes] [--budget-mode]` | Montar o pacote de contexto da fase/tarefa |
| `sdd skills list \| show <nome> \| migrate [--dry-run]` | Consultar skills; migrar skills 1.x sem front matter |
| `sdd check <spec> [--phase] [--final]` | Verificar estrutura, metadados e relações dos artefatos |
| `sdd approve <spec> --by <nome>` | Registrar autorização do escopo atual |
| `sdd revise <spec> --by --reason [--dry-run]` | Registrar mudança de requisitos já aprovados |
| `sdd evidence <spec> [--out]` | Gerar o modelo de evidências para preenchimento |
| `sdd handoff <spec>` | Gerar o modelo de handoff das verificações externas pendentes, para preenchimento |
| `sdd verify <spec> [--scope full\|partial] [--evidence] [--handoff] [--run-external]` | Executar as verificações configuradas e registrar o resultado |
| `sdd close <spec> --by [--note] [--archive]` | Encerrar (e opcionalmente arquivar) |
| `sdd reopen \| cancel <spec> --by --reason` | Reabrir ou cancelar, com motivo registrado |
| `sdd rename \| archive \| restore \| remove` | Reorganizar, arquivar, recuperar e descartar specs (use `--dry-run`; `remove` é recuperável, a menos que use `--permanent`) |
| `sdd reconcile [--dry-run]` | Reconciliar o inventário de specs movidas ou ausentes |
| `sdd status [<spec>] [--all]` | Estado das specs ativas; `--all` inclui arquivo, lixeira e metadados retidos |
| `sdd doctor` | Diagnosticar a instalação |
| `sdd update [--dry-run] [--replace-managed]` | Atualizar arquivos gerenciados, preservando os do projeto |
| `sdd migrate <spec> [--dry-run]` | Migrar uma spec 1.x para o formato 2 |
| `sdd harness <claude-code\|opencode> [--remove]` | Instalar/remover pontos de entrada nativos |
| `sdd export <alvo> --out <pasta>` | Exportar conhecimento (claude-code, opencode, agent-skills) |

`check` valida a **estrutura**; `verify` executa as **verificações**. Um documento válido não prova que o software funciona.

### Fluxo típico

~~~sh
sdd new sistema-notificacoes --mode standard
sdd context 001-sistema-notificacoes --phase plan
sdd check 001-sistema-notificacoes
sdd approve 001-sistema-notificacoes --by "Responsavel"      # só após a pessoa revisar o escopo

sdd context 001-sistema-notificacoes --phase implement --task T01
sdd verify 001-sistema-notificacoes --scope partial           # feedback durante a implementação

sdd verify 001-sistema-notificacoes                           # verificação completa
sdd close 001-sistema-notificacoes --by "Responsavel" --archive
~~~

Se nenhum conhecimento duradouro mudou, o encerramento exige uma justificativa com `--note`.

## 7. Contexto

O `sdd context` monta um pacote com o que importa para a fase e a tarefa: regras, política, spec, tarefa, referências,
contratos e skills aplicáveis. Em vez de carregar o repositório inteiro, o agente recebe um recorte.

- `context.max_bytes` (padrão 48000) mede **bytes UTF-8 do pacote**. Não é contagem de tokens nem a janela de
  contexto do modelo.
- `context.budget_mode`: `warn` (padrão) entrega o pacote completo com aviso e `fits_budget: false`; `strict` recusa
  o pacote excedido com `CONTEXT_BUDGET_EXCEEDED`. Pode ser sobrescrito com `--budget-mode warn|strict`.
- `--inspect` mostra tamanhos e documentos contribuintes, sem exibir o conteúdo, e termina normalmente.
- Nada é truncado silenciosamente.

Pacote grande demais? Selecione por tarefa (`--task`), referencie seções específicas em vez de arquivos inteiros e
leia fontes grandes sob demanda. Separe a spec apenas quando houver entregas realmente independentes, não por
tamanho. Para pedidos amplos, o agente segue `agents/prompts/intake.md`.

O CLI não controla o histórico da conversa nem impede que se cole conteúdo excessivo no chat.

## 8. Aprovação e governança

1. O agente pesquisa e apresenta o plano.
2. A pessoa revisa e autoriza.
3. `sdd approve` registra a autorização do escopo **atual**.
4. O agente implementa dentro desse escopo e registra evidências.
5. A pessoa avalia a entrega.

Mudou um requisito já aprovado? Atualize SPEC e plano, rode `sdd revise <spec> --by ... --reason ... --dry-run`,
confira o impacto, registre a revisão e aprove o novo escopo. Resultados de verificação anteriores deixam de valer
quando os inputs mudam.

Ressalvas: o registro de aprovação é uma declaração documentada, não autenticação de identidade; o agente nunca deve
registrar aprovação que a pessoa não deu; e o CLI não é um sandbox.

## 9. Prompt mestre

Cole no início de uma sessão para que o agente entenda o método e diagnostique o projeto **antes** de alterar
qualquer coisa. Ele é curto de propósito: o conteúdo normativo está nos arquivos do projeto (`agents/RULES.md`,
`agents/AGENTS.md`, `agents/prompts/`), que são a fonte de verdade e evoluem com a versão instalada.

~~~text
Você atuará como engenheiro de software sênior neste projeto, que usa o sdd-flow
(desenvolvimento orientado por especificações com agentes de IA).

Fontes de verdade, nesta ordem:
1. A solicitação e as autorizações da pessoa responsável.
2. AGENTS.md (raiz), agents/RULES.md, agents/AGENTS.md, agents/POLICIES.md, agents/PROJECT.md
   e agents/QUALITY.md.
3. agents/config.yaml (modo, autonomia, aprovação, checks).
4. Os procedimentos de fase em agents/prompts/ e o estado da spec (change.yaml, SPEC.md, TASK.md).
Se algo aqui divergir desses arquivos, siga os arquivos e aponte a divergência.

Antes de qualquer implementação, nesta sessão:
- Execute `sdd --version` e `sdd doctor`; leia os arquivos acima.
- Não altere código nem documentos.
- Apresente: (a) o que entendeu do método e deste projeto; (b) o estado atual (`sdd status`);
  (c) lacunas, riscos e perguntas que dependem de mim.

Regras que valem sempre:
- Não invente requisitos, APIs, regras de negócio, aprovações, evidências nem resultados de teste.
  Separe fatos observados de hipóteses; registre incertezas.
- Implemente somente o escopo autorizado. Respeite `autonomy`: no padrão `step`, uma tarefa por vez,
  verificada, e pare para revisão, salvo autorização explícita para tarefas nomeadas ou lote.
- Monte o contexto com `sdd context`; carregue só o que a tarefa exige.
- Rode apenas os comandos de verificação configurados. Nunca ajuste testes para esconder falhas.
- `limited` não é `passed`. Não declare algo validado sem execução real.
- Preserve histórico, IDs e decisões. Mudança de requisito aprovado passa por `sdd revise` e nova aprovação.
- Não registre aprovação em meu nome. Não execute comandos destrutivos, publique ou altere produção
  sem autorização específica.
- Faltando decisão material, apresente alternativas e pergunte.
~~~

## 10. Prompts para o dia a dia

Não é preciso repetir o prompt mestre. Cada fase tem seu procedimento em `agents/prompts/`.

**Pesquisa**

~~~text
Leia e siga agents/prompts/rpi-research.md. Objetivo: <descreva a necessidade>.
Não implemente. Registre as descobertas na spec <ID> e liste decisões que dependem de mim.
~~~

**Planejamento**

~~~text
Leia e siga agents/prompts/rpi-plan.md para a spec <ID>. Use a pesquisa e as referências.
Defina requisitos, escopo e fora de escopo, critérios de aceitação, tarefas com dependências e riscos.
Não implemente. Apresente o escopo para minha revisão; não registre aprovação.
~~~

**Implementação**

~~~text
Leia e siga agents/prompts/rpi-implement.md. Spec <ID>, tarefa <T01>.
Monte o contexto com `sdd context <ID> --phase implement --task <T01>`.
Implemente apenas essa tarefa, rode as verificações pertinentes, atualize TASK.md e pare para revisão.
~~~

**Validação**

~~~text
Leia e siga agents/prompts/rpi-validate.md para a spec <ID>.
Execute as verificações configuradas e registre comandos, resultados, falhas e limitações.
Não declare passed se houver verificação obrigatória pendente.
~~~

**Encerramento**

~~~text
Leia e siga agents/prompts/rpi-close.md para a spec <ID>.
Confirme requisitos, tarefas, evidências e validação; consolide contratos em current/ e decisões.
Não encerre se houver condição obrigatória pendente. Prepare o encerramento; eu autorizo.
~~~

## 11. Exemplo: módulo de usuários

Pedido: *"Criar um módulo de usuários com cadastro, edição, listagem, exclusão, permissões e recuperação de senha."*

1. **Intake.** Pedido amplo: o agente segue `intake.md` e propõe entregas coesas e ligadas, por exemplo
   "usuários (CRUD)", "permissões" e "recuperação de senha", em vez de uma spec gigante.
2. **Spec.** `sdd new usuarios-cadastro --mode standard`.
3. **Research** (se houver incerteza): autenticação existente, banco, padrões de permissão, consumidores da API.
4. **Plan.** `SPEC.md` com requisitos e critérios de aceitação; `TASK.md` com tarefas e dependências, por exemplo:

| ID | Tarefa | Depende de |
|---|---|---|
| T01 | Definir modelo de usuário | n/d |
| T02 | Implementar persistência | T01 |
| T03 | Implementar cadastro | T02 |
| T04 | Implementar edição | T02 |
| T05 | Implementar listagem | T02 |
| T06 | Implementar interface | T03, T04, T05 |
| T07 | Testes de integração | T03 a T06 |

5. **Aprovação.** A pessoa revisa; `sdd approve usuarios-cadastro --by "Nome"`.
6. **Implement.** Uma tarefa por vez (`step`): `sdd context ... --task T01`, implementar, verificar, parar.
7. **Validate.** `sdd verify <ID>`; se faltar ambiente externo, `sdd handoff <ID>` e fechar como `limited`, sem alegar sucesso externo.
8. **Close.** Consolidar o contrato em `current/`, registrar decisões e `sdd close <ID> --by "Nome" --archive`.

Durante o desenvolvimento, "incluir notificação por e-mail" altera o escopo aprovado: atualizar a spec,
`sdd revise --dry-run`, registrar a revisão e aprovar de novo.

## 12. Projetos existentes e migração

- **Projeto novo ou existente sem o sdd-flow:** `sdd init`, depois a configuração inicial com o agente (seção 2).
  Comece por uma funcionalidade pequena de ponta a ponta antes de padronizar.
- **Projeto na versão 1.x:** faça commit ou backup, rode `sdd update --dry-run`, revise e aplique. Depois
  `sdd skills migrate --dry-run` (skills sem front matter), `sdd migrate <spec> --dry-run` para cada spec e
  `sdd reconcile --dry-run`. Veja o [guia de migração](migration.md).
- Atualizar o CLI global **não** altera os arquivos já copiados nos projetos; use `sdd update`.

## 13. Boas práticas

| Faça | Por quê |
|---|---|
| Uma spec por mudança coesa | Controle e rastreabilidade |
| Requisitos objetivos e verificáveis | Evita interpretações ambíguas |
| Tarefas pequenas, com critério de conclusão | Revisão simples |
| Contexto só do que a tarefa exige | Menos ruído e custo |
| Regras obrigatórias em `POLICIES.md` | Skills são opcionais; políticas não |
| Skills só para conhecimento técnico recorrente | Evita burocracia |
| Versionar `agents/` no Git | Preserva histórico |
| Atualizar `current/` ao encerrar | Documentação não envelhece |

Evite: uma spec única para o sistema inteiro; regras de negócio dentro de `PROJECT.md`; pesquisa extensa para
mudança trivial; tarefas sem critério de conclusão; implementar antes de aprovar o escopo quando exigido; assumir que
testes unitários descartam regressões; confundir o sdd-flow com um orquestrador multiagente.

## 14. Limitações

1. Não controla as mensagens enviadas ao modelo nem sua janela de contexto.
2. Não garante que a especificação esteja semanticamente correta nem que os testes cubram tudo.
3. Não substitui revisão humana, CI/CD, testes de segurança ou monitoramento.
4. Não é sandbox: comandos configurados rodam com as permissões de quem os executa.
5. Não garante acesso a serviços externos nem a ambientes de homologação ou produção.
6. Não exige nem implementa orquestração de vários agentes.
