# Security Policy

## Supported versions

Only the site built from the `main` branch of this repository
([ravichandrapatel.github.io](https://github.com/ravichandrapatel/ravichandrapatel.github.io))
is considered live.

## Reporting a vulnerability

Please use **GitHub Private vulnerability reporting** on this repository
(Security → Report a vulnerability), or email **cheetiravi@gmail.com**
with a clear description and reproduction steps.

Do **not** open a public issue for undisclosed vulnerabilities.

You should receive an acknowledgement within a few days. Fixes for confirmed
issues will be prioritized based on impact to site visitors and the build pipeline.

## Scope

In scope:

- Cross-site scripting or content injection in published pages
- Supply-chain issues in this repo’s GitHub Actions or npm dependencies
- Exposure of secrets through this repository or its workflows

Out of scope:

- Third-party services linked from posts
- GitHub platform bugs (report to GitHub)
- Social engineering / physical security

## Hardening notes (operators)

- Pages deploys only via GitHub Actions (`build_type: workflow`); HTTPS enforced
- Repo Actions allowlist: GitHub-owned + verified Marketplace only
- Workflows in this repo pin Actions to full commit SHAs (Dependabot bumps them)
- Repo-wide “require SHA pinning” is off on purpose: `upload-pages-artifact` nests
  `upload-artifact@v4` by tag, which breaks Pages if the repo mandate is on
- `main` ruleset: no force-push, no deletion, PR + CODEOWNERS + required `build` check
  (repository admins may bypass for emergencies)
- Dependabot version + security updates enabled; CodeQL on push/PR/weekly
- Production builds omit `draft` and future-dated posts
- No cloud credentials belong in this repository
