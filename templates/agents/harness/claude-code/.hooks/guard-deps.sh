#!/bin/bash
# guard-deps.sh
# Asks for confirmation before installing new packages.
# Reinforces R08: no new dependency without justification in DECISIONS.md.
# Exit 0 = allow | Exit 2 = block (Claude Code convention)

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | head -1 | sed 's/"command":"//;s/"//')

# Intercept install commands that add NEW packages (not bare installs like "npm install" with no args)
if echo "$COMMAND" | grep -qE "^(npm install|npm i|yarn add|pnpm add|bun add) .+" || \
   echo "$COMMAND" | grep -qE "^(pip install|pip3 install|uv add) .+"; then
  echo "⚠️  Agent wants to install a new dependency: $COMMAND" >&2
  echo "    Remember: R08 requires justification in DECISIONS.md before adding packages." >&2
  read -r -p "Allow? [y/N] " response < /dev/tty
  if [[ "$response" =~ ^[Yy]$ ]]; then
    exit 0
  else
    echo "Blocked by guard-deps.sh" >&2
    exit 2
  fi
fi

exit 0