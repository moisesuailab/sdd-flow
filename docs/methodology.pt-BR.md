# Metodologia e limites do sdd-flow

O objetivo do sdd-flow é organizar desenvolvimento assistido por IA, entregar contexto pertinente
e manter acompanhamento e rastreabilidade, independentemente da tecnologia da aplicação.
O CLI operacionaliza partes objetivas do método; o harness fornece ferramentas e execução.
Não é objetivo criar um orquestrador, um cliente MCP ou uma plataforma de agentes.

## O que continua essencial

1. Compreender o problema e investigar incertezas relevantes.
2. Definir escopo observável, requisitos e aceitação.
3. Planejar e executar resultados coesos, preservando o trabalho existente.
4. Verificar o comportamento e registrar o que foi realmente observado.
5. Consolidar conhecimento vigente e preservar o histórico da mudança.

Research, Plan, Implement, Validate e Close são responsabilidades lógicas. A pesquisa pode ser breve
quando já existe informação suficiente; rigorous exige um registro explícito. Verificações parciais
podem ocorrer durante a implementação. O encerramento depende de evidência final atual e consolidação.
Fases não obrigam abrir novas conversas. Uma sessão, subagentes nativos ou uma sessão nova são opções
do ambiente. Depois de compactação ou transferência, recupere o estado pelos arquivos canônicos.

Instalações novas usam step: uma tarefa por vez, seguida de revisão. A autorização do usuário para
várias tarefas específicas ou todas as tarefas permite continuar nesse lote sem confirmações repetidas
nem alteração obrigatória da configuração. Aprovação do plano, por si só, não muda a autonomia.
Batch pode ser a preferência permanente; atualizações preservam a escolha de projetos existentes.
Cada tarefa continua sendo verificada e as dependências respeitadas, inclusive durante um lote.

Evidência de execução local e validação externa são distintas. Falta de ambiente não precisa bloquear
uma implementação concluída: um handoff atual registra o que ficou pendente e como testar com segurança.
O encerramento limited nunca representa teste externo aprovado; falhas observadas continuam registradas.
Veja quality-gates.pt-BR.md para a política required/advisory, exemplos BDD e procedimento TDD.

## Comparação com as versões analisadas

Base original: sdd-flow 1.3.3, commit d84c62d51d9c566b0f3e8a6279418220e0fc6e8f.
O anexo do colaborador foi analisado como conjunto de arquivos; não continha histórico Git que
permitisse demonstrar ancestralidade. A comparação se refere aos materiais examinados em 20/11/2026.

| Aspecto | Original 1.3.3 | Ajuste do colaborador | Atual 2.x |
|---|---|---|---|
| Método | RPIV e tarefas muito fragmentadas | Mais controles sobre o mesmo método | Método preservado, modos light/standard/rigorous, execução step/batch e consolidação |
| Contexto | Leitura global e histórico acumulado | Acrescentou conteúdo obrigatório e repetição | Seleção por tarefa/fase e fontes explícitas; histórico fora da leitura padrão |
| Tarefas | Estado repetido em TASK/PROGRESS | Conservou a necessidade de sincronização | TASK canônico; STATE curto e opcional |
| Rastreabilidade | Predominantemente orientações em Markdown | IDs e covers mais explícitos | IDs e relações validados, registros por execução e histórico de revisões |
| Skills | Extração por trechos fixos | Front matter com instruções de geração/leitura divergentes | Parser YAML, catálogo curto e corpo por pertinência |
| Aprovação | Orientação no processo | Aprovação de seis arquivos sem vincular todas ao conteúdo | Aprovação do escopo normativo com digest e snapshots |
| Mudança de regra | Procedimento manual de revisão do plano | Invalidação incompleta de alguns registros | Revisão, reabertura de trabalho afetado e rejeição de evidência obsoleta |
| Validação parcial | Permitida | Bloqueada com tarefas pendentes | Permitida, sem representar encerramento final |
| Teste manual | Previsto em instruções | Sem caminho claro até conclusão aprovada | Evidência manual real pode passar; falta de ambiente pode ser registrada como limited |
| Qualidade | Princípios no prompt | Atenção adicional às assertions e achados | Checks required/advisory, evidências, regressões, TDD/BDD e handoff seguro |
| Git | Proibição geral de writes | Não houve mecanismo novo de integração demonstrado no anexo | Autorização real e permissões nativas, sem bloqueio geral do método |
| Documentos | Opção fixa de PRD, roadmap e architecture | Sem evolução do instalador demonstrada no anexo | Mesma opção restaurada e presets adicionais SD/DS/ADR, preservando fontes existentes |
| Instalação | Cópia de templates com opção de sobrescrever | Sem instalador alternativo demonstrado no anexo | Preservação, conflitos, prévia, backups e migração conservadora |

O ganho demonstrável é estrutural e funcional: menos estados redundantes, seleção de contexto e
condições verificáveis. Isso não prova menor custo de tokens, melhor código ou superioridade sobre
todo framework. Tais afirmações exigem avaliações repetidas com tarefas, modelos e condições comparáveis.

O colaborador melhorou o desenho de rastreabilidade; esta evolução incorpora esses acertos e corrige
as inconsistências encontradas nos materiais. Não foram comparadas implementações reais produzidas
pelos três workflows, portanto superioridade de custo ou de qualidade do código gerado não está demonstrada.

O núcleo ficou mais verificável, mas também exige aprender formatos e comandos novos e usar Node 22+.
A seleção de contexto depende de referências bem mantidas; o CLI não infere automaticamente todos os
efeitos de uma mudança. A verificação é conservadora: alterações nos inputs podem exigir nova execução.
Identidade do revisor, semântica dos testes e segurança do ambiente não são atestadas pelo CLI.
Os testes não eliminam
a necessidade de manutenção e avaliação prática nos harnesses.

## Como o fluxo funciona na prática

1. Instale a base e faça o setup guiado pelo agente, usando fontes e fatos disponíveis.
2. Crie uma mudança com objetivo delimitado; pesquise somente as incertezas relevantes.
3. Defina requisitos, exemplos de aceitação, tarefas e impacto nos consumidores.
4. Registre a autorização real e implemente dentro desse escopo, consultando contexto pertinente.
5. Execute checks disponíveis, revise assertions/regressões e registre limitações quando faltar ambiente.
6. Consolide o conhecimento vigente e encerre como verificado ou implementado com limitações explícitas.

Instalação não cria entendimento de produto sozinha. Veja setup-documents.pt-BR.md para perguntas,
PRD, ADR, system design, design system e modelos opcionais. O método não exige uma tríade fixa de documentos.

## O que permanece rastreável

| Pergunta | Registro |
|---|---|
| O que foi solicitado e qual aceitação deve ser atendida? | change.yaml e SPEC.md |
| Como será feito e em que estado está? | TASK.md |
| Qual escopo foi autorizado, quando e por quem? | approval e .sdd/history/approval-*.json |
| O que mudou no plano aprovado e por quê? | .sdd/history/revision-*.json |
| Quais comandos rodaram e que resultado produziram? | .sdd/runs/ID/receipt.json e logs |
| Que observação manual foi realizada? | Evidência com cenário, executor, instante e fingerprint |
| Qual resultado pode ser usado agora? | verification.json, válido somente para os inputs atuais |
| Como o sistema funciona após a entrega? | current/ e decisões ativas |
| Como chegamos até aqui? | Histórico da mudança, arquivo e Git |

O framework rastreia artefatos, estados, decisões e execuções registradas. Não captura cada pensamento
do modelo nem todas as chamadas do harness. Sessões, traces e auditoria externa podem complementar
os registros. Aprovações são declarações registradas, não autenticação de identidade.

## Portabilidade

O núcleo funciona com arquivos e comandos. Adaptadores fornecem pontos de entrada, preservando
configurações existentes. Permissões, MCP, modelos, compactação e delegação pertencem ao harness.
Essas capacidades não alteram as condições de aceitação e de encerramento.

Ferramentas externas podem fornecer evidência; registre origem e instante quando relevantes.
O fingerprint local não atesta por conta própria um sistema remoto.
Não é necessário A2A ou multiagentes para seguir esta metodologia.

## Idioma e escrita

As instruções distribuídas do método permanecem em inglês como fonte comum.
O idioma dos documentos do aplicativo é configurável, independentemente do idioma desses templates.

~~~yaml
documentation:
  language: pt-BR
~~~

Use português correto e UTF-8 nos artefatos narrativos: requisitos, aceitação, tarefas, pesquisa,
contratos, decisões e observações. Preserve termos originais quando a tradução prejudicar o significado.
Chaves técnicas, IDs, paths e APIs permanecem estáveis; a chave description pode ter valor em português.
Slugs podem ser ASCII sem eliminar acentos do título ou do conteúdo.

auto é o padrão genérico: o agente segue o idioma do usuário até o setup registrar a escolha da equipe.
Configurações antigas sem documentation continuam válidas. O CLI valida a tag e a inclui no contexto;
isso orienta o agente, não certifica linguisticamente cada frase.
Novas specs/tarefas têm textos iniciais em português quando a configuração usa pt ou pt-BR.
Outros idiomas podem ser usados pelo agente; os textos iniciais do CLI usam inglês como fallback.
Diagnósticos, chaves de máquina e relatórios determinísticos do CLI ainda podem permanecer em inglês;
esta versão não é uma localização completa da interface do CLI.

Não foi medido ganho de qualidade/custo por escrever as instruções em inglês. Não elimine
acentos como técnica de otimização. A clareza para autores e revisores de negócio é o critério principal.
Não traduza o histórico encerrado apenas para uniformizar aparência. A tradução de um contrato ativo
aprovado altera seu conteúdo e exige revisão; preserve o registro anterior.

Use local-testing.pt-BR.md para testar o CLI e executar cenários com um agente real.
Um pacote menor que omite uma regra é uma regressão, não uma otimização.
