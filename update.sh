#!/bin/bash
# Pull the latest code and get everything back in sync: ./update.sh
# Safe to run any time. It does not start the dashboard — run ./start.sh for that.
set -euo pipefail

cd "$(dirname "$0")"

SCHEDULER_LABEL="com.parfi.fundraising.scheduler"

echo "PARFI Fundraising — updating"
echo

# ── 1. Refuse to clobber uncommitted work ────────────────────────────────────
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  echo "You have local changes that aren't committed:"
  echo
  git status --short
  echo
  echo "Updating would overwrite them. Either:"
  echo "  • keep them:    git stash          (then re-run ./update.sh)"
  echo "  • throw away:   git checkout -- ."
  exit 1
fi

# ── 2. Pull ──────────────────────────────────────────────────────────────────
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo "Fetching latest code (branch: $BRANCH)..."

if ! git fetch --quiet origin 2>/dev/null; then
  echo "Could not reach GitHub. Check your internet connection and try again."
  exit 1
fi

# The branch may have been deleted after its pull request was merged.
if ! git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null; then
  echo
  echo "The branch '$BRANCH' no longer exists on GitHub — it was probably merged."
  echo "Switching to the main branch instead."
  git checkout --quiet main
  BRANCH=main
fi

BEFORE="$(git rev-parse HEAD)"
git merge --quiet --ff-only "origin/$BRANCH"
AFTER="$(git rev-parse HEAD)"

if [ "$BEFORE" = "$AFTER" ]; then
  echo "Already up to date."
else
  echo "Updated. What changed:"
  git --no-pager log --oneline --no-decorate "$BEFORE..$AFTER" | sed 's/^/  /'
fi
echo

# ── 3. Dependencies and database ─────────────────────────────────────────────
LOG="$(mktemp)"
trap 'rm -f "$LOG"' EXIT

echo "Installing any new dependencies..."
if ! npm install >"$LOG" 2>&1; then
  echo "Install failed:"; tail -20 "$LOG"; exit 1
fi

echo "Applying any new database changes..."
if ! npm run db:migrate >"$LOG" 2>&1; then
  echo "Database update failed:"; tail -20 "$LOG"; exit 1
fi
echo

# ── 4. Restart the scheduler if it is installed ──────────────────────────────
if command -v launchctl >/dev/null 2>&1 &&
   launchctl print "gui/$UID/$SCHEDULER_LABEL" >/dev/null 2>&1; then
  echo "Restarting the morning scheduler..."
  launchctl kickstart -k "gui/$UID/$SCHEDULER_LABEL"
  echo "Scheduler restarted."
  echo
fi

echo "Done."
echo
echo "If the dashboard is running, stop it with Ctrl+C and start it again:"
echo "  ./start.sh"
