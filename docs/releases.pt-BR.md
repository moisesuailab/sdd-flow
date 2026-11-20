# Atualização do pacote npm

Verificação em 20/11/2026: o registro público retorna sdd-flow@1.3.3 e latest aponta para 1.3.3.
Este checkout prepara 2.0.0 e ainda não representa uma publicação concluída.

## 1. Baixar e testar sem publicar

O ZIP inclui CLI, templates, documentação, testes e workflows, sem node_modules ou histórico Git.
Extraia-o e siga local-testing.pt-BR.md. O TGZ é o pacote instalável, sem a suíte de desenvolvimento.
O patch completo preserva commits e remoções de arquivos obsoletos e é a opção recomendada para envio ao GitHub.
Copiar arquivos do ZIP sobre o repositório não aplica essas remoções.

## 2. Aplicar a entrega no repositório Git

Exemplos PowerShell. Use uma clonagem nova para preservar trabalhos em andamento:

~~~powershell
git clone https://github.com/moisesuailab/sdd-flow.git sdd-flow-release
Set-Location sdd-flow-release
git switch main
git pull --ff-only
git status --short
git log -1 --oneline
git switch -c feat/sdd-flow-v2
git am 'C:\caminho\sdd-flow-2.0.0.patch'
~~~

O patch completo foi preparado e testado sobre d84c62d51d9c566b0f3e8a6279418220e0fc6e8f, a base 1.3.3 analisada.
Ele inclui as entregas anteriores desta conversa: não o reaplique sobre esses mesmos commits.
Se main tiver avançado, examine os conflitos com git status. git am --abort desfaz somente a aplicação em andamento;
não use reset --hard ou force push para contornar diferenças. Adapte a entrega à base atual e teste novamente.

O patch incremental sdd-flow-2.0.0-update.patch contém somente a evolução posterior ao commit
c7ab2338eac10d10d18f526f6e7d75a6e4e69255 (a entrega anterior, com quality gates e handoff).
Use-o apenas se essa entrega já estiver aplicada; ele não substitui o patch completo numa base 1.3.3.
Confira git log antes de escolher. Não aplique os dois patches sobre o mesmo checkout.

Depois da aplicação:

~~~powershell
npm ci
npm test
npm run check
npm run release:check -- --version 2.0.0 --tag next --check-registry
npm publish --dry-run --tag next
git status --short
git diff --check
git log -5 --oneline
~~~

Se fizer ajustes durante os testes, revise git diff, selecione arquivos com git add e crie um commit antes de enviar.
O patch já cria seus próprios commits. Não inclua credenciais, node_modules ou tarballs no commit.

## 3. Enviar branch e abrir PR

~~~powershell
git push -u origin feat/sdd-flow-v2
~~~

No GitHub, abra Compare & pull request, com base main e a branch enviada.
Título sugerido: “Evoluir metodologia, contexto e rastreabilidade do sdd-flow para 2.0”.
Descreva a mudança de formato, Node 22+, testes realizados, validação nos harnesses e limites conhecidos.
Espere os checks do CI e revise a migração antes do merge. Criar PR não publica no npm.
Se usar GitHub CLI autenticado, gh pr create --base main --head feat/sdd-flow-v2 abre esse fluxo.

Após o merge, publique o código integrado:

~~~powershell
git switch main
git pull --ff-only
npm ci
npm test
npm run check
~~~

Escolha uma rota abaixo: Actions com OIDC ou terminal autenticado. Não execute ambas para a mesma versão.

## PR, merge e publicação são operações distintas

O npm não exige PR: um mantenedor autorizado pode publicar a partir de um checkout local.
Para este projeto, o fluxo recomendado é revisar a branch por PR, executar CI, integrar em main e publicar o commit revisado.
A automação adicionada aqui aceita execução manual somente em main no repositório moisesuailab/sdd-flow.
Fazer merge não publica automaticamente e publicar no npm não atualiza o GitHub.

A versão 2 altera formatos e requisitos de runtime; não deve substituir o conteúdo de 1.3.3.
Cada nome/versão publicado é permanente. Use um número novo.

## Primeiro testar pela tag next

O campo version já está em 2.0.0; não execute npm version major novamente neste checkout.
A primeira publicação recomendada usa next, mantendo latest na versão anterior.

Após a publicação:
~~~sh
npm install -g sdd-flow@next
sdd --version
~~~

A versão 2.0.0 pode usar a tag next mesmo sem sufixo rc.
Se quiser versões de teste separadas, use números como 2.0.0-rc.1 e atualize package.json/package-lock juntos.

## Automação preparada

Arquivo: .github/workflows/publish.yml. Ele é acionado manualmente, sem publicar em todo push ou PR.
O job de publicação depende de testes no Node 22/24 em Linux/Windows.
O código é obtido pelo SHA do disparo, a versão é conferida e o registro é consultado antes do envio.
O mesmo tarball é inspecionado em dry-run e publicado. Artefatos de desenvolvimento ficam fora do pacote.

O acesso ao npm usa Trusted Publishing/OIDC, sem um token permanente no repositório.
O dono do pacote precisa configurar, nas definições do pacote no npm:

| Campo | Valor desta automação |
|---|---|
| Provedor | GitHub Actions |
| Organização/usuário | moisesuailab |
| Repositório | sdd-flow |
| Nome do workflow | publish.yml |
| Environment | npm |
| Ação permitida | Publicação direta com npm publish |

A autorização do npm é separada da conexão GitHub do ChatGPT.
Criar uma relação de confiança concede permissão de publicação e deve ser feito pelo responsável.
Se quiser revisão adicional, configure revisores no environment npm do GitHub; o nome por si só não cria proteção.
Confira as exigências atuais em https://docs.npmjs.com/trusted-publishers/ ao configurar.

Depois do merge e da configuração:
1. Abra a action “Publish npm package” no GitHub e execute em main.
2. Informe version igual a package.json, inicialmente 2.0.0.
3. Selecione dist_tag next.
4. Confira todos os jobs e verifique o registro:

~~~sh
npm view sdd-flow@2.0.0 version dist-tags --json
~~~

O workflow não configura permissões do npm por conta própria.
npm whoami sem login local não testa se um job OIDC do GitHub está autorizado.

## Publicação manual alternativa

Em um checkout revisado, com Node.js 22+ e acesso de mantenedor ao pacote:

~~~sh
npm ci
npm test
npm run check
npm run release:check -- --version 2.0.0 --tag next --check-registry
npm publish --dry-run --tag next
npm login
npm publish --tag next
~~~

Após o envio, confira npm view sdd-flow@2.0.0 version dist-tags --json e crie um novo laboratório
instalando explicitamente sdd-flow@2.0.0. Para registrar o marco no Git, crie e envie a tag v2.0.0
no commit integrado que foi publicado. Uma tag Git não publica no npm por si só.

O dry-run não concede acesso nem garante que a autenticação final funcionará.
O npm pode exigir confirmação de autenticação/2FA no fluxo oficial.
Não compartilhe senha, OTP ou token em mensagens ou arquivos do projeto.
O hook prepublishOnly repete testes e checks antes de uma publicação manual a partir do código-fonte.

## Tornar a versão estável

Depois de revisar adoção/migração, evidências disponíveis e limitações de compatibilidade,
um mantenedor autenticado pode promover a versão existente:

~~~sh
npm dist-tag add sdd-flow@2.0.0 latest
npm view sdd-flow dist-tags --json
~~~

Isso move a tag; não republica o mesmo número.
A automação de publish não promove automaticamente uma versão já existente.
Para um release novo depois disso, incremente o número apropriado, revise e publique novamente.

## Atualizar os projetos consumidores

Instale o CLI desejado e depois atualize os templates de cada projeto com sdd update --dry-run.
Não basta atualizar a instalação global para modificar os arquivos já copiados nos aplicativos.
Leia usage.pt-BR.md e migration.md antes de migrar o formato 1.x.

## Pré-condições que ainda precisam de acesso

A publicação real depende da autorização do mantenedor no npm ou de um Trusted Publisher configurado.
O envio da branch/PR depende de escrita no repositório. A conexão observada nesta sessão recusou escrita com 403.
Os arquivos e verificações preparados aqui não significam que a publicação ou o PR já ocorreram.
