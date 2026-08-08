#!/usr/bin/env node
/**
 * Build zh-CN machine translations for Modal docs (English source of truth).
 *
 * - Official Modal docs are English-only; we keep EN under docs/pages
 * - Writes cached ZH under docs/zh/pages with content-hash skip
 * - Protects fenced code / inline code / links / HTML tags from translation
 * - Uses public Google gtx endpoint (best-effort; retries + backoff)
 *
 * Env:
 *   TRANSLATE_CONCURRENCY (default 2)
 *   TRANSLATE_LIMIT       (optional max files; for smoke tests)
 *   TRANSLATE_FORCE=1     retranslate all
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EN_ROOT = path.join(ROOT, "docs", "pages");
const ZH_ROOT = path.join(ROOT, "docs", "zh", "pages");
const MANIFEST = path.join(ROOT, "docs", "zh", "manifest.json");
const CONCURRENCY = Math.max(1, Number(process.env.TRANSLATE_CONCURRENCY || 2));
const LIMIT = process.env.TRANSLATE_LIMIT ? Number(process.env.TRANSLATE_LIMIT) : Infinity;
const FORCE = process.env.TRANSLATE_FORCE === "1";
const CHUNK_MAX = Math.max(400, Number(process.env.TRANSLATE_CHUNK || 1200));

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.isFile() && ent.name.endsWith(".md")) acc.push(p);
  }
  return acc;
}

function sha1(s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isHtml(text) {
  const t = String(text).trimStart().slice(0, 200).toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.startsWith("<head");
}

/** Protect non-translatable spans, replace with tokens */
function protectMarkdown(md) {
  const slots = [];
  const put = (raw) => {
    const id = slots.length;
    slots.push(raw);
    return `⟦T${id}⟧`;
  };
  let s = md;
  s = s.replace(/```[\s\S]*?```/g, (m) => put(m));
  s = s.replace(/`[^`\n]+`/g, (m) => put(m));
  s = s.replace(/<\/?[A-Za-z][^>\n]*>/g, (m) => put(m));
  s = s.replace(/https?:\/\/[^\s)>\]]+/g, (m) => put(m));
  return { text: s, slots };
}

function restoreMarkdown(text, slots) {
  return text.replace(/⟦T(\d+)⟧/g, (_, n) => slots[Number(n)] ?? "");
}

async function translateChunk(text, { sl = "en", tl = "zh-CN" } = {}) {
  const q = text.trim();
  if (!q) return text;
  if (!/[A-Za-z]/.test(q)) return text;

  if (encodeURIComponent(q).length > 1800) {
    const mid = Math.floor(q.length / 2);
    let splitAt = q.lastIndexOf("\n", mid);
    if (splitAt < q.length * 0.2) splitAt = mid;
    const a = q.slice(0, splitAt);
    const b = q.slice(splitAt);
    return (
      (await translateChunk(a, { sl, tl })) +
      (a.endsWith("\n") || b.startsWith("\n") ? "" : "\n") +
      (await translateChunk(b, { sl, tl }))
    );
  }

  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
    encodeURIComponent(sl) +
    "&tl=" +
    encodeURIComponent(tl) +
    "&dt=t&q=" +
    encodeURIComponent(q);

  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; modal-docs-mirror/1.0; +https://github.com/xiaoqianran/modal-docs)",
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        await sleep(500 * (attempt + 1) + Math.random() * 200);
        continue;
      }
      const data = await res.json();
      const parts = (data?.[0] || []).map((row) => row?.[0] || "").join("");
      return parts || text;
    } catch (e) {
      lastErr = e;
      await sleep(600 * (attempt + 1));
    }
  }
  throw lastErr || new Error("translate failed");
}

function chunkText(text, maxLen = CHUNK_MAX) {
  if (text.length <= maxLen) return [text];
  const lines = text.split("\n");
  const chunks = [];
  let buf = "";
  for (const line of lines) {
    if (line.length > maxLen) {
      if (buf) {
        chunks.push(buf);
        buf = "";
      }
      for (let i = 0; i < line.length; i += maxLen) {
        chunks.push(line.slice(i, i + maxLen));
      }
      continue;
    }
    if ((buf + "\n" + line).length > maxLen && buf) {
      chunks.push(buf);
      buf = line;
    } else {
      buf = buf ? buf + "\n" + line : line;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

async function translateMarkdown(md) {
  const { text, slots } = protectMarkdown(md);
  const chunks = chunkText(text);
  const out = [];
  for (const c of chunks) {
    out.push(await translateChunk(c));
    await sleep(60);
  }
  let joined = out.join("\n");
  joined = joined.replace(/⟦\s*T\s*(\d+)\s*⟧/g, "⟦T$1⟧");
  return restoreMarkdown(joined, slots);
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

function loadManifest() {
  if (!fs.existsSync(MANIFEST)) return { version: 1, files: {} };
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch {
    return { version: 1, files: {} };
  }
}

async function main() {
  fs.mkdirSync(ZH_ROOT, { recursive: true });
  const manifest = loadManifest();
  const files = walk(EN_ROOT)
    .sort()
    .filter((abs) => {
      const en = fs.readFileSync(abs, "utf8");
      if (isHtml(en)) {
        console.warn(`skip HTML (not markdown): ${path.relative(EN_ROOT, abs)}`);
        return false;
      }
      return true;
    });
  const limited = files.slice(0, LIMIT);
  console.log(
    `EN pages: ${files.length}, translating up to ${limited.length} (concurrency=${CONCURRENCY}, chunk=${CHUNK_MAX})`,
  );

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  await mapPool(limited, CONCURRENCY, async (abs) => {
    const rel = path.relative(EN_ROOT, abs).split(path.sep).join("/");
    const en = fs.readFileSync(abs, "utf8");
    const hash = sha1(en);
    const zhAbs = path.join(ZH_ROOT, rel);
    const prev = manifest.files[rel];

    if (
      !FORCE &&
      prev?.hash === hash &&
      fs.existsSync(zhAbs) &&
      fs.statSync(zhAbs).size > 20 &&
      !isHtml(fs.readFileSync(zhAbs, "utf8"))
    ) {
      skipped++;
      process.stdout.write(".");
      return;
    }

    try {
      const zh = await translateMarkdown(en);
      fs.mkdirSync(path.dirname(zhAbs), { recursive: true });
      const banner =
        "<!-- modal-docs: machine-translated zh-CN from English source -->\n\n";
      fs.writeFileSync(zhAbs, banner + zh);
      manifest.files[rel] = {
        hash,
        translatedAt: new Date().toISOString(),
        bytes: Buffer.byteLength(zh),
      };
      translated++;
      process.stdout.write("+");
    } catch (e) {
      failed++;
      process.stdout.write("x");
      console.error(`\nfail ${rel}: ${e.message || e}`);
      if (!fs.existsSync(zhAbs) || isHtml(fs.readFileSync(zhAbs, "utf8"))) {
        fs.mkdirSync(path.dirname(zhAbs), { recursive: true });
        fs.writeFileSync(
          zhAbs,
          "<!-- modal-docs: translation failed; English fallback -->\n\n" + en,
        );
        manifest.files[rel] = {
          hash,
          translatedAt: new Date().toISOString(),
          bytes: Buffer.byteLength(en),
          fallback: true,
          error: String(e.message || e),
        };
      }
    }
  });

  process.stdout.write("\n");
  manifest.updatedAt = new Date().toISOString();
  manifest.stats = { translated, skipped, failed, total: limited.length };
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(
    `done translated=${translated} skipped=${skipped} failed=${failed} manifest=${MANIFEST}`,
  );
  if (translated + skipped === 0 && failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
