# Docs Chrome Paradigm (modal-docs) — v3

This repository is the **reference UI** for all `*-docs` mirrors.

When improving chrome, land changes in **modal-docs first**, then port.

## Design system

| Token | Role | Modal value |
|-------|------|-------------|
| `--bg` | page canvas | `#08090c` |
| `--surface` | sidebar / cards | `#12151c` |
| `--primary` | brand accent | `#7cf29a` (Modal green) |
| `--fg` / `--muted` | text hierarchy | `#e8eaef` / `#9aa3b5` |
| `--font` | UI + body | Plus Jakarta Sans + Noto Sans SC |
| `--mono` | code | IBM Plex Mono |

## Required chrome (v3 checklist)

1. Sticky topbar + language switch + **track chips** (auto-filled from nav if empty)
2. Learning-path sidebar (multi-open accordion, search `/` or `⌘K`)
3. Reading progress bar
4. Breadcrumb + sticky TOC with scroll-spy
5. Prev / Next pager
6. Code blocks with copy + language label + macOS dots
7. Bilingual home hero with **stats strip** + meta pills
8. Mobile drawer + no horizontal overflow
9. Skip-to-content link
10. Back-to-top FAB
11. Keyboard help (`?`)
12. Heading anchors (copy section URL)
13. External-link indicator on `target=_blank`
14. `prefers-reduced-motion` + print styles
15. OG / theme-color meta

## Brand variants (other repos)

Keep **structure identical**; only swap CSS variables + brand mark + `STORE_KEY` / preferred track:

| Repo | Primary | Mark | Preferred track |
|------|---------|------|-----------------|
| modal-docs | `#7cf29a` | M | `guide` |
| modelscope-docs | `#6ea8ff` | 魔 | `models` |
| langchain-docs | `#10b981` | LC | `oss-python` |
| langgraph-docs | `#818cf8` | LG | `python` |
| kaggle-docs | `#20beff` | K | `platform` |
| huggingface-docs | `#ffcc4d` | HF | `transformers` |

## Files to keep in sync

| File | Contract |
|------|----------|
| `scripts/site-assets/site.css` | structure + tokens (swap brand block only) |
| `scripts/site-assets/site.js` | accordion / spy / progress / copy / chips auto-fill / kbd |
| `scripts/build-site.mjs` | layout: progress, chips, pager, hero, skip, to-top, kbd help |
| `scripts/i18n/ui.json` | keys including `skipToContent`, `kbd*`, `stat*` |

## Porting recipe

1. Copy `site.css` from modal → replace `:root` brand tokens + header comment.
2. Copy `site.js` → set `STORE_KEY`, `LANG_KEY`, preferred-track selectors.
3. Ensure layout HTML includes: `.progress`, `.chips` / `#trackChips`, `#search`, `#nav`, `.to-top` optional (JS creates if missing), skip-link recommended.
4. Rebuild with `PAGES_BASE=/repo-name node scripts/build-site.mjs`.
5. Push → GitHub Pages Action.

## Anti-patterns

- Empty chips host without JS auto-fill (broken desktop track jump)
- One-accordion-only sidebars (must multi-open)
- Gradient text on `h1` (clips invisible on some GPUs)
- Binding only `localhost` / wrong `PAGES_BASE`
- Diverging layout markup across mirrors without updating this file

## Shared body pipeline (v3.1)

All `*-docs` mirrors share:

| Module | Role |
|--------|------|
| `scripts/mdx-normalize.mjs` | MDX/Mintlify → GFM before render |
| `scripts/marked-renderer.mjs` | heading anchors + code-bar renderer (`renderMarkdown`) |
| `scripts/link-rewrite.mjs` | official host / root-path → mirror links |
| `scripts/quality-report.mjs` | body quality gate (`npm run quality`) |

Port repos: `build-site.mjs` thin shell + `paradigm-page.mjs` chrome.
Modal: still has bespoke nav from `llms.txt`; uses the same renderer/normalize modules.

