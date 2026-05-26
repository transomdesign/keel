#!/usr/bin/env bash
# bin/bootstrap.sh — Clone the keel starter and initialise a new project.
#
# Intended for remote execution:
#   curl -fsSL https://raw.githubusercontent.com/transomdesign/keel/main/bin/bootstrap.sh | bash
#
# Or run locally after cloning the repo yourself.

set -euo pipefail

bootstrap() {
  SLUG="${1:-}"

  if [[ -z "$SLUG" ]]; then
    read -rp "Project slug (e.g. \"my-new-site\"): " SLUG </dev/tty
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
  ddev craft install </dev/tty

  echo ""
  echo "🎉 Your project is running at https://${SLUG}.ddev.site"
  echo ""
  echo "Get started with local dev:"
  echo "  cd ${SLUG} && make dev"
}

bootstrap "$@"
