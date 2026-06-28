#!/bin/bash
# guard-delete.sh
# Asks for confirmation before running destructive delete commands (rm -rf, rm -r, rm -f).
# Exit 0 = allow | Exit 2 = block (Claude Code convention)

INPUT=$(cat)

COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | head -1 | sed 's/"command":"//;s/"//')

# Intercept rm with recursive or force flags
if echo "$COMMAND" | grep -qE "rm\s+(-[a-zA-Z]*[rf][a-zA-Z]*|--recursive|--force)"; then
  echo "⚠️  Agent wants to run: $COMMAND" >&2
  read -r -p "Allow destructive delete? [y/N] " response < /dev/tty
  if [[ "$response" =~ ^[Yy]$ ]]; then
    exit 0
  else
    echo "Blocked by guard-delete.sh" >&2
    exit 2
  fi
fi

exit 0