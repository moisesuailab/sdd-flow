# Perguntas do setup e documentos de referência

O setup configura o modo de trabalhar com IA. Os documentos do produto fornecem contexto e decisões.
sdd init instala arquivos; o agente interpreta objetivo, código e fontes ao seguir agents/SETUP.md.
O CLI não entrevista o usuário nem descobre automaticamente todas as regras de negócio.

## O que o agente precisa saber

Não há questionário obrigatório. Primeiro consulte as informações fornecidas e o próprio projeto.
Pergunte somente sobre lacunas materiais que alterem comportamento, escopo, arquitetura ou segurança.

| Informação | Projeto novo | Projeto existente |
|---|---|---|
| Propósito e público | Descrição do usuário ou material fornecido | README/PRD e aplicação; confirmar quando houver ambiguidade |
| Resultado pretendido | Primeira entrega ou objetivo conhecido; refinamento pode ocorrer por spec | Próxima mudança quando definida; não é necessário reconstruir todo o passado |
| Regras e restrições | Regras conhecidas, permissões e integrações relevantes | Código, contratos e fontes vigentes; separar intenção e comportamento observado |
| Tecnologia | Escolhas obrigatórias ou proposta justificada a revisar | Manifests, configuração, dependências e estrutura reais |
| Convenções e interface | Padrões fornecidos ou decisões ainda abertas | Componentes, tokens, design system e práticas existentes |
| Verificação | O que pode ser executado com segurança e o que depende de outro ambiente | Testes e resultados de baseline disponíveis, com limitações |
| Idioma e autonomia | Preferências conhecidas da equipe | Preservar configuração existente e perguntar apenas sobre conflitos |

Uma instalação pode ser feita antes dessas respostas. O agente pode registrar fatos e dúvidas
enquanto configura o projeto. Para implementar comportamento ainda ambíguo, precisa resolver a decisão
material; não precisa perguntar sobre fatos já claros no repositório nem preencher detalhes especulativos.

Em projeto existente, o setup preserva código e documentos e apresenta um resumo do entendimento.
Não autoriza refatorar, trocar arquitetura ou corrigir problemas históricos por conta própria.
Em projeto novo, uma descrição clara pode ser suficiente para começar; o PRD formal é opcional.

## PRD, SD, ADR e DS têm funções diferentes

| Documento | Pergunta principal | Conteúdo | Uso |
|---|---|---|---|
| PRD — Product Requirements Document | O que construir, para quem e com qual resultado? | Objetivos, escopo, regras, restrições e exemplos de aceitação | Direção do produto e fonte para mudanças |
| SD — System Design | Como a solução se organiza e se comunica? | Componentes, contratos, dados, integrações, segurança e operação | Mudanças arquiteturais ou entre componentes |
| ADR — Architecture Decision Record | Por que esta decisão foi tomada? | Contexto, alternativas/compromissos, escolha, consequências e estado | Um registro por decisão relevante |
| DS — Design System | Como a interface deve se apresentar e se comportar? | Tokens, componentes, estados, acessibilidade e responsividade | Trabalho de interface quando aplicável |
| Roadmap | Quais resultados vêm primeiro? | Prioridades, dependências e entregas esperadas | Priorização, sem duplicar estado das tarefas |

Um ADR não substitui um system design. O design system não precisa existir num serviço sem interface.
Arquivos de API, modelo de dados, segurança, operação e estratégia de testes também podem ser usados.
Esses nomes são convenções úteis, não uma lista fechada dos documentos aceitos pelo framework.

## Os três arquivos da versão antiga

Na 1.3.3, o instalador perguntava se deveria criar docs/.
Quando a pasta ainda não existia, criava prd.md, roadmap.md e architecture.md.
Não criava automaticamente uma tríade PRD/ADR/SD.

A interface 2.x oferece essa conveniência de maneira explícita e opcional:

~~~sh
sdd init --docs
~~~

Sem --docs, o setup não cria documentos de produto. Para escolher outros modelos depois:

~~~sh
sdd docs --types prd,sd,ds,adr,roadmap --dry-run
sdd docs --types prd,sd,ds,adr,roadmap
~~~

| Preset | Caminho |
|---|---|
| prd | docs/prd.md |
| roadmap | docs/roadmap.md |
| sd | docs/architecture.md |
| ds | docs/design-system.md |
| adr | docs/adr/README.md e docs/adr/_template.md |

O comando também cria docs/README.md quando ausente.
Sem --types, sdd docs usa os três presets originais: prd,roadmap,sd.
Pode selecionar apenas um, como sdd docs --types ds.
O dry-run não escreve arquivos. Documentos existentes são preservados, inclusive quando já contêm conteúdo personalizado.
Os arquivos são rascunhos para o agente/equipe revisar e preencher; não representam pesquisa ou decisões executadas.
O template ADR é proposed. Um registro real só deve ser selecionado como decisão active depois da escolha efetiva.

Use documentation.language: pt-BR em agents/config.yaml antes de gerar para receber os modelos em português.
auto usa os textos iniciais em inglês até o setup registrar a língua da equipe e preencher os documentos.
Chaves e estados técnicos permanecem estáveis; texto do projeto usa UTF-8 e acentos.

## Uma fonte por assunto

Preserve o local das fontes existentes. Se ADRs já ficam em agents/decisions/, não copie as mesmas
decisões para docs/adr/. Use um índice ou referência. Para decisões novas, escolha um local canônico.
Os presets não impedem outros caminhos; não existem nomes obrigatórios para documentos fornecidos pelo usuário.

Mapeie caminhos e responsabilidades em agents/PROJECT.md, sem copiar o conteúdo inteiro.
Regras essenciais do projeto pertencem a POLICIES.md; procedimentos reutilizáveis a skills;
conhecimento de comportamento vigente a current/. Esses papéis podem apontar para documentos já existentes.

Cada mudança seleciona somente as fontes necessárias. Exemplo:

~~~yaml
sources:
  - path: docs/prd.md
    section: Exportação de dados
context:
  - path: docs/design-system.md
    section: Estados e interações
decisions:
  - docs/adr/0001-formato-exportacao.md
~~~

decisions exige os metadados de decisão do sdd-flow, incluindo kind: decision e status: active.
Um ADR antigo sem esses metadados pode ser consultado por context/sources sem conversão em massa.
Preserve sua origem e selecione sua pertinência; não invente uma aprovação ou razão histórica.

Para PDFs/imagens, use os leitores do harness. O CLI compõe texto Markdown/UTF-8, não interpreta
semanticamente um PDF ou um arquivo de design. Quando útil, mantenha um trecho revisado com proveniência
e o original preservado. Links externos podem ser consultados com as ferramentas disponíveis, sem exigir um harness específico.

## Documentação do framework e documentação da aplicação

A pasta docs/ do repositório sdd-flow explica como o framework funciona.
A pasta docs/ de uma aplicação consumidora contém referências daquele produto.
Instalar o workflow não copia todo o manual do framework para o contexto da aplicação.

A pasta não precisa ter todos os presets nem um número fixo de arquivos.
Gere o que for útil e mantenha referências curtas; não recrie o crescimento indiscriminado de documentos.
