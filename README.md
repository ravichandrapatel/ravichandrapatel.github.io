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

## Write a post

Add Markdown under `src/content/posts/`:

```md
---
title: Your title
description: One-line summary
pubDate: 2026-08-01
tags: [aws, devops]
---

Body in Markdown…
```

Then open a PR or push to `main` — Pages deploys automatically.

## Deploy

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

Repo Settings → Pages → Source: **GitHub Actions**.
