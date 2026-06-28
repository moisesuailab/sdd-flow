# Contributing

## Development setup

```bash
git clone https://github.com/moisesuailab/sdd-flow
cd sdd-flow
```

No dependencies — the CLI uses only Node.js built-ins.

To test locally before publishing:

```bash
npm link          # installs the CLI globally from your local files
sdd --version     # confirms it's using your local version
npm unlink        # removes the local link when done
```

## Templates

The `templates/` folder is a copy of the [spec-driven-workflow](https://github.com/moisesuailab/spec-driven-workflow) repository. When the workflow is updated there, copy the relevant files here and publish a new version.

Files that sync from `spec-driven-workflow`:

```
templates/AGENTS.md
templates/agents/AGENTS.md
templates/agents/RULES.md
templates/agents/SETUP.md
templates/agents/DECISIONS.md
templates/agents/prompts/
templates/agents/skills/
```

Files that belong only to this package (do not overwrite from spec-driven-workflow):

```
templates/QUICKSTART.md
templates/agents/harness/claude-code/commands/
templates/agents/harness/opencode/commands/
```

## Publishing a new version

Publishing is automated via GitHub Actions and triggered exclusively by version tags. No commit or branch push publishes to npm.

**Step 1 — make your changes** and commit normally:

```bash
git add .
git commit -m "feat: describe the change"
git push
```

**Step 2 — bump the version** using npm (this creates a commit and a git tag automatically):

```bash
npm version patch   # bug fixes:      1.1.0 → 1.1.1
npm version minor   # new features:   1.1.0 → 1.2.0
npm version major   # breaking changes: 1.1.0 → 2.0.0
```

**Step 3 — push the commit and the tag:**

```bash
git push && git push --tags
```

GitHub Actions picks up the tag and publishes to npm automatically.

## NPM_TOKEN renewal

The `NPM_TOKEN` secret stored in GitHub Actions expires every 90 days. When it does, publishing will fail. To renew:

1. Go to [npmjs.com](https://www.npmjs.com) → your avatar → **Access Tokens** → **Generate New Token** → **Granular Access Token**
2. Set **Packages and scopes → Permissions → Read and write** for `sdd-flow`
3. Set expiration to 90 days
4. Copy the generated token
5. Go to the GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **NPM_TOKEN** → **Update**

Set a calendar reminder 10 days before expiration to avoid interruption.
