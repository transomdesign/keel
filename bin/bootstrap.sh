#!/usr/bin/env bash
# bin/bootstrap.sh — Clone the keel starter and initialise a new project.
#
# Intended for remote execution:
#   curl -fsSL https://raw.githubusercontent.com/transomdesign/keel/main/bin/bootstrap.sh | bash -s -- my-project
#
# Or run locally after cloning the repo yourself.

set -euo pipefail

# Wrap everything in a function so bash parses the entire script before
# executing. Without this, `exec </dev/tty` would replace stdin mid-read
# and bash would hang waiting on the terminal for the rest of the script.
bootstrap() {
  # When piped through bash (e.g. curl | bash), stdin is the pipe, not the terminal.
  # Reopen stdin from /dev/tty so interactive prompts work correctly.
  [[ -t 0 ]] || exec </dev/tty

  SLUG="${1:-}"

  if [[ -z "$SLUG" ]]; then
    read -rp "Project slug (lowercase, hyphens ok): " SLUG
  fi

  REPO="https://github.com/transomdesign/keel.git"
  TARGET_DIR="./${SLUG}"

  echo "🚀 Bootstrapping new Craft project: ${SLUG}"
  echo ""

  # Clone the starter
  if [[ -d "$TARGET_DIR" ]]; then
    echo "❌ Directory '${TARGET_DIR}' already exists. Aborting."
    exit 1
  fi

  echo "📂 Cloning keel starter..."
  git clone --depth 1 "$REPO" "$TARGET_DIR"
  cd "$TARGET_DIR"

  # Rename tokens and re-init git
  echo ""
  bash bin/init.sh "$SLUG"

  # Start the dev environment (post-start hook installs composer + bun deps)
  echo ""
  echo "🐳 Starting DDEV (first run pulls Docker images — this can take a few minutes)..."
  ddev start -y

  # First-time Craft setup
  echo ""
  echo "⚙️  Running Craft install wizard..."
  ddev craft install

  echo ""
  echo "🎉 Your project is running at https://${SLUG}.ddev.site"
  echo ""
  echo "  cd ${SLUG}"
  echo "  make dev   # start Vite dev server with hot reload"
}

bootstrap "$@"
