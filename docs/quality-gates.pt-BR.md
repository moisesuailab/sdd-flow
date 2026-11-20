# Qualidade e validação sem acesso ao ambiente real

O objetivo é concluir trabalho útil com evidência honesta. Falta de produção ou homologação não exige
inventar um teste, arriscar dados reais ou manter uma implementação pronta bloqueada indefinidamente.
Falha observada, implementação incompleta e ausência de ambiente são situações diferentes.

## Política pequena por projeto

~~~yaml
quality:
  tdd: preferred
checks:
  - name: unit
    command: npm test
    timeout_ms: 60000
  - name: complexity
    command: npm run analyze:complexity
    timeout_ms: 60000
    level: advisory
  - name: integration
    command: npm run test:integration
    timeout_ms: 60000
    environment: external
~~~

Exemplo para um projeto com esses scripts reais; não os copie sem configurar as ferramentas.
Os padrões são level: required e environment: local. optional/preferred/required em quality.tdd
orientam o procedimento do agente; o CLI não certifica que ele realmente seguiu TDD.

- Required: falha observada impede declarar o gate aprovado.
- Advisory: resultado aparece no relatório, sem bloquear a aceitação funcional.
- External: o comando não roda por padrão; depende de ambiente/autorização disponíveis.
- --run-external permite solicitar execução externa, mas não concede autorização nem prova segurança.

Aceitação automatizada deve referenciar checks required. Um indicador advisory não comprova
o comportamento obrigatório. Limiar de complexidade, cobertura, dependências e carga pertence à
configuração da ferramenta usada. Não há percentual universal imposto pelo sdd-flow.
Não reclassifique uma falha de código como falta de acesso apenas para encerrar a mudança.

QUALITY.md registra critérios do projeto e links; é carregado em plan/validate/close.
POLICIES.md continua sendo a fonte de obrigações essenciais. O roteiro detalhado em
agents/prompts/quality.md é consultado quando necessário, sem entrar em toda tarefa.
Não é preciso instalar Sonar, Cucumber, uma plataforma de observabilidade ou um orquestrador.

## BDD e TDD sem duplicação de documentos

Registre exemplos concretos em acceptance.description da SPEC: estado inicial, ação e resultado.
Inclua fronteiras, rejeições e falhas pertinentes ao comportamento. Gherkin/Cucumber são opcionais.

Para mudanças de comportamento testáveis, prefira ciclos pequenos: teste falhando pelo motivo esperado,
implementação suficiente e refatoração. Para bugs, reproduza com regressão quando possível.
Guarde referências dos resultados RED/GREEN em task.evidence e logs, sem um diário sempre carregado.
sdd verify --scope partial pode registrar essas execuções, mas uma falha RED nunca é aprovação final.
Um comando verde não demonstra sozinho a qualidade das assertions, a cobertura semântica ou TDD.

## Quando o teste só pode ser feito pelo usuário

Classifique a dependência real. Para aceitação manual/inspeção:

~~~yaml
- id: AC02
  covers: [REQ01]
  description: No ambiente autorizado, um usuário sem permissão não consegue alterar o registro.
  method: manual
  environment: external
~~~

Para automação externa, marque o check com environment: external.
Execute os checks locais disponíveis. Não tente operar produção só para satisfazer a spec.

~~~sh
sdd handoff 001-minha-mudanca
~~~

O comando retorna um caminho novo HANDOFF-<id>.json dentro da spec. O agente preenche o documento.
Preserve schema_version, id e input_digest gerados; cada limitação tem alvo e responsável claros.
Exemplo de um item quando ainda não existe ambiente seguro:

~~~json
{
  "kind": "criterion",
  "id": "AC02",
  "result": "deferred",
  "reason": "O agente e o desenvolvedor não têm acesso a um ambiente adequado.",
  "owner": "Responsável pelo projeto",
  "environment": "unavailable",
  "prerequisites": [],
  "steps": [],
  "expected": "A operação é negada e nenhum dado é alterado.",
  "safety": "Não executar escritas, exclusões ou mudanças de permissão em produção como teste.",
  "resume_when": "Existir uma cópia isolada com dados fictícios e acesso autorizado."
}
~~~

Quando houver teste seguro, use isolated, non-production ou production-read-only e forneça passos
curtos, pré-requisitos e resultado observável. Exemplo para uma cópia isolada:

1. Abra a versão indicada com os dados fictícios informados.
2. Entre com o perfil de teste sem a permissão necessária.
3. Tente a ação apenas nessa cópia isolada.
4. Confira a mensagem de recusa e que o registro fictício permaneceu igual.
5. Informe versão, ambiente, resultado observado e evidência sem expor credenciais/dados pessoais.

production-read-only só cabe quando a ação realmente não provoca efeitos; o nome do campo não
comprova isso. Não sugira testes de carga, envio de mensagens, exclusões, alterações de permissões ou
movimentação de dados reais em produção. Quando não houver um teste seguro, steps pode ficar vazio
em unavailable: registre a condição futura e siga com a implementação disponível.

O usuário não precisa preencher metadados técnicos para fazer o teste. O agente prepara USER_TESTS.md;
o usuário segue apenas o que é possível e seguro e relata o observado. O agente registra depois
executor, instante, versão e resultado reais, sem declarar que ele próprio executou o teste.

## Verificar e encerrar com limitações

~~~sh
sdd verify 001-minha-mudanca --handoff agents/specs/001-minha-mudanca/HANDOFF-ID.json
sdd close 001-minha-mudanca --by "Responsável" --note "Implementação revista; validação externa pendente" --archive
~~~

Use o caminho realmente retornado. A verificação gera USER_TESTS.md a partir do handoff validado
e registra os hashes do JSON e do roteiro. Não há execução automática desses passos.
Cada execução preserva seu roteiro em runs/ID/USER_TESTS.md; USER_TESTS.md é a cópia da versão mais recente.

| Resultado | Significado | Encerramento da implementação |
|---|---|---|
| passed | Aceitação e checks obrigatórios verificados para os inputs atuais | Permitido |
| limited | Trabalho concluído com limitações externas explícitas e handoff atual | Permitido, como implemented_with_limitations |
| partial | Verificação parcial ou itens ainda sem evidência/handoff suficiente | Continuar implementação/registro; não declarar encerramento final |
| failed | Falha obrigatória observada ou inputs alterados durante a execução | Corrigir/reavaliar e verificar novamente |

Com limited, acceptance_verified é false; os itens continuam deferred/not_applicable.
closure.validation, pending_verification e histórico preservam essas condições após arquivamento.
Antes de fechar, o estado da mudança é implemented, distinto de verified.
Consolide o comportamento implementado identificando o que ainda não foi observado no ambiente externo.
Concluir implementação não comprova funcionamento em produção e não autoriza deploy.

Se existe uma tarefa específica de teste externo, use kind: verification, status: deferred e
deferral: {by: Responsável, reason: Motivo}, cobrindo os IDs externos de aceitação.
Tarefas de implementação não podem ser adiadas dessa forma. Dependências realmente necessárias
continuam sendo respeitadas. Se a tarefa externa for executada, atualize seu estado para done antes
de gerar a evidência final dos inputs atuais.

Um caso externo not_applicable precisa de justificativa; não cancela silenciosamente um requisito.
Para remover comportamento do escopo, revise o contrato e a autorização normalmente.
Os checks advisory não executados ou falhos aparecem em warnings.

## Continuidade, segurança e rastreabilidade

- Um handoff só vale para seus inputs; mudança em código/plano exige revisar as limitações.
- Uma falha observada nos mesmos inputs não desaparece ao omitir evidência ou pular a execução externa.
- Guia/JSON alterado depois da verificação exige uma nova verificação antes de fechar.
- Todos os comandos continuam sujeitos às permissões reais. O CLI não é um sandbox.
- sdd status mostra o resultado do encerramento e as verificações pendentes.
- Uma dependência encerrada com limitações permite progresso, mas gera aviso para análise do trabalho seguinte.
- Reabra com motivo quando o ambiente estiver disponível, registre resultados reais e verifique novamente.
- O histórico do encerramento anterior, com suas limitações, permanece preservado.

CLI: 0 significa operação concluída, inclusive limited; 1 indica falha e 2 verificação partial.
Uma automação que exige validação integral deve avaliar verdict/acceptance_verified, não só o código 0.
Não transforme esse requisito de uma publicação específica em bloqueio universal do desenvolvimento.
