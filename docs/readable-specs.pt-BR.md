# Specs legíveis no dia a dia

A versão 3.0 mantém o método RPIV, os IDs, a aprovação de escopo e a verificação vinculada aos inputs.
A mudança está na experiência de leitura: requisitos, aceitação e tarefas ficam no corpo Markdown;
metadados de identificação ficam pequenos. Não existe uma cópia editável paralela do estado.

## O que você acompanha

| Arquivo | Uso |
|---|---|
| RESEARCH.md | Descobertas, fontes, alternativas e incertezas reais |
| SPEC.md | Objetivo, limites, requisitos e critérios de aceitação |
| TASK.md | Plano com marcadores visíveis, dependências e verificação |
| VALIDATION.md | Resultado curto e pendências atuais |
| USER_TESTS.md | Roteiro quando uma verificação precisa do usuário |
| change.yaml | Identidade estável, referências e autorização; o agente mantém |
| .sdd/ dentro da spec | Registros técnicos locais; consulta excepcional, fora do Git |

Não crie STATE.md, PROGRESS.md, resumos paralelos ou checkpoints no trabalho habitual. Cada documento
deve ter uma finalidade distinta: pesquisa, escopo, tarefas ou validação. Uma necessidade excepcional ou
pedido explícito pode justificar outro arquivo, com propósito claro e sem repetir a fonte de verdade.

O modo standard cria RESEARCH.md com pesquisa ainda pendente. Preencha com fatos e fontes ou explique
por que ela é dispensável, usando status: not_needed. Rigorous exige pesquisa concluída; light só cria
pesquisa/tarefas quando úteis. Um template vazio não comprova que houve pesquisa.

## Exemplo de SPEC.md

~~~markdown
---
schema_version: 2
artifact: spec
id: 001-exportacao
format: markdown
language: pt-BR
---

# Exportação

## Objetivo
Exportar os itens selecionados, preservando a autorização atual.

## Requisitos

- **REQ01** — Exportar somente os itens que a pessoa pode consultar.

## Critérios de aceitação

- **AC01** — Com dois itens sintéticos autorizados e um restrito, o CSV contém somente os dois autorizados.
  - Cobre: REQ01
  - Método: automated
  - Checks: unit
~~~

O check unit é ilustrativo; use somente checks reais do projeto. Exemplos devem usar dados sintéticos.
Mantenha textos longos e exemplos de código fora das seções de listas estruturadas. Não repita requisitos
em dois lugares. O CLI aceita os rótulos documentados em português ou inglês e IDs com ou sem negrito.

## Exemplo de TASK.md

~~~markdown
---
schema_version: 2
artifact: tasks
id: 001-exportacao
format: markdown
language: pt-BR
---

# Plano de execução

## Tarefas

- [ ] **T01** — Implementar exportação e regressão de autorização.
  - Cobre: REQ01, AC01
  - Depende de: —
  - Verificação: O CSV inclui apenas os dois itens autorizados e as regressões pertinentes passam.
~~~

| Marcador | Significado |
|---|---|
| [ ] | Não concluída: pendente, em andamento ou com verificação externa pendente |
| [x] | Concluída com verificação disponível |
| [-] | Cancelada; preservar ID, responsável e motivo |

[ ] e [x] são checkboxes Markdown padrão; [-] é uma convenção textual para cancelamento.
Quando for útil distinguir uma tarefa aberta, use uma linha curta abaixo dela:

~~~markdown
- [ ] **T02** — Integrar a interface.
  - Situação: em andamento

- [ ] **T03** — Validar no ambiente institucional.
  - Situação: verificação externa pendente
  - Tipo: verification
  - Adiado por: responsável pela verificação
  - Motivo do adiamento: ambiente isolado ainda indisponível
~~~

Os exemplos mostram apenas a apresentação do andamento; mantenha também Cobre, Depende de e Verificação do plano.
Sem Situação, [ ] significa pendente. Ao marcar [x] ou [-], remova a linha de Situação da tarefa aberta;
o CLI recusa combinações contraditórias. O roteiro externo fica em USER_TESTS.md, quando necessário.
O parser continua lendo [/] e [>] de arquivos anteriores; novas gravações usam os três marcadores acima.
Editar apenas o marcador, Situação ou uma nota de evidência não altera o escopo aprovado. Alterar a tarefa,
cobertura, dependências ou condição de verificação exige revisão correspondente.
Situação apenas qualifica uma tarefa aberta no próprio TASK.md. Não crie uma segunda tabela em PROGRESS/STATE.

Para um bloqueio ou próxima ação que não seja evidente, acrescente apenas uma nota curta na tarefa:

~~~markdown
  - Notas: Bloqueio: contrato externo indefinido; próxima ação: confirmar o campo obrigatório.
~~~

Notas é opcional; omita quando não acrescentar informação. Substitua notas obsoletas, sem diário acumulativo.
Elas não alteram o escopo, não concluem tarefas nem comprovam testes. Alterar somente Notas não invalida
a aprovação ou o recibo de uma verificação pelo modelo de tarefas; requisitos e regras devem permanecer nos campos normativos.
Referências explícitas ao arquivo inteiro continuam verificadas pelos seus bytes, mesmo se a alteração for uma nota.
Novos fatos que mudem o comportamento exigem atualizar o contrato/plano e a verificação correspondente.

Cancelamentos usam Cancelado por e Motivo do cancelamento. Adiamentos usam Tipo: verification,
Adiado por e Motivo do adiamento, cobrindo apenas critérios externos.
Um documento, recomendação ou código ainda por produzir continua sendo trabalho pendente; não deve ser
reclassificado como teste externo apenas para obter encerramento. Use verificação parcial nesse caso.

## Leitura dos demais arquivos

Você continua acompanhando principalmente SPEC.md e TASK.md. A existência dos demais arquivos não exige
que você ou o agente leiam tudo a cada tarefa. O contexto usa os documentos centrais, a fase e as referências selecionadas.

| Arquivo ou grupo | Quando entra na leitura |
|---|---|
| SPEC.md e TASK.md | Trabalho diário; --task seleciona os requisitos, critérios e tarefa pertinentes |
| RESEARCH.md | Pesquisa e planejamento; consultar depois se uma descoberta precisar ser revista |
| VALIDATION.md | Revisar o resultado e as pendências de uma verificação |
| USER_TESTS.md | Quando alguém precisa executar uma verificação externa segura |
| RULES.md, PROJECT.md e POLICIES.md | Base do contexto: restrições, mapa do projeto e regras obrigatórias |
| QUALITY.md | Planejamento, validação e encerramento; critérios de qualidade aplicáveis |
| SETUP.md | Configuração inicial; pode ser removido depois |
| AGENTS.md e prompts | Mapa de entrada e instrução da fase atual, sem carregar todas as fases juntas |
| docs/, current/, decisions/ e skills/ | Somente referências/procedimentos selecionados ou necessários à investigação |
| config.yaml e change.yaml | O CLI consulta para configurações, referências e controles; você não precisa editar esses campos a cada tarefa |
| .sdd/ da spec | Recibos e histórico técnico local; investigação pontual, fora da leitura cotidiana |

Material confidencial necessário usa agents/.sdd/private/, sem criar documentos extras quando não houver necessidade.
Fontes privadas selecionadas são omitidas do contexto comum; --include-private permite sua leitura autorizada.
Avisos de privacidade locais não interrompem o fluxo padrão; a revisão antes de compartilhar permanece necessária.
Consulte [privacidade](privacy.pt-BR.md) para limites, credenciais e configuração.

O frontmatter pequeno identifica os documentos e permite seleção/validação. A explicação fica no corpo Markdown.
Nem todos os documentos usam o mesmo formato: instruções e mapas mantêm seu papel próprio, sem virar listas de tarefas.
Arquivos grandes de referência podem ser consultados por seção ou sob demanda; docs/ não é carregada inteira.
O pacote leva apenas metadados das skills selecionadas; o catálogo completo é consultado sob demanda.
Não grave o pacote de contexto como outro documento nem repita os arquivos inteiros no chat. Use --inspect
para conferir o que foi selecionado. O tamanho em bytes não é uma contagem de tokens nem uma garantia de custo.

A retomada usa tarefas abertas, dependências, notas pertinentes e resultados atuais. Um STATE.md antigo
permanece intacto, mas não entra automaticamente no contexto. Consulte-o se necessário ou selecione-o
explicitamente nas referências. Antes de removê-lo, preserve informações únicas no documento apropriado;
nenhum arquivo existente é apagado automaticamente por esta simplificação.

## Conversão de uma spec existente

Atualizar o CLI e os templates não modifica automaticamente suas specs.

~~~sh
sdd migrate 001-exportacao --readable --dry-run
sdd migrate 001-exportacao --readable
~~~

A conversão mantém IDs, estados das tarefas e cópias dos originais. Registros técnicos antigos ficam
locais; o relatório anterior passa a ser histórico. O escopo ativo volta a draft e precisa de revisão,
autorização real e nova verificação. Specs closed/cancelled preservam seu estado de ciclo de vida.
Não há execução nem mudança de código da aplicação durante a conversão.

O roteiro de testes anterior fica preservado localmente como histórico; a versão visível pede um handoff atual. Notas antigas de STATE.md recebem um aviso de conversão. Os registros locais ficam ignorados, mas o Git não esquece arquivos já rastreados. Revise o diff e
execute sdd privacy --staged antes de um commit autorizado. Consulte privacy.pt-BR.md.

## Prompts curtos continuam funcionando

~~~text
Leia e siga agents/prompts/rpi-implement.md para a spec 001-exportacao.
~~~

O agente usa os comandos disponíveis e mantém os registros internos. Você acompanha as listas e os
resultados. O harness continua responsável pelas ferramentas, permissões e eventual delegação.
