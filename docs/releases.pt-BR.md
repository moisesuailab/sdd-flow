# Publicação de uma nova versão

Guia do mantenedor para publicar o pacote npm `sdd-flow` a partir deste repositório.
Cada nome/versão publicado no npm é permanente: nunca reutilize um número, incremente-o.
Publicar no npm não atualiza o GitHub, e enviar ao GitHub não publica no npm.

## Preparar a versão 3.0.0

package.json e package-lock.json devem registrar a mesma versão. A linha 3.0 muda os defaults de geração
e armazenamento; confirme que o número escolhido está disponível antes de publicar. Mantenha o changelog
como Unreleased durante a revisão e registre a data quando preparar a publicação efetiva.

Teste o código-fonte com npm ci, npm test e npm run check. Instale o tarball em uma pasta descartável,
exercite o fluxo legível e a conversão de uma cópia de spec existente. Inspecione sdd privacy --staged.
Ao aplicar patches, confira a base indicada, preserve alterações posteriores e revise conflitos.
Specs existentes não são convertidas pelo update; --readable é uma operação separada e revisada.


## 1. Preparar

~~~sh
git switch main
git pull --ff-only
npm ci
npm test
npm run check
npm audit
~~~

1. Atualize `CHANGELOG.md` com a nova versão e a data.
2. Confira a versão em `package.json` e `package-lock.json`. Esta entrega já usa 3.0.0; não incremente novamente se esse for o número que pretende publicar e estiver disponível.
   Em outra entrega, altere a versão sem criar tag: `npm version <major|minor|patch> --no-git-tag-version` (atualiza os dois arquivos).
3. Faça o commit, envie a branch revisada e integre em `main`, por PR ou pelo processo do repositório. Não inclua credenciais, `node_modules` ou tarballs.
4. Aguarde o CI (Linux e Windows, Node 22 e 24) ficar verde.

Escolha da versão: correção ou ajuste de documentação/default dentro da mesma linha é patch;
funcionalidade compatível é minor; mudança incompatível de formato ou de runtime é major.

## 2. Publicar primeiro em `next`

`next` mantém `latest` na versão anterior, permitindo testar o pacote real do registro.
Escolha uma rota; não execute ambas para a mesma versão.

### Rota A — terminal autenticado

Requer acesso de mantenedor e Node.js 22+.

~~~sh
npm run release:check -- --version <versão> --tag next --check-registry
npm publish --dry-run --tag next
npm login
npm publish --tag next
~~~

- O hook `prepublishOnly` repete testes e checks.
- O npm pode abrir o navegador para confirmar passkey/2FA, ou pedir `--otp=<código>`.
  Não compartilhe senha, OTP ou token em mensagens ou arquivos do projeto.

### Rota B — GitHub Actions com Trusted Publishing (OIDC)

Arquivo: `.github/workflows/publish.yml`. Acionamento manual, somente em `main` no repositório
`moisesuailab/sdd-flow`; depende de testes em Node 22/24 em Linux/Windows. O código vem do SHA do disparo,
a versão é conferida e o mesmo tarball passa por dry-run e publicação, com provenance. Não há token permanente.

Configure uma vez, nas definições do pacote no npm:

| Campo | Valor |
|---|---|
| Provedor | GitHub Actions |
| Organização/usuário | moisesuailab |
| Repositório | sdd-flow |
| Nome do workflow | publish.yml |
| Environment | npm |

E crie o environment `npm` no GitHub (com revisores obrigatórios, se quiser uma aprovação adicional).
Depois: Actions → “Publish npm package” → Run workflow em `main`, com `version` igual ao `package.json`
e `dist_tag` = `next`. Documentação atual: https://docs.npmjs.com/trusted-publishers/

## 3. Verificar

~~~sh
npm view sdd-flow dist-tags --json
npx sdd-flow@next --help
~~~

Em uma pasta vazia, execute `npx sdd-flow@next init` e `npx sdd-flow@next doctor`.
O `doctor` indica pendência até que `agents/PROJECT.md` seja preenchido; isso é esperado.

## 4. Tornar estável

Depois de revisar migração, evidências e limitações, um mantenedor autenticado promove a versão existente:

~~~sh
npm dist-tag add sdd-flow@<versão> latest
npm view sdd-flow dist-tags --json
~~~

Isso move a tag; não republica o número. Para voltar atrás, aponte `latest` para a versão anterior
(`npm dist-tag add sdd-flow@<anterior> latest`). A automação de publish não promove versões.

## 5. Registrar no GitHub

Crie a tag no **commit exato que foi publicado** (`npm view sdd-flow@<versão> gitHead`):

~~~sh
git tag -a v<versão> <gitHead> -m "sdd-flow <versão>"
git push origin v<versão>
~~~

Crie o GitHub Release a partir da tag, usando a seção da versão no `CHANGELOG.md`.
Marque como pré-lançamento enquanto a versão estiver só em `next`.

## Atualizar os projetos consumidores

Instale o CLI desejado e atualize os templates de cada projeto com `sdd update --dry-run`.
Após revisar e aplicar, execute sdd reconcile --dry-run e sdd reconcile enquanto os históricos ainda existem,
para registrar localizações e encerramentos observáveis. Atualize os pontos de entrada do harness quando utilizados.
Consulte spec-management.pt-BR.md para renomeação, arquivamento, descarte e recuperação.
Atualizar a instalação global não modifica os arquivos já copiados nos aplicativos.
Leia `usage.pt-BR.md` e `migration.md` antes de migrar o formato 1.x.
