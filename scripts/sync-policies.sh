#!/usr/bin/env bash
# FILE_NAME: sync-policies.sh
# DESCRIPTION: Vendor non-test Rego from gha-reusable-actions-workflows into policy-src/.
# VERSION: 1.0.0
# AUTHORS: Ravichandra

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DST="$ROOT/policy-src/github_actions"

# Prefer local sibling checkout; override with POLICY_SRC.
DEFAULT_SRC="$(cd "$ROOT/.." && pwd)/gha-reusable-actions-workflows/policies/conftest/github_actions"
SRC="${POLICY_SRC:-$DEFAULT_SRC}"

if [[ ! -d "$SRC" ]]; then
  echo "error: source policy tree not found: $SRC" >&2
  echo "Clone ravichandrapatel/gha-reusable-actions-workflows beside this repo," >&2
  echo "or set POLICY_SRC to the github_actions policy folder." >&2
  exit 1
fi

rm -rf "$DST"
mkdir -p "$DST"
rsync -a --exclude='*_test.rego' --exclude='*.md' "$SRC/" "$DST/"

echo "synced $SRC -> $DST"
find "$DST" -type f -name '*.rego' | sort
