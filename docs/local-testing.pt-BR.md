# Testes locais antes de publicar

Este roteiro testa o código-fonte da versão 3.0 deste checkout, sem depender do pacote publicado no npm.
Exemplos: PowerShell no Windows. Requer Git e Node.js 22+; Node 24 pode ser usado para validar.
Mantenha os laboratórios fora da pasta do framework. Use cópia/branch para aplicações reais.

## 1. Validar o pacote

Abra a pasta do checkout que contém package.json:

~~~powershell
node --version
npm --version
npm ci
npm test
npm run check
npm audit
npm publish --dry-run --tag next
~~~

O último comando não publica. Ele exercita prepublishOnly, que executa testes e checks.
O teste de empacotamento instala o tarball em um consumidor temporário e executa o CLI instalado.
Ele usa cache temporário vazio e tarball local do parser já instalado, evitando depender de metadados prévios do npm.
Não é necessário npm login para testar o código. O aviso de falta de login no dry-run é esperado.
Investigue falhas; erro de rede no audit não significa resultado de segurança aprovado.
npm run test:coverage fornece cobertura, não uma nota de qualidade.
Confira também o CI e os harnesses/versões que pretende anunciar.

## 2. Laboratório sem trocar o CLI global

Na pasta do código-fonte:

~~~powershell
$SddSource = (Get-Location).Path
$SddCli = Join-Path $SddSource 'bin/cli.js'
$SddLab = Join-Path ([System.IO.Path]::GetTempPath()) ('sdd-flow-laboratorio-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $SddLab | Out-Null
Set-Location $SddLab
git init
node $SddCli --version
node $SddCli init
~~~

node $SddCli equivale a sdd, mas aponta exatamente para o código baixado.
Para o agente executar sdd diretamente, instale o tarball conforme a seção 7,
ou indique a ele o caminho absoluto deste CLI. Confira a versão para não executar outro CLI por engano.

Configure agents/config.yaml preservando os demais campos:

~~~yaml
documentation:
  language: pt-BR
checks:
  - name: unit
    command: node --test
    timeout_ms: 10000
~~~

Esse check é para o exemplo Node abaixo. Em outra tecnologia, use seus comandos reais.
Exclua apenas saídas geradas quando necessário, sem excluir código ou testes da verificação.

Para exercitar os documentos opcionais depois de definir o idioma:

~~~powershell
node $SddCli docs --types prd,sd,ds,adr,roadmap --dry-run
node $SddCli docs --types prd,sd,ds,adr,roadmap
~~~

Confira os rascunhos em docs/, acrescente uma regra real ao PRD e repita o comando.
A regra deve ser preservada. O template ADR deve continuar proposed até existir uma decisão real.
Não é necessário preencher todos os modelos para continuar; selecione apenas os úteis ao laboratório.
Veja setup-documents.pt-BR.md para distinguir referências de produto e artefatos de cada mudança.

## 3. Uma entrega real com o agente

Ative o ponto de entrada do harness escolhido, quando aplicável:

~~~powershell
node $SddCli harness claude-code
# Alternativa: node $SddCli harness opencode
~~~

Em outro harness, aponte para AGENTS.md e agents/prompts/.
Adaptadores não instalam o aplicativo, concedem acesso ou modificam permissões.

Pedido inicial sugerido:

~~~text
Leia agents/SETUP.md e configure este projeto de laboratório.
Vamos criar uma biblioteca Node.js pequena, sem dependências externas.
Escreva os documentos do projeto em português brasileiro, em UTF-8, com acentos.
Registre apenas escolhas conhecidas. Nesta etapa configure o fluxo, sem implementar.
Use o CLI 3.0 deste checkout que indiquei; confira a versão antes de executar os comandos.
~~~

Depois peça:

~~~text
Planeje uma spec standard para calcularFrete(valorCentavos).
Aceite apenas inteiros não negativos. A partir de 5000 centavos, o frete é 0;
abaixo disso, é 990. Entradas inválidas devem lançar erro.
Inclua aceitação para 0, 4999, 5000, valores negativos, fracionários e não numéricos.
Não implemente antes de apresentar o plano.
~~~

Revise valores, limites e comportamento inválido. Autorize o plano real quando correto.
Depois peça código/testes, checks reais, consolidação do contrato, verificação e encerramento.
Não informe que houve autorização antes de concedê-la.

Se registrar a aprovação pelo terminal, use o ID realmente criado:

~~~powershell
node $SddCli check 001-calcular-frete
node $SddCli approve 001-calcular-frete --by 'Moisés'
node $SddCli context 001-calcular-frete --phase implement --task T01 --inspect
~~~

IDs são exemplos; use os do seu laboratório. Não marque tarefas como done apenas para passar o verificador.

## 4. Cenários de aceitação do workflow

| Cenário | Ação | Resultado esperado |
|---|---|---|
| Início do zero | Complete a entrega acima | Contrato, tarefas, testes reais, evidência e encerramento coerentes |
| Reinstalação | Rode init após configurar PROJECT/POLICIES/config e concluir setup | Arquivos próprios preservados; SETUP removido não reaparece |
| Conflito no núcleo | Em uma cópia, personalize RULES e rode update --dry-run | Conflito informado; conteúdo preservado até revisão explícita |
| Projeto existente | Adote uma cópia de um aplicativo funcional | Baseline observada, sem refatoração ou specs fictícias do passado |
| Regra alterada | Durante uma spec ativa aprovada, mude o limite para 7000 e revise o plano | Aprovação obsoleta, motivo registrado e tarefas afetadas reabertas |
| Falha real | Quebre um teste numa spec ativa | Verificação falha; o resultado antigo não permite encerrar |
| Validação parcial | Verifique antes de concluir as tarefas | Resultado parcial/pending honesto, sem encerramento |
| Teste manual | Use uma spec light para observação com interação real | Evidência com executor, resultado e fingerprint pode passar após execução |
| Retomada | Continue em outra sessão ou após compactação | Recupera objetivo, regra, tarefa e próxima ação pelos arquivos |
| Contexto excessivo | Inspecione referências grandes; teste --max-bytes 1024 | Diagnóstico sem truncamento; contexto pertinente permite continuar |
| Idioma | Use “autorização”, “revisão” e “não numérico” | UTF-8 preservado; texto em português; chaves/IDs estáveis |
| Sem ambiente real | Classifique o teste externo, prepare handoff e gere o roteiro seguro | Pode fechar implementação como limited, mantendo acceptance_verified false e testes pendentes |
| Indicador informativo | Configure uma análise advisory que falha, mantendo testes funcionais válidos | Aviso registrado, sem declarar falha funcional nem esconder o indicador |
| Falha externa observada | Execute um teste externo autorizado que falha; depois omita essa execução | A falha nos mesmos inputs permanece; não vira deferred para permitir fechamento |
| Efeito em consumidor | Altere uma função compartilhada mantendo seu teste isolado verde, mas quebrando um cenário do consumidor | O teste de regressão do consumidor detecta a falha e impede declarar o gate aprovado |
| Reorganização | Renomeie/renumere uma spec aprovada, mantendo seu conteúdo | ID e escopo preservados; contexto resolve o caminho atual |
| Descarte | Remova uma spec, restaure-a e examine --all | Área ativa limpa, código intacto e conteúdo recuperável |
| Exclusão manual | Exclua uma pasta de laboratório com consumidores | Reconcile distingue encerramento retido, histórico e pré-requisito desconhecido |
| Metadados defeituosos | Invalide o manifesto de uma spec de laboratório | Diagnóstico local; spec saudável sem relação continua operável |

Use outra spec para objetivo novo depois do encerramento.
Para revisão na mesma spec, altere antes de encerrar ou reabra explicitamente com motivo.
Uma falha provocada nessa matriz é resultado esperado do controle, não defeito do framework.

## 5. Conferir rastreabilidade

- SPEC.md: requisitos e aceitação correspondem ao pedido e aos casos de borda.
- TASK.md: tarefas por resultado; uma única fonte do estado.
- .sdd/history/approval-*.json: escopos aprovados preservados.
- .sdd/history/revision-*.json: motivo e impacto das alterações.
- .sdd/runs/ID/receipt.json: comandos e resultados de execuções reais; logs só existem quando habilitados explicitamente.
- .sdd/verification.json: resultado corrente vinculado aos inputs verificados.
- current/: comportamento consolidado sem depender de todas as specs antigas.
- archive/: preservação de artefatos e IDs.

Evidência manual não pode transformar leitura de código em alegação de execução.
Confira as assertions: um comando verde sozinho não prova cobertura de negócio.

## 6. Registrar a avaliação do agente

Registre fora do snapshot verificado da aplicação, em sua issue/PR ou notas de avaliação:

| Campo | O que anotar |
|---|---|
| Ambiente | OS, Node/CLI/harness, modelo e modo |
| Caso | Laboratório e commit/base |
| Correção | Requisitos omitidos, testes ausentes e resultados incorretos |
| Contexto | Documentos selecionados, conteúdo irrelevante e facilidade de retomada |
| Intervenção | Correções e confirmações desnecessárias pedidas ao desenvolvedor |
| Rastreabilidade | Se outra pessoa entende escopo, revisão e execução pelos registros |
| Eficiência | Tempo/custo, comparando tarefas e condições equivalentes |

Repita um caso em outro harness se pretende anunciar compatibilidade.
Sem esse ambiente, registre a lacuna. Corrija falhas de instalação antes de avaliar o método.

## 7. Testar o tarball

Volte à pasta do framework:

~~~powershell
Set-Location $SddSource
npm pack
~~~

Se quiser trocar a instalação global, em outro terminal instale o caminho exato do tarball:

~~~powershell
npm pack
npm install -g '.\sdd-flow-<versão>.tgz'
sdd --version
~~~

Confira Get-Command sdd e repita init/context no laboratório.
Para restaurar uma versão global anterior, instale explicitamente aquela versão.
Para testar um pacote publicado, confira antes npm view sdd-flow dist-tags --json e selecione a versão exata pretendida.
Confira se a dist-tag selecionada corresponde à versão que pretende avaliar.

Após os testes, siga releases.pt-BR.md para publicar uma nova versão.
