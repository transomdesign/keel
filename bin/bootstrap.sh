#!/usr/bin/env bash
# bin/bootstrap.sh — Clone the keel starter and initialise a new project.
#
# Intended for remote execution:
#   curl -fsSL https://raw.githubusercontent.com/transomdesign/keel/main/bin/bootstrap.sh | bash -s -- my-project
#
# Or run locally after cloning the repo yourself.

set -euo pipefail

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

git clone --depth 1 "$REPO" "$TARGET_DIR"
cd "$TARGET_DIR"

# Run the init script (it will prompt for display name + prod host)
bash bin/init.sh "$SLUG"

echo ""
echo "🎉 Done! Starting your dev environment..."
ddev start
ddev composer install
ddev craft install
ddev launch
