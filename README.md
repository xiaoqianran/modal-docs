# modal-docs

Mirrored [Modal](https://modal.com) documentation + **GitHub Pages** site.

## Live site

**https://xiaoqianran.github.io/modal-docs/**

## Automation (GitHub Actions)

Workflow: **Fetch · Build · Deploy Pages** (`.github/workflows/pages.yml`)

| Trigger | What happens |
|---------|----------------|
| **Daily schedule** (`06:00 UTC`) | Re-fetch from `llms.txt` → commit doc diffs → build → deploy |
| **workflow_dispatch** (Actions UI) | Same; options to skip fetch / skip commit |
| **push to `main`** | Fetch latest → build → deploy (docs commit only on schedule/manual) |

Fetch script: `scripts/fetch-docs.mjs`  
- Reads `https://modal.com/llms.txt`  
- Downloads every catalog URL as Markdown  
- Writes `docs/pages/**`, `docs/list.json`  
- Redacts common secret patterns (`ghp_`, `dckr_pat_`, …)

## Contents

| Path | Description |
|------|-------------|
| `docs/llms.txt` | Official Modal docs catalog |
| `docs/pages/` | Markdown (Guide / Examples / Python·JS·Go SDK / CLI) |
| `scripts/fetch-docs.mjs` | CI-friendly scraper |
| `scripts/build-site.mjs` | Static site builder |
| `.github/workflows/pages.yml` | Fetch + build + Pages deploy |

## Local

```bash
npm install --no-save marked@15
npm run fetch          # re-scrape into docs/
npm run build:pages    # PAGES_BASE=/modal-docs
# or
npm run refresh
```

## Source

- https://modal.com/docs  
- https://modal.com/llms.txt  

Unofficial mirror for personal/dev use. Content © Modal Labs.
