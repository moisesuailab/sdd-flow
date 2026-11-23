# Privacidade e versionamento dos artefatos

A proteção separa trabalho local autorizado de compartilhamento. Projetos podem lidar legitimamente com
informações confidenciais; isso não deve impedir o desenvolvimento. Specs e relatórios compartilháveis usam
referências, dados sintéticos e apenas o detalhe necessário. Regras de negócio também podem ser confidenciais.

## Padrão da versão 3.0

| Conteúdo | Tratamento |
|---|---|
| SPEC/TASK/RESEARCH/VALIDATION | Markdown legível e compartilhável após revisão |
| Material confidencial necessário | Área central agents/.sdd/private/, ignorada mesmo sem achados do detector |
| Suspeita durante operações locais | Aviso por padrão; conteúdo original preservado |
| Fontes privadas no contexto | Omitidas por padrão; inclusão explícita com --include-private quando autorizada |
| Comandos configurados | Referências a variáveis de ambiente; não valores reais |
| Snapshots, recibos, handoff/evidências JSON | .sdd/ local dentro da spec, ignorado pelo Git |
| Saída completa dos comandos | Não gravada por padrão |
| Logs habilitados explicitamente | Locais, com redação heurística antes de gravar |
| Inventários globais registry/installed/adapters | Metadados compactos para identidade/manutenção; podem ser versionados |
| Backups, lixeira e locks | Locais e ignorados |

Suspeitas em gravações locais, aprovação, conversão e consumo de evidências geram avisos sanitizados, sem
interromper o fluxo padrão. O CLI não altera requisitos para corrigir suspeitas. A saída emitida é filtrada;
se um falso positivo ocultar um exemplo legítimo, consulte o original local autorizado. O roteiro público
USER_TESTS também oculta credenciais reconhecíveis, mantendo o original e hashes separados no registro local.
Erros de YAML não repetem trechos inteiros da fonte. Não há interceptação universal de outras ferramentas.
Prosa comum de requisitos, como “Password: must have at least 8 characters”, não é tratada como um valor de
credencial. Atribuições explícitas, valores entre aspas e headers com credenciais continuam sendo inspecionados.
Testes com processo isolado e tempo limitado cobrem entradas repetitivas grandes; a detecção permanece heurística.
Prosa comum de requisitos após dois-pontos, como “Password: must have at least 8 characters”, é diferenciada
de valores atribuídos/entre aspas; cabeçalhos Cookie exigem um par nome=valor. A detecção continua heurística.
O scanner evita buscas com reinício quadrático e calcula as linhas das ocorrências sem reler todo o prefixo.

## Uma área privada, criada somente quando necessária

Use agents/.sdd/private/<id-da-spec>/referencia.md para um documento confidencial novo que seja necessário.
Essa área é excluída pelo Git por finalidade, não pelo resultado do detector. Ela não é criada com documentos
vazios, nem recebe cópias automáticas de toda spec. O agente deve escolher o destino antes de escrever.
O CLI não move automaticamente documentos suspeitos: isso quebraria referências e confundiria falsos positivos
com classificação de confidencialidade. Preserve fontes existentes e referencie-as quando apropriado.

Registros de execução continuam na .sdd/ de cada spec; a área central é para material confidencial de trabalho.
Use nomes neutros nos caminhos e referências. Nenhuma dessas pastas fornece criptografia.

## Configuração

~~~yaml
privacy:
  local_mode: warn
  store_logs: false
  sensitive_paths:
    - docs/private
    - fixtures/customer-originals
~~~

local_mode: warn também é o padrão quando o campo está ausente. strict restabelece a recusa nas operações
locais protegidas, se a equipe escolher essa preferência. Avisos não dispensam a revisão antes de compartilhar.
Isso é independente de context.budget_mode, que trata tamanho, não privacidade.

sensitive_paths contém prefixos relativos de fontes confidenciais já existentes. Check, aprovação e verificação
podem usar essas referências; o conteúdo participa da verificação dos inputs. O scanner aponta esses caminhos
no índice mesmo sem detectar credenciais. Adicione exclusões de Git adequadas a esses prefixos extras;
a proteção automática da área central não cobre arbitrariamente todo caminho configurado.
Os arquivos .gitignore de proteção podem ser versionados. A classificação não cria criptografia ou novas permissões.
Arquivos .env.example/sample/template podem conter placeholders, nunca valores reais.

## Contexto autorizado com fontes privadas

Declare apenas as fontes/seções pertinentes em change.yaml. O contexto comum informa omissões, sem inventar
o conteúdo ausente. Para o trabalho que já possui autorização de acesso:

~~~sh
sdd context ID --phase implement --task T01 --include-private
~~~

O comando inclui somente referências selecionadas, não toda a pasta privada. --inspect continua emitindo
apenas diagnósticos. O pacote é marcado como contendo documentos privados; não o versione ou distribua.
O flag não concede acesso nem autoriza envio a terceiros. Confira as permissões e o provedor do harness.
Arquivos de credenciais (.env, chaves e stores) e recibos internos continuam fora do contexto, mesmo com o flag.
O aplicativo e seus testes podem usar credenciais pelo ambiente normalmente, sem copiá-las para o pacote.

Use variáveis de ambiente ou o gerenciador de segredos do ambiente. Não coloque tokens em argumentos
literais, URLs, notas de tarefa, capturas de tela ou documentos de teste.
Se precisar de logs para diagnosticar, habilite store_logs localmente e revise o material antes de compartilhar.

## Antes de versionar

~~~sh
git diff --cached --stat
sdd privacy --staged
~~~

A inspeção lê o conteúdo preparado no índice, mesmo se a cópia de trabalho foi corrigida depois.
Mostra caminhos, linhas e categorias; não mostra o valor suspeito. Saída 1 indica achados ou erro de inspeção.
Sem --staged, verifica arquivos de workflow no índice; fora de um repositório Git, verifica arquivos de trabalho.
Inclui nomes comuns de arquivos sensíveis e prefixos configurados, mesmo fora de agents/docs.
Não é uma varredura completa de todos os arquivos de código do repositório.

Revise também o diff preparado em ambiente privado. Não cole o diff bruto numa conversa se contiver dados reais.
Falsos positivos não interrompem o trabalho local no modo padrão. Antes de compartilhar, revise o achado e
use um placeholder, uma referência ou material privado quando adequado. Não há exclusão global automática
nem liberação silenciosa do achado. Exportações de distribuição recusam fontes declaradas privadas e padrões
reconhecíveis de credenciais, mesmo que o modo local seja warn.

## Arquivos anteriormente rastreados

.gitignore não remove arquivos do índice nem do histórico. O instalador preserva regras da equipe e
acrescenta padrões para os registros locais; o scanner ainda identifica registros privados rastreados.
Depois de revisar a cópia e garantir backup, o mantenedor pode retirar um caminho do índice com
`git rm --cached -- caminho` (ou -r para uma pasta), preservando os arquivos locais. Não execute isso em
massa sem conferir o diff. Essa operação não apaga versões já publicadas.

Se uma credencial foi exposta, revogue/rotacione primeiro. A limpeza do histórico exige coordenação com
colaboradores e não é feita automaticamente pelo framework. Referências oficiais:
https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
https://git-scm.com/docs/gitignore

## Limites reais

Detecção e redação são heurísticas: podem omitir formatos próprios, dados codificados, valores curtos,
dados pessoais e segredos de negócio. Não são DLP completo, sandbox ou garantia de anonimização.
Arquivos privados são texto local; proteja o computador, sincronizações e backups externos.
Git ignores não impedem envio forçado, cópia por outras ferramentas ou acesso/envio pelo provedor do modelo.
Permissões de arquivo são restritivas quando o sistema permite, mas não equivalem a criptografia.
Não force-add registros técnicos. Em outro checkout, a ausência de recibos locais exige nova verificação;
revisões sem snapshots locais usam impacto conservador. O Markdown e os IDs continuam disponíveis.
