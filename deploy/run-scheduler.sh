#!/bin/bash
# Wrapper launchd invokes. Keeps the plist free of node-version specifics.
set -euo pipefail

cd "$(dirname "$0")/.."

# Pick up nvm/fnm/volta installs, which launchd's minimal PATH would miss.
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh"
fi

exec npm run scheduler
