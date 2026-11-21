# Organização, arquivamento e descarte de specs

O ID técnico de uma spec permanece estável. Nome da pasta, número visual e localização podem mudar.
O agente pode executar estas operações a partir de um pedido simples do usuário, respeitando sua autorização.
Não é necessário editar manifestos e históricos manualmente para reorganizar pastas.

## Renomear e renumerar

~~~sh
sdd rename 015-exportacao --name exportar-relatorios --number 3 --by "Moisés" --reason "Reorganizar entregas" --dry-run
sdd rename 015-exportacao --name exportar-relatorios --number 3 --by "Moisés" --reason "Reorganizar entregas"
~~~

A pasta passa a ser agents/specs/003-exportar-relatorios. O campo id continua 015-exportacao.
Não existe UUID obrigatório nem conversão em massa dos IDs existentes.

- --name muda o nome da pasta; --number altera seu prefixo visual. Ambos podem ser usados separadamente.
- O CLI aceita o ID estável e o nome atual da pasta; aliases registrados preservam nomes anteriores.
- Se um atalho numérico ficar ambíguo depois de reordenar, use o ID completo.
- Identidades e aliases de outras specs não podem ser reutilizados como um nome completo.
- O título normativo e o conteúdo da SPEC não são reescritos por rename. Alterações de comportamento seguem revisão de escopo.
- Mover ou renomear sem mudar os inputs normativos preserva a aprovação e a validade dos recibos.
- Evidências, snapshots e logs anteriores não são reescritos para aparentar outro passado.

O resolvedor acompanha caminhos estruturados para arquivos dentro de specs movidas, incluindo sources/context e evidências.
Isso não é uma substituição global: links Markdown arbitrários, texto livre e referências em ferramentas externas não são editados automaticamente.
Revise links ativos quando necessário; mantenha a proveniência dos registros históricos.

Renomear uma pasta manualmente também é reconhecido quando change.yaml permanece com o mesmo ID.
Use reconcile para atualizar o inventário. Não altere o campo id por uma preferência de organização.

## Arquivar e restaurar

~~~sh
sdd archive 015-exportacao --by "Moisés" --reason "Retirar da área ativa"
sdd restore 015-exportacao --by "Moisés" --reason "Retomar o planejamento"
~~~

Archive move a pasta para agents/archive/ e preserva seu nome e estado.
Pode arquivar uma spec draft, implementing, cancelled, verified ou closed. Arquivar não significa concluir ou aprovar.
Uma spec arquivada precisa ser restaurada antes de continuar implementação/verificação.
Close --archive continua disponível para encerrar e arquivar em uma operação.

Restore de uma spec arquivada a devolve à área ativa. Se ela estiver closed/cancelled, use reopen quando for retomar o ciclo.
Restaurar localização não remove as condições de encerramento nem transforma um recibo antigo em execução nova.

## Remover com recuperação ou excluir definitivamente

~~~sh
sdd remove 015-exportacao --by "Moisés" --reason "Spec obsoleta" --dry-run
sdd remove 015-exportacao --by "Moisés" --reason "Spec obsoleta"
~~~

Por padrão, o conteúdo vai para agents/.sdd/trash/. Deixa de participar da área ativa e do contexto normal.
O comando informa os vínculos de specs ativas afetados, sem alterar o código da aplicação.

~~~sh
sdd restore 015-exportacao --by "Moisés" --reason "Recuperar documento"
~~~

A restauração da lixeira usa a localização anterior, inclusive archive quando foi de lá que a spec foi removida.
Se a pasta de destino estiver ocupada, --name permite escolher outro nome.
Nomes que colidam com outra identidade/alias são recusados.

Para descarte permanente, use explicitamente:

~~~sh
sdd remove 015-exportacao --permanent --by "Moisés" --reason "Descartar o histórico detalhado"
~~~

O conteúdo removido não pode ser restaurado pelo CLI após exclusão definitiva. Git/backup só ajudam se houver uma cópia.
A exclusão exige autorização real; --by registra o responsável declarado, não autentica sua identidade.

O CLI conserva um registro compacto de identidade, último estado observado, aliases, localização e eventual encerramento.
Esse registro não inclui o texto completo da spec, tarefas, logs ou todas as observações.
Ele cresce com as identidades registradas e não substitui uma política de backup; o limite de leitura de metadados do CLI continua aplicável.
Preservar uma identidade não exige conservar sua pasta inteira. Não reutilize o ID técnico para outro trabalho.

Em falha de persistência, operações de movimentação tentam restaurar a pasta e o inventário anterior.
Uma exclusão permanente interrompida é reportada como tal; conteúdo restante é identificado para inspeção.
Locks não impedem edição externa nem tornam o sistema imune a interrupções do processo ou do disco.

## Tipos de referência

| Tipo | Como representar | Se o conteúdo desaparecer |
|---|---|---|
| Origem histórica | related: [ID] | Aviso; não bloqueia por ausência do histórico |
| Fonte histórica opcional | Objeto sources/context com historical: true | Aviso, sem leitura de conteúdo inexistente |
| Fonte/contrato obrigatório | capabilities, decisions ou sources/context comum | Diagnóstico de referência obrigatória; restaurar ou revisar antes de executar |
| Pré-requisito de execução | depends_on: [ID estável] | Usar encerramento histórico conhecido, ou investigar o pré-requisito ainda não resolvido |

Exemplo:

~~~yaml
related:
  - 002-planejamento-antigo
sources:
  - path: docs/produto/prd.md
    section: Exportação
context:
  - path: agents/archive/002-planejamento-antigo/RESEARCH.md
    historical: true
capabilities:
  - agents/current/autorizacao.md
depends_on: []
~~~

Related fornece proveniência e não carrega outra spec inteira.
Historical é opcional e só deve ser usado quando a referência realmente não constitui uma obrigação da mudança.
Marcar uma regra obrigatória como histórica para contornar um erro é incorreto.
Alterar sources/context ou depends_on de um plano aprovado exige a revisão correspondente.

Prefira contratos vigentes para conhecimento reutilizável. Guarde-os fora de pastas que pretende descartar.
Use depends_on apenas para um pré-requisito real, sem ligar todas as specs umas às outras.

## Dependência fechada cujo conteúdo foi descartado

Se a spec foi encerrada e o resultado foi registrado, o consumidor pode usar o resumo histórico de encerramento.
Não é necessário manter toda a cadeia de specs anteriores para cada mudança nova.

- O resumo não é evidência fresca de funcionamento do sistema atual.
- O consumidor continua obrigado a verificar sua própria aceitação.
- Uma conclusão limited mantém o aviso de validação externa pendente.
- Contratos históricos ausentes/superseded geram aviso no contexto; selecione a referência vigente pertinente.
- Nenhum arquivo de evidência excluído é apresentado como recuperado.

Em projetos anteriores a este recurso, execute reconcile enquanto os arquivos ainda existem para registrar os estados observáveis.
Sem conteúdo nem registro prévio, o CLI não pode adivinhar um encerramento perdido.

## Exclusão manual ou dependência inacabada

~~~sh
sdd reconcile --dry-run
sdd reconcile
sdd doctor
~~~

A prévia mostra localizações observadas, conteúdo ausente e referências afetadas.
Reconcile atualiza apenas o inventário a partir do que está disponível. Não modifica requisitos, remove dependências ou fabrica testes/aprovações.
Mudanças de nomes manuais são descobertas pelo manifesto. Duplicatas de identidade são diagnosticadas, sem escolher uma cópia silenciosamente.

Uma dependência ausente sem encerramento conhecido:
1. Gera aviso no planejamento, permitindo revisar a spec existente.
2. Continua impedindo implementar/validar/fechar como se o pré-requisito estivesse resolvido.
3. Não obriga cancelar ou refazer a spec.

O agente deve verificar código, contratos e testes atuais. Depois pode recuperar a fonte ou revisar o vínculo:
- Se o pré-requisito já existe, referencie o contrato vigente e revise a necessidade de depends_on.
- Se ainda falta comportamento, planeje o trabalho necessário.
- Se não há informação suficiente, esclareça somente a lacuna.
- Preserve o ID e o trabalho válido; não invente o histórico perdido.

Ao mudar o plano aprovado, execute revise, registre a autorização real e produza a verificação atual.
Um manifesto defeituoso é reportado localmente; não deve impedir operar uma spec saudável sem relação com ele.

## Acompanhamento e atualização

~~~sh
sdd status
sdd status --all
sdd status 015-exportacao
~~~

Status sem ID mostra a área ativa. --all inclui arquivo, lixeira e registros retidos de conteúdo ausente/descartado.
Um registro retido é identificado como histórico, sem representar a existência da pasta.

Os formatos schema 2 existentes continuam válidos. Related/historical são opcionais.
Atualize o CLI, revise update --dry-run, atualize os pontos de entrada do harness e execute reconcile.
As preferências do projeto, como autonomia e idioma, continuam preservadas.
