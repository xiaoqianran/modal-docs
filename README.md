# modal-docs

Mirrored [Modal](https://modal.com) documentation + **GitHub Pages** site with **English / 简体中文** language switcher.

## Live site

**https://xiaoqianran.github.io/modal-docs/**

- English (source): `/`
- 简体中文 (machine-translated): `/zh/`
- Top bar: **EN | 中文** switcher on every page

> Official Modal docs are **English-only**. Chinese pages are offline machine translations of the English Markdown mirror (API names & code stay English). Prefer English for precision.

## Automation (GitHub Actions)

Workflow: **Fetch · Build · Deploy Pages** (`.github/workflows/pages.yml`)

| Trigger | What happens |
|---------|----------------|
| **Daily schedule** (`06:00 UTC`) | Re-fetch → translate changed pages → commit → build → deploy |
| **workflow_dispatch** (Actions UI) | Same; options to skip fetch / translate / commit |
| **push to `main`** | Fetch + translate + build + deploy (docs commit only on schedule/manual) |

### Pipeline

1. **`scripts/fetch-docs.mjs`** — scrape from `https://modal.com/llms.txt`
2. **`scripts/translate-docs.mjs`** — EN → zh-CN with content-hash skip (`docs/zh/manifest.json`)
3. **`scripts/build-site.mjs`** — dual-locale static site (`dist/` + `dist/zh/`)
4. Deploy `dist/` to GitHub Pages

Fetch redacts common secret patterns (`ghp_`, `dckr_pat_`, …).  
Translate protects fenced code, inline code, and URLs; commits the zh cache so daily CI mostly hash-skips.

## Contents

| Path | Description |
|------|-------------|
| `docs/llms.txt` | Official Modal docs catalog |
| `docs/pages/` | English Markdown (source of truth) |
| `docs/zh/pages/` | Cached zh-CN translations |
| `docs/zh/manifest.json` | Content hashes for incremental translate |
| `scripts/i18n/ui.json` | UI strings (EN + 中文 chrome) |
| `scripts/fetch-docs.mjs` | CI-friendly scraper |
| `scripts/translate-docs.mjs` | Offline machine translation |
| `scripts/build-site.mjs` | Dual-locale static site builder |
| `.github/workflows/pages.yml` | Fetch + translate + build + Pages deploy |

## Local

```bash
npm install --no-save marked@15
npm run fetch              # re-scrape into docs/pages
npm run translate          # EN → docs/zh/pages (hash-cached)
npm run translate:smoke    # first 5 pages only
npm run build:pages        # PAGES_BASE=/modal-docs → dist/
# or all-in-one:
npm run refresh
```

Env knobs for translate:

| Env | Default | Meaning |
|-----|---------|---------|
| `TRANSLATE_CONCURRENCY` | `2` | Parallel pages |
| `TRANSLATE_LIMIT` | ∞ | Max files (smoke tests) |
| `TRANSLATE_FORCE=1` | off | Retranslate everything |
| `TRANSLATE_CHUNK` | `1200` | Max chars per gtx request |

## Language design (why this scheme)

| Option | Verdict |
|--------|---------|
| Official `/zh` on modal.com | **Does not exist** |
| Client-side live translate widget | Slow, flaky, SEO-poor, breaks offline |
| Full human translation | Ideal but not practical for 290+ auto-synced pages |
| **EN source + offline MT zh cache + `/zh/` + topbar switch** | **Best practical**: CI-friendly, hash-cached, code-safe, switchable |

## Source

- https://modal.com/docs  
- https://modal.com/llms.txt  

Unofficial mirror for personal/dev use. Content © Modal Labs. Chinese pages are machine-translated.

## LLM / agent access ([llmstxt.org](https://llmstxt.org/))

| File | Purpose |
|------|---------|
| [`/llms.txt`](./llms.txt) | Curated page index (mirror URLs) |
| [`/llms-full.txt`](./llms-full.txt) | Full markdown corpus for ingestion |
| `/meta/llms-index.json` | Machine-readable page list |

Generated at build time from scraped pages.
