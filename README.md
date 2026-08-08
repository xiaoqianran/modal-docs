# modal-docs

Mirrored [Modal](https://modal.com) documentation + **GitHub Pages** site.

## Live site

**https://xiaoqianran.github.io/modal-docs/**

Deployed by GitHub Actions on every push to `main`.

## Contents

| Path | Description |
|------|-------------|
| `docs/llms.txt` | Official Modal docs catalog |
| `docs/pages/` | Markdown (Guide / Examples / Python·JS·Go SDK / CLI) |
| `scripts/build-site.mjs` | Static site builder |
| `.github/workflows/pages.yml` | Pages deploy workflow |

## Local build

```bash
npm install --no-save marked@15
PAGES_BASE=/modal-docs node scripts/build-site.mjs
```

## Source

- https://modal.com/docs
- https://modal.com/llms.txt

Unofficial mirror. Content © Modal Labs.
