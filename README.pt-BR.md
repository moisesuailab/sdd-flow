# sdd-flow

Framework de processo para desenvolvimento assistido por IA, com contexto selecionado por tarefa,
rastreabilidade e verificação vinculada à versão testada.

Este checkout prepara a versão 2.0.0. A publicação no npm é uma ação de release separada.
O foco é metodológico: organização, contexto pertinente e rastreabilidade, sem criar um orquestrador.
Requer Node.js 22 ou superior. Para testar este código:

~~~sh
npm ci
npm link
cd /caminho/do/projeto
sdd init --harness claude-code
~~~

Também há adaptador para OpenCode: sdd harness opencode.
Complete agents/SETUP.md, configure os comandos reais em agents/config.yaml e execute sdd doctor.

## Princípios

- Mantenha o AGENTS.md curto, com navegação para os documentos relevantes.
- Separe conhecimento vigente, mudança ativa e histórico.
- Descubra skills por name e description; carregue seu corpo quando necessário.
- Use tarefas por resultado verificável, podendo alterar vários arquivos.
- Escolha modo light, standard ou rigorous e autonomia step ou batch.
- Mantenha o estado das tarefas apenas no front matter de TASK.md.
- Aprove o escopo autorizado, sem exigir aprovações de arquivos de progresso vazios.
- Verifique com comandos reais e evidência de execução. Testes manuais podem passar.
- Diferencie checks obrigatórios e informativos; registre limitações externas sem exigir testes arriscados em produção.
- Consolide contratos vigentes antes da verificação final e do arquivamento.

## Fluxo

~~~sh
sdd new minha-mudanca --mode standard
sdd context 001-minha-mudanca --phase plan
# Preencha SPEC.md e TASK.md nos formatos documentados.
sdd check 001-minha-mudanca
# Somente após autorização real do usuário para esse escopo:
sdd approve 001-minha-mudanca --by "Moisés"
sdd context 001-minha-mudanca --phase implement --task T01
# Implemente, verifique e atualize a tarefa.
sdd verify 001-minha-mudanca --scope partial
# Consolide os documentos vigentes e conclua as tarefas.
sdd verify 001-minha-mudanca
sdd close 001-minha-mudanca --by "Moisés" --note "Sem alteração de contrato duradouro" --archive
~~~

Para verificação manual/inspeção, sdd evidence ID cria um registro para os inputs atuais.
Execute o cenário, preencha resultado, executor, data e observações e use
sdd verify ID --evidence agents/specs/ID/EVIDENCE.json.
Se código ou contrato mudar, a evidência anterior fica obsoleta.

Sem ambiente adequado, sdd handoff ID prepara um registro de limitações para preencher.
sdd verify ID --handoff CAMINHO gera USER_TESTS.md e pode resultar em limited.
Isso permite encerrar a implementação com pendências explícitas, sem declarar teste externo aprovado.
Leia o [guia de qualidade e falta de ambiente](docs/quality-gates.pt-BR.md) para TDD/BDD, gates e o roteiro seguro ao usuário.

## Front matter e contexto

Front matter é metadado estruturado, interpretado por um parser YAML real.
Skills usam name e description do formato Agent Skills. Contratos do workflow usam schema_version,
tipo de artefato e seus campos específicos. README e textos apenas humanos não precisam de metadados.

O comando context seleciona as referências declaradas em change.yaml, a fase e a tarefa.
Também permite seções por título exato. Não há extração de um número fixo de linhas.
Se o limite em bytes for excedido, o comando apresenta o problema sem truncar instruções.
O limite mede bytes, não tokens, e pode ser configurado.

## Distribuição e manutenção

~~~sh
sdd update --dry-run
sdd harness claude-code
sdd harness opencode
sdd export claude-code --out packages/claude-code
sdd export opencode --out packages/opencode
~~~

Os adaptadores instalam comandos e uma skill nos diretórios ativos das ferramentas.
Não alteram permissões nativas nem removem configurações antigas silenciosamente.
A exportação prepara diretórios versionáveis; não publica nem instala plugins.

Consulte os [formatos](docs/formats.md), a [migração](docs/migration.md),
a [distribuição](docs/distribution.md) e os [critérios de qualidade](docs/quality.md).
A CLI valida estrutura e executa checks; revisão semântica e permissões continuam necessárias.

O [guia de uso](docs/usage.pt-BR.md) explica adoção em projetos existentes, início do zero,
excesso de contexto, regras particulares, skills e mudanças de escopo.
O [guia de publicação](docs/releases.pt-BR.md) distingue PR, merge, publicação npm e atualização dos consumidores.

Consulte a [metodologia e comparação das versões](docs/methodology.pt-BR.md) e o
[roteiro de testes locais](docs/local-testing.pt-BR.md), com exemplos PowerShell.
Configure documentation.language: pt-BR em agents/config.yaml para documentos do projeto em português.
Preserve UTF-8 e acentuação; chaves técnicas e IDs não devem ser traduzidos.

O [guia de perguntas do setup e documentos](docs/setup-documents.pt-BR.md) distingue PRD, ADR, system design e design system.
sdd init --docs restaura a criação opcional de prd.md, roadmap.md e architecture.md.
Para selecionar referências, use sdd docs --types prd,sd,ds,adr,roadmap. Documentos existentes são preservados.
