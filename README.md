# modal-docs

Mirrored [Modal](https://modal.com) documentation for offline use / RAG.

## Contents

| Path | Description |
|------|-------------|
| `docs/llms.txt` | Official Modal docs catalog |
| `docs/pages/` | Markdown pages from the catalog (Guide / Examples / Python·JS·Go SDK / CLI) |
| `docs/llms-urls.txt` | URL list from `llms.txt` |
| `scripts/docs-mcp-modal.sh` | Helper to re-scrape / search with docs-mcp-server |

> Note: The SQLite search index (`documents.db`) is **not** included (GitHub secret scanning
> flags example credentials that appear in upstream Modal docs). Rebuild locally if needed.

## Source

- https://modal.com/docs
- https://modal.com/llms.txt

Unofficial mirror for personal/dev use. Content © Modal Labs.

## Rebuild search index (optional)

```bash
npx @arabold/docs-mcp-server@latest scrape modal file://$PWD/docs/pages \
  --store-path ./index --max-pages 500 --clean true
```
