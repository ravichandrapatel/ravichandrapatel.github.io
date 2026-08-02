# cloud-dispatch

Field notes on **AWS · Azure · GCP · Linux · DevOps** by [Ravichandra](https://github.com/ravichandrapatel).

**Live site:** https://ravichandrapatel.github.io/

> GitHub repo name is `ravichandrapatel.github.io` (required for the apex user site).
> Local folder stays `cloud-dispatch` for convenience.

Stack: [Astro](https://astro.build) → GitHub Actions → GitHub Pages.

## Local development

Requires Node.js **22+**.

```bash
npm ci
npm run dev
```

### SPVS pipeline checker (OPA WASM)

In-browser OWASP SPVS / CKV checker at `/spvs-checker/`. Policies are vendored in
`policy-src/github_actions/` (from `gha-reusable-actions-workflows`). Rebuild the
static `public/policy.wasm` when Rego changes — requires the
[OPA CLI](https://www.openpolicyagent.org/docs/latest/#running-opa) locally
(not needed at runtime on GitHub Pages):

```bash
./scripts/sync-policies.sh   # optional refresh from sibling checkout
./scripts/build-wasm.sh      # → public/policy.wasm
```

## Write a post

Add Markdown or MDX under `src/content/posts/`. Voice: human, specific, no fluff.

```md
---
title: Your title
description: One-line summary
pubDate: 2026-08-01
tags: [aws, devops]
---

Body in Markdown…
```

### Architecture / explain-flow diagrams

For auth flows, trust-boundary toggles, or multi-mode architecture explainers, **do not** ship Mermaid/PNG alone. Add an interactive React island under `src/components/diagrams/` (Tailwind + Framer Motion, official product SVGs) and mount it from MDX with `client:load`. See the Vault Hub post for the pattern (`VaultK8sAuthFlow`).

Then open a PR or push to `main` — Pages deploys automatically.

## Deploy

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

Repo Settings → Pages → Source: **GitHub Actions**.
