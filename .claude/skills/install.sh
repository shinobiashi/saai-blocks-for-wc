#!/usr/bin/env bash
# install.sh — Install WordPress/WooCommerce Claude Code skills to ~/.claude/skills/
#
# Usage:
#   bash .claude/skills/install.sh              # install all skills
#   bash .claude/skills/install.sh wp-i18n      # install a specific skill

set -euo pipefail

SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${HOME}/.claude/skills"
SPECIFIC="${1:-}"

install_skill() {
    local skill="$1"
    local src="${SKILLS_DIR}/${skill}"
    local dst="${TARGET_DIR}/${skill}"

    if [ ! -d "$src" ]; then
        echo "  [skip] ${skill} — not found in $(basename "$SKILLS_DIR")"
        return
    fi

    if [ -d "$dst" ]; then
        echo "  [update] ${skill}"
    else
        echo "  [install] ${skill}"
    fi

    cp -r "$src" "$TARGET_DIR/"
}

mkdir -p "$TARGET_DIR"

echo "Installing WordPress/WooCommerce skills → ${TARGET_DIR}"
echo ""

if [ -n "$SPECIFIC" ]; then
    install_skill "$SPECIFIC"
else
    for skill_dir in "${SKILLS_DIR}"/wp-*/; do
        install_skill "$(basename "$skill_dir")"
    done
fi

echo ""
echo "Done. Restart Claude Code to pick up the new skills."
