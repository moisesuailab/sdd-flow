# Contributing

## Setup

```bash
git clone https://github.com/moisesuailab/spec-workflow-cli
cd spec-workflow-cli
```

No dependencies — the CLI uses only Node.js built-ins.

## Testing locally

```bash
npm link      # installs the CLI globally from your local files
sdd --version # confirms it's using your local version
npm unlink    # removes the local link when done
```

## Submitting changes

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Open a pull request describing what was changed and why

## Templates

The `templates/` folder syncs from [spec-driven-workflow](https://github.com/moisesuailab/spec-driven-workflow). If your change involves updating workflow files, reference the source repository in your pull request.
