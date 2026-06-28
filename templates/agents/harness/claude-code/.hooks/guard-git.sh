#!/bin/bash
# guard-git.sh
# Asks for confirmation before running git commit.
# git push, tag and branch -d are blocked via permissions.deny in settings.json.
# Exit 0 = allow | Exit 2 = block (Claude Code convention)

INPUT=$(cat)

# Extract the bash command from the JSON input sent by Claude Code
COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | head -1 | sed 's/"command":"//;s/"//')

# Intercept only git commit
if echo "$COMMAND" | grep -qE "^git commit"; then
  echo "⚠️  Agent wants to run: $COMMAND" >&2
  read -r -p "Allow git commit? [y/N] " response < /dev/tty
  if [[ "$response" =~ ^[Yy]$ ]]; then
    exit 0
  else
    echo "Blocked by guard-git.sh" >&2
    exit 2
  fi
fi

exit 0