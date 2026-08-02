#!/usr/bin/env bash
# FILE_NAME: build-wasm.sh
# DESCRIPTION: Compile vendored SPVS Rego policies to public/policy.wasm for in-browser OPA.
# VERSION: 1.0.0
# AUTHORS: Ravichandra

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POLICY_DIR="${POLICY_DIR:-$ROOT/policy-src/github_actions}"
OUT_WASM="${OUT_WASM:-$ROOT/public/policy.wasm}"
BUNDLE_TMP="$(mktemp -t spvs-bundle.XXXXXX.tar.gz)"
EXTRACT_TMP="$(mktemp -d -t spvs-extract.XXXXXX)"

cleanup() {
  rm -f "$BUNDLE_TMP"
  rm -rf "$EXTRACT_TMP"
}
trap cleanup EXIT

if ! command -v opa >/dev/null 2>&1; then
  echo "error: opa CLI not found on PATH." >&2
  echo "Install OPA (dev dependency only — not needed at site runtime):" >&2
  echo "  https://www.openpolicyagent.org/docs/latest/#running-opa" >&2
  echo "  e.g. curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64_static && chmod +x opa" >&2
  exit 1
fi

if [[ ! -d "$POLICY_DIR" ]]; then
  echo "error: policy directory not found: $POLICY_DIR" >&2
  echo "Run scripts/sync-policies.sh first, or set POLICY_DIR." >&2
  exit 1
fi

echo "opa $(opa version | head -1)"
echo "building wasm from $POLICY_DIR"
echo "entrypoints: workflow/deny, composite/deny"

opa build -t wasm \
  -e workflow/deny \
  -e composite/deny \
  -o "$BUNDLE_TMP" \
  "$POLICY_DIR"

tar -xzf "$BUNDLE_TMP" -C "$EXTRACT_TMP"
mkdir -p "$(dirname "$OUT_WASM")"
cp "$EXTRACT_TMP/policy.wasm" "$OUT_WASM"
chmod 644 "$OUT_WASM"

echo "wrote $OUT_WASM ($(wc -c <"$OUT_WASM") bytes)"
