#!/bin/bash
# One command to get the dashboard running: ./start.sh
#
# It pulls the latest code first, so this is also how you update. Safe to
# re-run — it skips whatever is already done.
#
#   ./start.sh --no-update   start without pulling (useful offline)
set -euo pipefail

cd "$(dirname "$0")"

SKIP_UPDATE=false
for arg in "$@"; do
  [ "$arg" = "--no-update" ] && SKIP_UPDATE=true
done

echo "PARFI Fundraising — starting up"
echo

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from the template. The dashboard runs without any keys;"
  echo "fill it in later to connect Notion and WhatsApp."
  echo
fi

# ── Pull the latest code, unless told not to ─────────────────────────────────
if [ "$SKIP_UPDATE" = false ] && [ -d .git ]; then
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    echo "Skipping the update — you have uncommitted local changes."
    echo "Run ./update.sh to see them."
    echo
  elif git fetch --quiet origin 2>/dev/null; then
    BRANCH="$(git rev-parse --abbrev-ref HEAD)"
    if git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null; then
      BEFORE="$(git rev-parse HEAD)"
      git merge --quiet --ff-only "origin/$BRANCH" 2>/dev/null || true
      if [ "$BEFORE" != "$(git rev-parse HEAD)" ]; then
        echo "Pulled the latest code:"
        git --no-pager log --oneline --no-decorate "$BEFORE..HEAD" | sed 's/^/  /'
        echo
      fi
    fi
  else
    echo "Couldn't reach GitHub — starting with the code you already have."
    echo
  fi
fi

# package-lock.json changes on every dependency change, package.json does not.
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo "Installing dependencies (a minute or two the first time)..."
  npm install
  echo
fi

echo "Setting up the database..."
DBLOG="$(mktemp)"
if ! npm run db:migrate >"$DBLOG" 2>&1; then
  echo "Database setup failed:"; tail -20 "$DBLOG"; rm -f "$DBLOG"; exit 1
fi
rm -f "$DBLOG"
npm run seed
echo

echo "Opening http://localhost:3000"
echo "Press Ctrl+C to stop."
echo

# Open the browser once the server is actually answering.
( for _ in $(seq 1 40); do
    if curl -sf -o /dev/null http://localhost:3000; then
      command -v open >/dev/null && open http://localhost:3000
      break
    fi
    sleep 1
  done ) &

npm run dev
