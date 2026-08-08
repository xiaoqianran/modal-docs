#!/usr/bin/env node
/**
 * Fetch Modal docs from official llms.txt + page URLs.
 * Portable for local + GitHub Actions (no docs-mcp / native deps).
 *
 * Writes:
 *   docs/llms.txt
 *   docs/llms-urls.txt
 *   docs/list.json
 *   docs/pages/**  (mirrors modal.com path → .md)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const PAGES = path.join(DOCS, "pages");
const LLMS_URL = process.env.LLMS_URL || "https://modal.com/llms.txt";
const CONCURRENCY = Math.max(1, Number(process.env.FETCH_CONCURRENCY || 8));
const TIMEOUT_MS = Math.max(5000, Number(process.env.FETCH_TIMEOUT_MS || 30000));
const UA = process.env.FETCH_UA || "modal-docs-mirror/1.0 (+https://github.com/xiaoqianran/modal-docs)";

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Redact secrets / tokens that sometimes appear in examples */
function sanitize(text) {
  let t = String(text);
  t = t.replace(/\bdckr_pat_[A-Za-z0-9_]+\b/g, "dckr_pat_REDACTED");
  t = t.replace(/\bghp_[A-Za-z0-9]{20,}\b/g, "ghp_REDACTED");
  t = t.replace(/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, "github_pat_REDACTED");
  t = t.replace(/\bAKIA[0-9A-Z]{16}\b/g, "AKIA_REDACTED");
  t = t.replace(/\bak-[A-Za-z0-9]{20,}\b/g, "ak-REDACTED");
  return t;
}

function isHtml(text) {
  const t = String(text).trimStart().slice(0, 200).toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.startsWith("<head");
}

function extractUrls(llmsText) {
  const raw = [...llmsText.matchAll(/https:\/\/modal\.com\/[^\s)\]>'"]+/g)].map((m) =>
    m[0].replace(/[.,;:]+$/g, ""),
  );
  const set = new Set();
  for (const u of raw) {
    const clean = u.split("#")[0].replace(/\/$/, "");
    if (clean) set.add(clean);
  }
  return [...set].sort();
}

function urlToRelPath(url) {
  // https://modal.com/docs/guide/images.md -> docs/guide/images.md
  // https://modal.com/docs/guide -> docs/guide.md
  let u = url.replace(/^https:\/\/modal\.com\//, "");
  if (!u.endsWith(".md")) u = u + ".md";
  return u;
}

/** Hub pages with no public .md source get a short stub so nav still works */
function stubMarkdown(url) {
  const pathPart = url.replace(/^https:\/\/modal\.com\//, "").replace(/\.md$/, "");
  const title =
    pathPart === "docs"
      ? "Modal documentation"
      : pathPart
          .split("/")
          .pop()
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
  return `# ${title}

This section index is not published as Markdown on modal.com.

Browse the **left navigation**, or open the [official page](${url.replace(/\.md$/, "")}).
`;
}

async function fetchText(url, { accept } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // Prefer strict markdown Accept — including text/html makes some Modal
    // endpoints return the SPA shell instead of the .md source.
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: accept || "text/markdown, text/plain;q=0.9, */*;q=0.1",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} for ${url}`);
      err.status = res.status;
      throw err;
    }
    const buf = await res.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(buf);
    return { text, finalUrl: res.url, contentType: res.headers.get("content-type") || "" };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPage(url) {
  // Prefer bare URL first: many Modal pages serve text/markdown only without .md,
  // while .md often 404s as HTML. Then try .md suffix.
  const candidates = [];
  if (url.endsWith(".md")) {
    candidates.push(url);
    candidates.push(url.slice(0, -3));
  } else {
    candidates.push(url);
    candidates.push(url + ".md");
  }

  let lastErr;
  for (const cu of candidates) {
    try {
      const { text, finalUrl, contentType } = await fetchText(cu);
      if (isHtml(text) || /text\/html/i.test(contentType)) {
        lastErr = new Error(`HTML response for ${cu}`);
        continue;
      }
      return { text: sanitize(text), finalUrl, source: cu };
    } catch (e) {
      lastErr = e;
      if (e.status === 404) continue;
      if (e.status === 429 || (e.status >= 500 && e.status < 600)) {
        await sleep(800);
      }
    }
  }

  // Hub pages (docs / guide / examples roots) may only ship HTML SPA shells
  if (/^https:\/\/modal\.com\/docs(\/guide|\/examples)?$/.test(url.replace(/\.md$/, ""))) {
    return {
      text: stubMarkdown(url),
      finalUrl: url,
      source: "stub",
      stub: true,
    };
  }

  throw lastErr || new Error(`Failed ${url}`);
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

async function main() {
  ensureDir(PAGES);
  console.log(`Fetching catalog: ${LLMS_URL}`);
  const { text: llmsText } = await fetchText(LLMS_URL, {
    accept: "text/plain, text/markdown;q=0.9, */*;q=0.1",
  });
  fs.writeFileSync(path.join(DOCS, "llms.txt"), sanitize(llmsText));

  const urls = extractUrls(llmsText);
  for (const extra of [
    "https://modal.com/docs",
    "https://modal.com/docs/guide",
    "https://modal.com/docs/examples",
  ]) {
    if (!urls.includes(extra)) urls.push(extra);
  }
  urls.sort();
  fs.writeFileSync(path.join(DOCS, "llms-urls.txt"), urls.join("\n") + "\n");
  console.log(`Found ${urls.length} URLs`);

  const ok = [];
  const failed = [];

  await mapPool(urls, CONCURRENCY, async (url) => {
    try {
      const { text, finalUrl, source, stub } = await fetchPage(url);
      // Prefer catalog URL for path so SPA redirects don't scramble filenames
      let rel = urlToRelPath(url);
      if (rel.endsWith("/.md")) rel = rel.replace(/\/\.md$/, ".md");
      const outAbs = path.join(PAGES, rel);
      ensureDir(path.dirname(outAbs));
      fs.writeFileSync(outAbs, text);
      ok.push({
        url,
        source,
        finalUrl,
        path: rel,
        bytes: Buffer.byteLength(text),
        stub: !!stub,
      });
      process.stdout.write(stub ? "s" : ".");
    } catch (e) {
      failed.push({ url, error: String(e.message || e) });
      process.stdout.write("x");
    }
  });
  process.stdout.write("\n");

  const list = {
    fetchedAt: new Date().toISOString(),
    llmsUrl: LLMS_URL,
    totalUrls: urls.length,
    ok: ok.length,
    failed: failed.length,
    pages: ok.sort((a, b) => a.path.localeCompare(b.path)),
    errors: failed.sort((a, b) => a.url.localeCompare(b.url)),
  };
  fs.writeFileSync(path.join(DOCS, "list.json"), JSON.stringify(list, null, 2));

  console.log(`OK ${ok.length} / ${urls.length}  failed ${failed.length}  stubs=${ok.filter((p) => p.stub).length}`);
  if (failed.length) {
    console.log("Failures (first 20):");
    for (const f of failed.slice(0, 20)) console.log(`  - ${f.url}: ${f.error}`);
  }

  if (ok.length < 10) {
    console.error("Too few pages fetched; aborting");
    process.exit(1);
  }
  if (failed.length > urls.length * 0.35) {
    console.warn("High failure rate; continuing with partial mirror");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
