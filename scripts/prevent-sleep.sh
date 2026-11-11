#!/usr/bin/env bash
# scripts/prevent-sleep.sh
# Prevents macOS system/network sleep during authorized long-running tasks.
# Restores normal power settings immediately when the wrapped command finishes.

set -e

if [ "$#" -eq 0 ]; then
  echo "Usage: ./scripts/prevent-sleep.sh <command> [args...]"
  echo "Example: ./scripts/prevent-sleep.sh pnpm test"
  exit 1
fi

# Detect macOS and availability of caffeinate
if [[ "$OSTYPE" == "darwin"* ]] && command -v caffeinate >/dev/null 2>&1; then
  echo "⚡ [prevent-sleep] Task-scoped sleep prevention active (macOS caffeinate -dimsu)"
  # caffeinate flags:
  # -d prevent display from sleeping
  # -i prevent system from idle sleeping
  # -m prevent disk from idle sleeping
  # -s prevent system from sleeping when AC powered
  # -u declare user activity
  exec caffeinate -dimsu "$@"
else
  # On non-macOS or environments without caffeinate, execute command directly
  exec "$@"
fi
