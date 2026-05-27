#!/usr/bin/env bash
# bin/init.sh — Personalise this Craft CMS starter for a new project.
#
# Usage:
#   bin/init.sh [slug] ["Display Name"] [--yes]
#
# Arguments are optional; the script prompts for any that are missing.
# Run once, immediately after cloning. Guard against double-runs.

set -euo pipefail

# When piped through bash (e.g. curl | bash), stdin is the pipe, not the terminal.
# Reopen stdin from /dev/tty so interactive prompts work correctly.
[[ -t 0 ]] || exec </dev/tty

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Sentinel check ────────────────────────────────────────────────────────────
# If the placeholder slug is gone, this script has already been run.
if ! grep -q 'name: keel' "$ROOT/.ddev/config.yaml" 2>/dev/null; then
  echo "⚠️  init.sh has already been run on this project. Aborting."
  exit 1
fi

# ── Gather inputs ─────────────────────────────────────────────────────────────
SLUG="${1:-}"
DISPLAY="${2:-}"
AUTO_CONFIRM="${3:-}"

if [[ -z "$SLUG" ]]; then
  read -rp "Project slug (e.g. \"my-new-site\" — used for ddev name, URLs, bucket): " SLUG
fi

if [[ -z "$DISPLAY" ]]; then
  read -rp "Display name (e.g. \"My New Site\"): " DISPLAY
fi

# ── Validate slug ─────────────────────────────────────────────────────────────
if [[ ! "$SLUG" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$ ]]; then
  echo "❌ Slug must be lowercase letters, numbers, and hyphens only (no leading/trailing hyphens)."
  exit 1
fi

echo ""
echo "  Slug:         $SLUG"
echo "  Display name: $DISPLAY"

if [[ "$AUTO_CONFIRM" != "--yes" ]]; then
  echo ""
  read -rp "Proceed? [y/N] " CONFIRM
  [[ "$CONFIRM" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

# ── Files to rewrite ─────────────────────────────────────────────────────────
# Explicit list of tracked text files that carry placeholder tokens.
FILES=(
  "$ROOT/.ddev/config.yaml"
  "$ROOT/.env.example"
  "$ROOT/package.json"
)

# All YAML in config/project/
while IFS= read -r f; do FILES+=("$f"); done < <(
  find "$ROOT/config/project" -type f -name "*.yaml"
)

# Plugin composer files
FILES+=(
  "$ROOT/plugins/matrix-defaults/composer.json"
  "$ROOT/plugins/site-asset-router/composer.json"
  "$ROOT/plugins/behold/composer.json"
)

# Src + templates
while IFS= read -r f; do FILES+=("$f"); done < <(
  find "$ROOT/src" "$ROOT/templates" -type f \( -name "*.ts" -o -name "*.css" -o -name "*.twig" \)
)

FILES+=(
  "$ROOT/vite.config.ts"
  "$ROOT/README.md"
)

# ── Replace tokens ─────────────────────────────────────────────────────────--
echo ""
echo "🔄 Replacing tokens..."

for FILE in "${FILES[@]}"; do
  [[ -f "$FILE" ]] || continue
  INIT_SLUG="$SLUG" INIT_DISPLAY="$DISPLAY" perl -0pi -e '
    my $slug = $ENV{INIT_SLUG};
    my $display = $ENV{INIT_DISPLAY};
    s/keel-secondary/$slug-secondary/g;
    s/keel-tertiary/$slug-tertiary/g;
    s/keel-fourth/$slug-fourth/g;
    s/\bkeel\b/$slug/g;
    s/CRAFT_SYSTEM_NAME=Keel/qq{CRAFT_SYSTEM_NAME="$display"}/ge;
    s/Keel/$display/g;
  ' "$FILE"
done

# ── Rename CSS files ──────────────────────────────────────────────────────────
# (keep primary/secondary/tertiary names — they're generic per-site handles)

# ── Rename workspace file ─────────────────────────────────────────────────────
if [[ -f "$ROOT/keel.code-workspace" ]]; then
  mv "$ROOT/keel.code-workspace" "$ROOT/${SLUG}.code-workspace"
fi

# ── Re-init git ───────────────────────────────────────────────────────────────
rm -rf "$ROOT/.git"
git -C "$ROOT" init -q

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "✅ Project files personalized for ${DISPLAY}."
echo ""
echo "  ddev start          # starts containers — composer + bun install run automatically"
echo "  ddev craft install  # first-time Craft setup (admin account, site name)"
echo "  make dev            # Vite dev server with hot reload"
