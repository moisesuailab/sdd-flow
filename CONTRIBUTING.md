# Contributing

## Development

~~~sh
git clone https://github.com/moisesuailab/sdd-flow.git
cd sdd-flow
npm ci
npm test
npm run check
~~~

Use Node.js 22+. The CLI uses CommonJS and the maintained yaml parser.
Runtime modules live in lib/, the entry point in bin/, canonical knowledge in templates/agents/,
and behavior/integration tests in test/. This repository owns both the CLI and templates.

## Changes

Describe the concrete problem and resulting behavior. Keep procedures concise and avoid
duplicating schema contracts across utility prompts. Add meaningful regression tests for
lifecycle, preservation, verification or compatibility changes.
Run the package smoke test and check that npm includes all runtime files.

Do not edit personal/global tool settings when testing adapters.
Use temporary projects. Do not publish npm or marketplace artifacts as part of tests.
