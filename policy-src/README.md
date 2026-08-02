# SPVS policy source (vendored)

Rego policies for the in-browser [SPVS checker](../src/pages/spvs-checker.astro), vendored from:

[`ravichandrapatel/gha-reusable-actions-workflows`](https://github.com/ravichandrapatel/gha-reusable-actions-workflows/tree/main/policies/conftest/github_actions)

`*_test.rego` files are excluded.

## Packages

| Package | Deny entrypoint | Input shape |
| --- | --- | --- |
| `lib` | (helpers only) | — |
| `workflow` | `workflow/deny` | workflow YAML (`on` / `jobs` / `permissions`) |
| `composite` | `composite/deny` | composite `action.yml` (`runs.using: composite`) |

## Rebuild WASM

Requires the [OPA CLI](https://www.openpolicyagent.org/docs/latest/#running-opa) locally (build-time only; not used on GitHub Pages).

```bash
# optional: refresh vendored .rego from sibling checkout
./scripts/sync-policies.sh

./scripts/build-wasm.sh
# → public/policy.wasm
```

Commit both `policy-src/` and `public/policy.wasm` when policies change.
