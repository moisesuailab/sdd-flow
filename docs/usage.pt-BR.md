# Guia de uso do sdd-flow

Este guia descreve a evolução 2.x deste checkout. Em 20/11/2026 o registro público ainda anuncia 1.3.3 como latest.
Os comandos novos ficam disponíveis depois de instalar este checkout ou uma publicação 2.x.
O CLI precisa de Node.js 22+, mas o projeto desenvolvido pode usar outra linguagem ou plataforma.

O objetivo é metodológico: organização, contexto pertinente e rastreabilidade. O fluxo não cria um orquestrador.
Leia methodology.pt-BR.md para a comparação com as versões analisadas e local-testing.pt-BR.md para testar.
Fases podem ocorrer na mesma conversa; após compactação ou troca de sessão, retome pelos arquivos canônicos.

Defina documentation.language: pt-BR em config.yaml para os documentos do aplicativo.
Preserve português correto e UTF-8. As instruções do método continuam em inglês, sem impor inglês às specs.
O padrão auto acompanha o idioma do usuário até a escolha da equipe ser registrada no setup.

Para qualidade, TDD/BDD e testes sem ambiente real, leia quality-gates.pt-BR.md.
QUALITY.md é do projeto e só entra automaticamente em plan/validate/close.
Checks required falhos bloqueiam aprovação; advisory geram avisos. External não executa sem --run-external.
A ausência de ambiente pode gerar handoff seguro e conclusão limited, com pendências explícitas.
Isso permite concluir implementação sem afirmar funcionamento externo ou autorizar publicação.

## 1. O que o framework controla

O sdd-flow organiza intenção, contexto, execução e evidências em arquivos versionáveis.
O agente interpreta requisitos e implementa; o CLI verifica estrutura, referências, autorização registrada e execução.
A revisão humana continua responsável por decisões de produto e pela qualidade semântica dos testes.

O framework não intercepta mensagens coladas diretamente em qualquer chat, não mede exatamente os tokens de cada modelo
e não concede permissões nativas às ferramentas. Seus procedimentos orientam o agente; comandos verificam condições objetivas.

## 2. Começar do zero ou adotar um projeto existente

| Situação | Conduta |
|---|---|
| Projeto novo com objetivo pequeno | Configurar o mínimo conhecido e planejar uma primeira entrega verificável |
| Projeto novo com PRD extenso | Preservar o PRD, mapear capacidades e propor specs coesas com dependências |
| Aplicação existente sem sdd-flow | Inspecionar código/configurações/testes e registrar uma baseline observada |
| Aplicação usando sdd-flow 1.x | Atualizar o núcleo com prévia e migrar os artefatos antigos conservadoramente |
| Correção pequena | Modo light; tarefas e pesquisa podem ser dispensadas |
| Funcionalidade delimitada | Modo standard, com tarefas por resultado |
| Mudança ampla ou sensível | Modo rigorous, pesquisa e revisão de impacto explícitas |

### Projeto novo

Consulte setup-documents.pt-BR.md para perguntas mínimas, papéis dos documentos e presets opcionais.
sdd init --docs cria os três modelos antigos; sdd docs --types prd,sd,ds,adr,roadmap permite escolher outros.
Esses rascunhos não substituem o entendimento do agente nem representam decisões aprovadas.

Você pode começar com uma descrição do que quer construir. Informe os usuários, o problema, o primeiro
resultado esperado e restrições conhecidas. PRD, ADR/system design, design system, protótipos e exemplos
são fontes opcionais; não é necessário produzir todos esses documentos antes do setup.
O agente registra escolhas conhecidas, propõe decisões materiais em aberto e pede esclarecimentos
somente quando necessários. Documentos que divergem entre si exigem análise, não escolha silenciosa.
Preserve as fontes originais. Para PDF/imagens, use o leitor do harness; no contexto do CLI,
referencie um trecho UTF-8 revisado quando necessário, ligado ao documento de origem.

~~~sh
sdd init --harness claude-code
# ou: sdd init --harness opencode
sdd doctor
~~~

Peça ao agente:

~~~text
Leia agents/SETUP.md. Este é um projeto novo. Use os requisitos que forneci,
registre as decisões autorizadas e proponha a primeira entrega verificável.
Não invente escolhas de tecnologia quando faltar uma decisão material.
~~~

O setup preenche o mapa em PROJECT.md, as regras particulares em POLICIES.md e os checks reais em config.yaml.
Cria skills somente para procedimentos recorrentes que já façam sentido. Pode manter perguntas materiais em aberto.

### Projeto em desenvolvimento

~~~text
Leia agents/SETUP.md e adote este projeto existente.
Inspecione a arquitetura e os testes reais. Registre fatos observados e incertezas.
Não refatore o aplicativo durante a adoção nem crie specs fictícias para todo o passado.
Depois vamos usar o fluxo na próxima alteração.
~~~

Registre o comportamento relevante em contratos vigentes de capacidade. Não é necessário reconstruir todos os commits antigos.
Uma inconsistência preexistente vira um achado a avaliar; o setup não autoriza corrigir tudo.
O levantamento considera manifests, código, contratos de dados/APIs, interface, convenções, testes e documentos.
Quando esses materiais respondem à questão, o usuário não precisa explicar novamente todo o sistema.
Se código e documentação discordarem, registre comportamento observado e intenção declarada separadamente;
o código existente também pode conter um bug. Testes de baseline só devem rodar após conferir ambiente e efeitos.
A partir daí, cada mudança nova segue o mesmo ciclo de uma aplicação iniciada com o framework.

### Análise de impacto e regressões

Antes de alterar comportamento compartilhado, examine consumidores, contratos e testes pertinentes.
Registre na própria SPEC uma nota curta: áreas afetadas, comportamento a preservar, checks de regressão
e cuidados aplicáveis com dados, migrações, caches ou integrações. Uma alteração isolada pode precisar
de apenas uma frase; não é necessário criar um documento de impacto para toda tarefa.
Compare a baseline disponível e execute os testes relevantes dos consumidores depois da mudança.
Um teste unitário verde da função alterada não basta quando outro módulo depende de seu comportamento.
Distinga regressões introduzidas, problemas anteriores e falta de acesso. Não mude assertions nem repare
áreas alheias silenciosamente para obter um relatório verde. Ausência de ambiente segue o handoff limitado.

O CLI instala a base e valida registros; é o agente que inspeciona e interpreta o projeto.
Essa interpretação precisa ser revisada, especialmente em negócios ambíguos, legados sem testes e fontes divergentes.

## 3. Da solicitação à entrega

~~~mermaid
flowchart TD
  A["Solicitação"] --> B{"Escopo suficiente?"}
  B -->|"Não"| C["Investigar e recortar"]
  C --> D["Spec e aceitação"]
  B -->|"Sim"| D
  D --> E["Implementar e verificar"]
  E --> F{"Regra mudou?"}
  F -->|"Sim"| G["Revisar impacto e autorização"]
  G --> D
  F -->|"Não"| H["Consolidar e encerrar"]
~~~

~~~sh
sdd new exportar-dados --mode standard
sdd context 001-exportar-dados --phase plan
# O agente preenche requisitos, aceitação e tarefas.
sdd check 001-exportar-dados
# Registrar somente autorização realmente dada para esse escopo:
sdd approve 001-exportar-dados --by "Moisés"
sdd context 001-exportar-dados --phase implement --task T01
# Implementar, verificar a tarefa e atualizar seu estado canônico.
sdd verify 001-exportar-dados --scope partial
# Consolidar contratos vigentes e concluir as tarefas.
sdd verify 001-exportar-dados
sdd close 001-exportar-dados --by "Moisés" --archive
~~~

Se nenhuma capacidade duradoura foi alterada, close exige --note explicando isso.
O padrão de instalações novas é step: implementar e verificar uma tarefa e parar para revisão.
Se o usuário autorizar tarefas específicas ou todas as tarefas do escopo, execute esse lote sem parar
entre elas nem repetir a confirmação; não é necessário alterar config.yaml para esse pedido.
Aprovar o plano, por si só, não autoriza executar todas as tarefas no modo step.
Batch também pode ser uma preferência permanente. Atualizações preservam a configuração existente.
Em ambos os modos, verifique e atualize cada tarefa e respeite suas dependências.
Pesquisa é opcional quando a informação já é suficiente, exceto em rigorous.
Validação parcial fornece feedback cedo e nunca encerra a spec.

## 4. O limite de contexto

O valor padrão é 48.000 bytes do pacote montado pelo comando context.
Não é um limite para o tamanho total do repositório nem uma conversão exata da janela de tokens de um modelo.
Um projeto grande pode ter um pacote pequeno quando a seleção é pertinente.
Vários arquivos pequenos também podem exceder o orçamento quando selecionados juntos.

~~~sh
sdd context 001-exportar-dados --phase implement --inspect
sdd context 001-exportar-dados --phase implement --task T01 --inspect
~~~

A inspeção mostra tamanho, documentos contribuintes, se o pacote cabe e sugestões, sem incluir seus corpos.
A inspeção termina normalmente mesmo se o pacote exceder o orçamento; ela é diagnóstica.
A geração do pacote completo excedido termina com erro CONTEXT_BUDGET_EXCEEDED e código de saída 1.
Isso não modifica arquivos, não remove requisitos e não reprova a aplicação.

O agente deve então:
1. Selecionar a tarefa correta e as referências pertinentes.
2. Usar seções explícitas das fontes grandes.
3. Separar entregas independentes em specs relacionadas, mantendo dependências e contratos compartilhados.
4. Dividir documentação de referência em assuntos coesos, sem cortar regras ao acaso.
5. Aumentar o orçamento somente quando houver justificativa e capacidade na ferramenta/modelo utilizado.

Exemplo de referência a uma parte do PRD:

~~~yaml
sources:
  - path: docs/prd.md
    section: Exportação de dados
context:
  - path: docs/contratos.md
    section: Permissões de exportação
~~~

A fonte inteira continua disponível e é considerada na verificação de validade. Só a seção selecionada entra no pacote.
Um PRD extenso não deve gerar automaticamente uma única spec enorme.
Também não se deve quebrar uma mudança atômica apenas para atingir um número arbitrário de linhas.

Exemplo de pedido ao agente:

~~~text
Antes de implementar este pedido amplo, siga agents/prompts/intake.md.
Proponha entregas verificáveis e indique quais contratos precisam ser compartilhados.
Se o pacote de contexto não couber, explique o diagnóstico e proponha o recorte.
Preserve todas as regras relevantes e as referências ao documento original.
~~~

Existe ainda um limite técnico de leitura de 2 MiB por arquivo no CLI. Fontes maiores precisam de um índice,
divisão por assunto ou consulta direta por busca antes de formar os artefatos de trabalho.
O front matter de cada Markdown também tem limite técnico de 64 KiB; mantenha metadados e planos enxutos.
Nenhum desses controles consegue impedir que uma pessoa cole conteúdo excessivo diretamente no chat.

## 5. Onde ficam regras específicas, decisões e skills

| Informação | Fonte principal | Carregamento |
|---|---|---|
| Regras essenciais e portáveis do processo | RULES.md | Toda mudança |
| Proibições e obrigações particulares do projeto | POLICIES.md | Toda mudança |
| Stack, mapa de módulos e fontes das convenções | PROJECT.md | Mapa inicial curto |
| Comportamento atual e invariantes de uma capacidade | current/ | Quando a capacidade for afetada |
| Motivo de uma escolha arquitetural | decisions/ | ADR ativo pertinente |
| Procedimento reutilizável de um domínio/tecnologia | skills/NOME/SKILL.md | Quando pertinente |
| Padrão verificável automaticamente | Configuração de lint, tipos e testes | Checks configurados |

Uma regra como “não tornar públicos os dados institucionais” é obrigatória no projeto e não pode depender
da seleção opcional de uma skill. Registre-a em POLICIES.md e implemente controles objetivos onde aplicável.
Um procedimento como “como implementar o acesso a dados neste backend Apps Script” cabe em uma skill.
A escolha arquitetural e seus motivos pertencem a um ADR; o resumo da stack fica em PROJECT.md.
Uma regra de negócio de exportação pertence ao contrato da capacidade e à aceitação da mudança.

SETUP.md é uma orientação para o agente criar/configurar esses materiais a partir de evidências.
O CLI não inventa automaticamente skills perfeitas nem ativa toda skill possível.
Descubra habilidades com sdd skills list e selecione as pertinentes em change.yaml.

~~~yaml
skills: [data-access, export-ui]
~~~

Front matter com name/description permite descoberta estável. O corpo e referências da skill só entram quando necessários.
Mantenha POLICIES.md curto; detalhes condicionais devem ser referenciados sem inflar o contexto obrigatório.

## 6. Regras ou decisões que mudam durante o desenvolvimento

### Mudança no escopo ainda ativo

1. Registre o motivo e a nova regra no contrato/spec pertinente.
2. Atualize aceitação e definições das tarefas preservando IDs. Não adapte expectativas apenas para esconder um bug.
3. Inspecione o impacto e registre a revisão:

~~~sh
sdd revise 001-exportar-dados --by "Moisés" --reason "Novo critério de autorização" --dry-run
sdd revise 001-exportar-dados --by "Moisés" --reason "Novo critério de autorização"
sdd approve 001-exportar-dados --by "Moisés"
~~~

A revisão reabre tarefas concluídas/em andamento afetadas e suas dependentes e deixa a aprovação anterior inválida.
Mudanças de políticas, do corpo normativo ou de referências podem reabrir todas as tarefas conservadoramente.
O comando compara metadados e ligações; não consegue inferir sozinho todo o impacto semântico. Revise o resultado.
Depois implemente os ajustes e produza novas evidências. Mudar o código ou o contrato torna o resultado anterior obsoleto.

### Mudança de uma decisão arquitetural

Crie o ADR substituto, preserve o anterior com status superseded e superseded_by e atualize o mapa/contratos.
Selecione a decisão ativa nas specs afetadas. Revise o escopo autorizado e os testes pertinentes.
Não reescreva o passado arquivado para fingir que a nova decisão sempre existiu.

### Mudança na configuração do fluxo

POLICIES.md, config.yaml e PROJECT.md são do projeto e são preservados por update.
Alterar regras obrigatórias, checks, exclusões de verificação ou a política de execução invalida aprovações ativas
que dependam dessa configuração. O orçamento de contexto pode mudar sem alterar a intenção normativa.
Use revise nas mudanças afetadas; configurações não são congeladas para sempre pelo setup.

### Mudança após uma entrega encerrada

Prefira uma nova spec relacionada quando existir um novo objetivo.
Use reopen quando for necessário retomar aquela mesma mudança:

~~~sh
sdd reopen 001-exportar-dados --by "Moisés" --reason "Retomar esta entrega"
~~~

Reabrir remove a evidência corrente de encerramento e exige nova verificação.
As evidências históricas permanecem. Arquivar conserva IDs; não é necessário carregar todo o arquivo histórico em cada sessão.

## 7. Arquivos para rastrear o trabalho

| Arquivo/conjunto | O que registra |
|---|---|
| change.yaml | Identidade, modo, referências, dependências, aprovação atual e estado da mudança |
| SPEC.md | Requisitos e aceitação; justificativas no corpo |
| TASK.md | Plano e único estado das tarefas |
| RESEARCH.md | Pesquisa quando necessária |
| STATE.md | Ponto de retomada opcional e curto |
| history/approval-*.json | Cópias dos escopos aprovados e seus responsáveis/data |
| history/revision-*.json | Motivo e impacto registrado das revisões |
| history/closure-*.json, history/reopen-*.json, history/cancel-*.json | Eventos correspondentes de ciclo de vida |
| verification.json | Resultado corrente para os inputs testados |
| VALIDATION.md | Resumo legível da verificação corrente |
| runs/ID/receipt.json e logs | Resultado preservado de cada execução |
| current/ e decisions/ | Conhecimento vigente consolidado e justificativas |
| archive/ | Mudanças encerradas |
| .sdd/registry.json | Reserva de identidades, inclusive após arquivamento |

Versione os arquivos relevantes no Git e preserve logs/artefatos necessários para reproduzir revisões.
Backups de manutenção e locks temporários não substituem o histórico de projeto.
O digest detecta mudança de inputs; não autentica a identidade de um revisor nem prova sozinho que um teste é semanticamente suficiente.

## 8. Instalar uma versão nova do framework

Publicar no npm e atualizar arquivos copiados nos aplicativos são operações diferentes.
Depois de uma publicação 2.x para next:

~~~sh
npm install -g sdd-flow@next
sdd --version
cd /caminho/do/aplicativo
sdd update --dry-run
sdd update
sdd doctor
sdd harness claude-code
~~~

Siga migration.md para specs 1.x. Personalizações de arquivos centrais produzem conflito e são preservadas;
só use --replace-managed após revisar a prévia e transferir regras do projeto para seus locais apropriados.
As skills e specs do projeto permanecem sob seu controle.
