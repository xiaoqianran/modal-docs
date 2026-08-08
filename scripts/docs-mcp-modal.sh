#!/bin/sh
# Modal docs via @arabold/docs-mcp-server (local install under .tools/docs-mcp)
set -eu
ROOT=/workspace/.tools/docs-mcp
STORE=/workspace/.docs-mcp
CFG=/workspace/.docs-mcp/docs-mcp.config.json
export PATH="$ROOT/node_modules/.bin:$PATH"

# Ensure nested better-sqlite3 has a loadable binary (sandbox blocks node-gyp chown)
NEST="$ROOT/node_modules/@arabold/docs-mcp-server/node_modules/better-sqlite3"
if [ -d "$NEST" ] && [ ! -f "$NEST/build/Release/better_sqlite3.node" ]; then
  echo "better-sqlite3 native binding missing; re-run setup or copy prebuild into:" >&2
  echo "  $NEST/build/Release/better_sqlite3.node" >&2
  exit 1
fi

# Ensure config allows local file indexing
if [ ! -f "$CFG" ]; then
  cat >"$CFG" <<'JSON'
{
  "scraper": {
    "security": {
      "fileAccess": {
        "mode": "allowedRoots",
        "allowedRoots": ["/workspace/docs/modal", "/workspace/docs/modal/pages"],
        "followSymlinks": false,
        "includeHidden": false
      }
    }
  }
}
JSON
fi

cmd="${1:-}"
shift || true

case "$cmd" in
  scrape)
    # Web crawl (default 500 pages)
    docs-mcp-server scrape modal https://modal.com/docs \
      --store-path "$STORE" \
      --config "$CFG" \
      --max-pages "${MAX_PAGES:-500}" \
      --max-depth 8 \
      --max-concurrency 4 \
      --scope hostname \
      --scrape-mode auto \
      --ignore-errors \
      --telemetry false \
      --logo false \
      --clean "${CLEAN:-false}" \
      "$@"
    ;;
  scrape-llms)
    # Re-fetch all URLs from llms.txt then index local markdown
    mkdir -p /workspace/docs/modal/pages
    curl -fsSL https://modal.com/llms.txt -o /workspace/docs/modal/llms.txt
    python3 - <<'PY'
import re, pathlib, urllib.request, ssl
from concurrent.futures import ThreadPoolExecutor, as_completed
text = pathlib.Path('/workspace/docs/modal/llms.txt').read_text()
urls = sorted(set(re.findall(r'https://modal\.com/[^\s\)\]]+', text)))
urls = [u.rstrip('.,;') for u in urls]
out = pathlib.Path('/workspace/docs/modal/pages')
ctx = ssl.create_default_context()

def fetch(u: str):
    candidates = [u] if u.endswith('.md') else [u + '.md', u]
    last = None
    for cu in candidates:
        try:
            req = urllib.request.Request(cu, headers={
                'User-Agent': 'docs-mcp-modal-scraper/1.0',
                'Accept': 'text/markdown, text/plain, text/html;q=0.5',
            })
            with urllib.request.urlopen(req, timeout=25, context=ctx) as r:
                data = r.read()
                final = r.geturl()
            path = re.sub(r'^https://modal\.com/', '', final)
            path = re.sub(r'[^\w\-/\.]+', '_', path)
            if path.endswith('/'):
                path += 'index'
            if not path.endswith(('.md', '.html', '.txt')):
                path += '.md'
            fp = out / path
            fp.parent.mkdir(parents=True, exist_ok=True)
            fp.write_bytes(data)
            return True
        except Exception as e:
            last = e
    return False

ok = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    for r in as_completed([ex.submit(fetch, u) for u in urls]):
        ok += int(bool(r.result()))
print(f'llms fetch ok={ok}/{len(urls)}')
PY
    docs-mcp-server scrape modal "file:///workspace/docs/modal/pages" \
      --store-path "$STORE" \
      --config "$CFG" \
      --max-pages 500 \
      --max-depth 12 \
      --max-concurrency 4 \
      --scope subpages \
      --scrape-mode fetch \
      --ignore-errors \
      --telemetry false \
      --logo false \
      --clean false
    ;;
  search)
    q="${1:-}"
    if [ -z "$q" ]; then
      echo "usage: $0 search \"query\"" >&2
      exit 1
    fi
    shift || true
    docs-mcp-server search modal "$q" \
      --store-path "$STORE" \
      --config "$CFG" \
      --logo false \
      --telemetry false \
      --limit "${LIMIT:-8}" \
      --output yaml \
      "$@"
    ;;
  list)
    docs-mcp-server list --store-path "$STORE" --config "$CFG" --logo false --telemetry false --output json "$@"
    ;;
  fetch)
    url="${1:-}"
    [ -n "$url" ] || { echo "usage: $0 fetch <url>" >&2; exit 1; }
    docs-mcp-server fetch-url "$url" --logo false --telemetry false "$@"
    ;;
  *)
    cat <<EOF
Usage:
  $0 scrape              # crawl https://modal.com/docs (MAX_PAGES=500, CLEAN=false)
  $0 scrape-llms         # re-download llms.txt catalog + index local markdown
  $0 search "query"      # search indexed Modal docs
  $0 list                # list libraries/versions
  $0 fetch <url>         # single page → markdown

Index: $STORE  (library name: modal)
EOF
    exit 1
    ;;
esac
