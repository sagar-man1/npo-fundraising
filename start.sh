#!/bin/bash
# One command to get the dashboard running: ./start.sh
# Safe to re-run — it skips whatever is already done.
set -euo pipefail

cd "$(dirname "$0")"

echo "PARFI Fundraising — starting up"
echo

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from the template. The dashboard runs without any keys;"
  echo "fill it in later to connect Notion and WhatsApp."
  echo
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies (a minute or two the first time)..."
  npm install
  echo
fi

echo "Setting up the database..."
npm run db:migrate >/dev/null
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
