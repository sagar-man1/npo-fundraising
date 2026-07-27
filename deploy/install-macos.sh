#!/bin/bash
# Installs the daily research scheduler as a launchd user agent on macOS.
# Run once on the Mac mini, from the project root:  ./deploy/install-macos.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.parfi.fundraising.scheduler"
AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$AGENTS_DIR/$LABEL.plist"

echo "Installing $LABEL"
echo "  app:   $APP_DIR"
echo "  plist: $PLIST_PATH"

if [ ! -f "$APP_DIR/.env" ]; then
  echo
  echo "ERROR: $APP_DIR/.env is missing. Copy .env.example to .env and fill it in first."
  exit 1
fi

if [ ! -d "$APP_DIR/.whatsapp-profile" ] && [ -z "${WHATSAPP_PROFILE_DIR:-}" ]; then
  echo
  echo "WARNING: no WhatsApp session found. Run 'npm run whatsapp:login' and scan the"
  echo "         QR code, or the morning message will fail."
fi

mkdir -p "$AGENTS_DIR" "$APP_DIR/logs"
chmod +x "$APP_DIR/deploy/run-scheduler.sh"

sed -e "s|__APP_DIR__|$APP_DIR|g" -e "s|__USER__|$USER|g" \
  "$APP_DIR/deploy/$LABEL.plist" > "$PLIST_PATH"

# Reload cleanly if a previous version is already registered.
launchctl bootout "gui/$UID/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID" "$PLIST_PATH"
launchctl enable "gui/$UID/$LABEL"

echo
echo "Installed and started."
echo
echo "  status:  launchctl print gui/$UID/$LABEL | head -20"
echo "  logs:    tail -f $APP_DIR/logs/scheduler.log"
echo "  stop:    launchctl bootout gui/$UID/$LABEL"
echo "  start:   launchctl bootstrap gui/$UID $PLIST_PATH"
echo
echo "Also do this so the Mac mini never sleeps through a run:"
echo "  sudo pmset -a sleep 0 disablesleep 1"
