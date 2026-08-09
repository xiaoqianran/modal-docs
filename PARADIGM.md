# Docs Chrome Paradigm (modal-docs)

This repository is the **reference UI** for all `*-docs` mirrors.

## Design system

| Token | Role | Modal value |
|-------|------|-------------|
| `--bg` | page canvas | `#08090c` |
| `--surface` | sidebar / cards | `#12151c` |
| `--primary` | brand accent | `#7cf29a` (Modal green) |
| `--fg` / `--muted` | text hierarchy | `#e8eaef` / `#9aa3b5` |
| `--font` | UI + body | Plus Jakarta Sans |
| `--mono` | code | IBM Plex Mono |

## Required chrome

1. Sticky topbar + language switch + track chips  
2. Learning-path sidebar (multi-open accordion, search `/`)  
3. Reading progress bar  
4. Breadcrumb + sticky TOC with scroll-spy  
5. Prev / Next pager  
6. Code blocks with copy + language label  
7. Bilingual home hero (when locale exists)  
8. Mobile drawer + no horizontal overflow  

## Brand variants (other repos)

Keep structure identical; only swap CSS variables:

| Repo | Primary | Mark |
|------|---------|------|
| modal-docs | `#7cf29a` | M |
| modelscope-docs | `#5b8cff` | 魔 |
| langchain-docs | `#1c3c3c` + `#10b981` | LC |
| langgraph-docs | `#6366f1` | LG |
| kaggle-docs | `#20beff` | K |
| huggingface-docs | `#ffd21e` on dark | HF |

## Files to keep in sync

- `scripts/site-assets/site.css` — structure + tokens  
- `scripts/site-assets/site.js` — accordion / spy / progress / copy  
- `scripts/build-site.mjs` layout contract (progress, chips, pager, hero)  
- `scripts/i18n/ui.json` keys  

When improving chrome, land changes in **modal-docs first**, then port.
