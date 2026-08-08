#!/usr/bin/env node
// Modal docs static site — learning-vue3-style multi-open accordion nav
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PAGES_ROOT = path.join(ROOT, "docs", "pages");
const DIST = path.join(ROOT, "dist");
const BASE = (process.env.PAGES_BASE || "").replace(/\/$/, "");
const LLMS = path.join(ROOT, "docs", "llms.txt");

const CHEV_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';

const TRACK_ORDER = ["Guide", "Examples", "Python SDK", "JS SDK", "Go SDK", "CLI", "Reference", "Other"];
const TRACK_BADGE = {
  Guide: "①",
  Examples: "②",
  "Python SDK": "③",
  "JS SDK": "④",
  "Go SDK": "⑤",
  CLI: "⑥",
  Reference: "⑦",
  Other: "·",
};

function asset(p) {
  const rel = String(p).replace(/^\//, "");
  // Always absolute from site root so nested pages resolve assets correctly
  // (e.g. /docs/guide/foo.html must not request /docs/guide/assets/...)
  return BASE ? `${BASE}/${rel}` : `/${rel}`;
}
function htmlEscape(s) {
  return String(s)
    .replaceAll("\u0026", "\u0026amp;")
    .replaceAll("\u003c", "\u0026lt;")
    .replaceAll("\u003e", "\u0026gt;")
    .replaceAll("\u0022", "\u0026quot;");
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.isFile() && ent.name.endsWith(".md")) acc.push(p);
  }
  return acc;
}

function urlToOutRel(url) {
  let u = url.trim().replace(/[),.\s]+$/, "");
  u = u.replace(/^https?:\/\/modal\.com\//, "");
  if (u.endsWith(".md")) u = u.slice(0, -3);
  if (u.endsWith("/")) u = u.slice(0, -1);
  return u + ".html";
}

function titleFromMd(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].replace(/[`*]/g, "").trim() : fallback;
}

/** Parse llms.txt into tracks -> groups -> links */
function parseLlms(text) {
  const tracks = [];
  let track = null;
  let group = null;
  let inReference = false;

  function ensureGroup(name) {
    if (!track) return null;
    let g = track.groups.find((x) => x.name === name);
    if (!g) {
      g = { name, items: [] };
      track.groups.push(g);
    }
    return g;
  }

  function startTrack(name) {
    track = { name, groups: [] };
    tracks.push(track);
    group = null;
  }

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\t/g, "  ");
    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2) {
      const name = h2[1].trim();
      inReference = /^reference$/i.test(name);
      if (inReference) {
        track = null;
        group = null;
        continue;
      }
      startTrack(name);
      continue;
    }

    const topLink = /^- \[([^\]]+)\]\((https:\/\/modal\.com\/[^)]+)\)\s*$/.exec(line);
    if (topLink) {
      const title = topLink[1].replace(/[`]/g, "").trim();
      const url = topLink[2];
      let j = i + 1;
      let hasKids = false;
      while (j < lines.length) {
        const n = lines[j];
        if (/^  - /.test(n)) {
          hasKids = true;
          break;
        }
        if (/^- /.test(n) || /^## /.test(n)) break;
        if (n.trim() === "") {
          j++;
          continue;
        }
        break;
      }

      if (inReference) {
        startTrack(title);
        // SDK/CLI: flat list under track (no "API" group friction)
        group = ensureGroup("");
        group.items.push({
          title: title.includes("CLI") ? "CLI intro" : "Introduction",
          url,
        });
        continue;
      }

      if (hasKids) {
        group = ensureGroup(title);
        group.items.push({ title: "Introduction", url });
      } else {
        // top-level pages stay in "Start here" (not a dump "Overview")
        group = ensureGroup("Start here");
        group.items.push({ title, url });
      }
      continue;
    }

    const groupHead = /^- ([^\[][^\n]*?)\s*$/.exec(line);
    if (groupHead && !line.includes("](")) {
      if (!track && inReference) startTrack("Reference");
      group = ensureGroup(groupHead[1].trim());
      continue;
    }

    const nest = /^  - \[([^\]]+)\]\((https:\/\/modal\.com\/[^)]+)\)\s*$/.exec(line);
    if (nest) {
      if (!track && inReference) startTrack("Reference");
      if (!group) group = ensureGroup(inReference ? "" : "Start here");
      const title = nest[1].replace(/[`]/g, "").trim();
      group.items.push({ title, url: nest[2] });
      continue;
    }
  }
  return tracks;
}

// --- marked renderers ---
const slugCount = new Map();
function slugify(text) {
  const base = String(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const n = slugCount.get(base) || 0;
  slugCount.set(base, n + 1);
  return n ? `${base}-${n}` : base;
}

const renderer = new marked.Renderer();
renderer.heading = function (text, level) {
  if (typeof text === "object" && text !== null) {
    level = text.depth;
    text = this.parser.parseInline(text.tokens);
  }
  const id = slugify(String(text).replace(/<[^>]+>/g, ""));
  return `<h${level} id="${id}"><a class="anchor" href="#${id}">#</a>${text}</h${level}>\n`;
};
renderer.code = function (code, infostring) {
  let lang = "";
  let text = code;
  if (typeof code === "object" && code !== null) {
    lang = (code.lang || "").trim();
    text = code.text;
  } else {
    lang = (infostring || "").trim();
  }
  lang = (lang.split(/\s+/)[0] || "").toLowerCase();
  const aliases = {
    js: "javascript",
    ts: "typescript",
    sh: "bash",
    shell: "bash",
    yml: "yaml",
    console: "bash",
  };
  if (aliases[lang]) lang = aliases[lang];
  const cls = lang ? `language-${lang}` : "";
  const label = lang || "text";
  const escaped = String(text)
    .replaceAll("\u0026", "\u0026amp;")
    .replaceAll("\u003c", "\u0026lt;")
    .replaceAll("\u003e", "\u0026gt;");
  return `<div class="code-block" data-lang="${label}">
  <div class="code-bar">
    <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="lang">${label}</span>
    <button type="button" class="copy-btn" data-copy>Copy</button>
  </div>
  <pre><code class="${cls}">${escaped}</code></pre>
</div>\n`;
};
marked.use({ renderer, gfm: true });

function extractToc(md) {
  const toc = [];
  for (const line of md.split("\n")) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].replace(/[`*_]/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    toc.push({ level, text, id });
  }
  return toc;
}

function tocHtml(toc) {
  if (!toc.length) return "";
  let html = `<nav class="toc"><div class="toc-title">On this page</div><ul>`;
  for (const t of toc) {
    html += `<li class="l${t.level}"><a href="#${t.id}">${htmlEscape(t.text)}</a></li>`;
  }
  return html + `</ul></nav>`;
}

function rewriteMdLinks(html) {
  return html.replace(
    /href="(https:\/\/modal\.com\/)?([^"#?]+\.md)(#[^"]*)?"/g,
    (full, host, mdPath, hash = "") => {
      let p = mdPath;
      if (p.startsWith("/docs/")) p = "docs/" + p.slice("/docs/".length);
      const htmlPath = p.replace(/\.md$/, ".html");
      if (host || p.startsWith("docs/")) return `href="${asset(htmlPath)}${hash || ""}"`;
      return `href="${htmlPath}${hash || ""}"`;
    },
  );
}

function loadPages() {
  const map = new Map();
  for (const abs of walk(PAGES_ROOT)) {
    const md = fs.readFileSync(abs, "utf8");
    let outRel = path.relative(PAGES_ROOT, abs).split(path.sep).join("/");
    if (outRel.endsWith(".md")) outRel = outRel.slice(0, -3) + ".html";
    const title = titleFromMd(md, path.basename(abs, ".md"));
    map.set(outRel, { abs, md, outRel, title });
  }
  return map;
}

function resolvePage(pageMap, outRel) {
  let page = pageMap.get(outRel);
  if (!page && outRel.endsWith("/index.html")) {
    page = pageMap.get(outRel.replace(/\/index\.html$/, ".html"));
  }
  if (!page) {
    page = pageMap.get(outRel.replace(/\.html$/, "/index.html"));
  }
  if (!page) {
    const base = outRel.replace(/\.html$/, "");
    for (const [k, v] of pageMap) {
      if (k.replace(/\.html$/, "") === base) {
        page = v;
        break;
      }
    }
  }
  return page || null;
}

/**
 * Build nav tree from llms + leftover pages
 * tracks: [{ id, label, groups: [{ name, items }] }]
 */
function buildNavModel(pageMap, llmsTracks) {
  const used = new Set();
  const tracks = [];

  const rename = {
    Guide: "Guide",
    Examples: "Examples",
    "Python SDK": "Python SDK",
    "JavaScript/TypeScript SDK": "JS SDK",
    "JS SDK": "JS SDK",
    "Go SDK": "Go SDK",
    CLI: "CLI",
    Reference: "Reference",
  };

  for (const t of llmsTracks) {
    let label = rename[t.name] || t.name;
    if (/python/i.test(t.name) && /sdk/i.test(t.name)) label = "Python SDK";
    if (/javascript|typescript|js\b/i.test(t.name) && /sdk/i.test(t.name)) label = "JS SDK";
    if (/^go\b/i.test(t.name) && /sdk/i.test(t.name)) label = "Go SDK";
    if (/^cli$/i.test(t.name) || (/cli/i.test(t.name) && !/sdk/i.test(t.name))) label = "CLI";

    const groups = [];
    for (const g of t.groups) {
      const items = [];
      for (const it of g.items) {
        const outRel = urlToOutRel(it.url);
        const page = resolvePage(pageMap, outRel);
        if (!page) continue;
        used.add(page.outRel);
        items.push({
          title: it.title || page.title,
          href: asset(page.outRel),
          outRel: page.outRel,
          search: `${it.title} ${page.title}`.toLowerCase(),
        });
      }
      if (items.length) groups.push({ name: g.name, items });
    }
    if (groups.length) {
      tracks.push({
        id: label.toLowerCase().replace(/\s+/g, "-"),
        label,
        groups,
      });
    }
  }

  const leftoverBuckets = {
    guide: [],
    examples: [],
    "sdk/py": [],
    "sdk/js": [],
    "sdk/go": [],
    cli: [],
    other: [],
  };
  for (const [outRel, page] of pageMap) {
    if (used.has(outRel)) continue;
    const key = outRel.replace(/^docs\//, "");
    if (key.startsWith("guide/") || key === "guide.html") leftoverBuckets.guide.push(page);
    else if (key.startsWith("examples")) leftoverBuckets.examples.push(page);
    else if (key.startsWith("sdk/py")) leftoverBuckets["sdk/py"].push(page);
    else if (key.startsWith("sdk/js")) leftoverBuckets["sdk/js"].push(page);
    else if (key.startsWith("sdk/go")) leftoverBuckets["sdk/go"].push(page);
    else if (key.startsWith("cli")) leftoverBuckets.cli.push(page);
    else leftoverBuckets.other.push(page);
  }

  function mergeLeftover(trackLabel, pages) {
    if (!pages.length) return;
    let track = tracks.find((t) => t.label === trackLabel);
    if (!track) {
      track = {
        id: trackLabel.toLowerCase().replace(/\s+/g, "-"),
        label: trackLabel,
        groups: [],
      };
      tracks.push(track);
    }
    const items = pages
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((p) => ({
        title: p.title,
        href: asset(p.outRel),
        outRel: p.outRel,
        search: p.title.toLowerCase(),
      }));
    // for SDK leftovers, append into the flat "" group if present
    const flat = track.groups.find((g) => g.name === "");
    if (flat && ["Python SDK", "JS SDK", "Go SDK", "CLI"].includes(trackLabel)) {
      flat.items.push(...items);
    } else {
      track.groups.push({ name: "More", items });
    }
  }

  mergeLeftover("Guide", leftoverBuckets.guide);
  mergeLeftover("Examples", leftoverBuckets.examples);
  mergeLeftover("Python SDK", leftoverBuckets["sdk/py"]);
  mergeLeftover("JS SDK", leftoverBuckets["sdk/js"]);
  mergeLeftover("Go SDK", leftoverBuckets["sdk/go"]);
  mergeLeftover("CLI", leftoverBuckets.cli);
  mergeLeftover("Other", leftoverBuckets.other);

  tracks.sort((a, b) => {
    const ia = TRACK_ORDER.indexOf(a.label);
    const ib = TRACK_ORDER.indexOf(b.label);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return tracks;
}

function findActivePath(tracks, activeRel) {
  for (const t of tracks) {
    for (const g of t.groups) {
      for (const it of g.items) {
        if (it.outRel === activeRel) {
          return { trackId: t.id, group: g.name, outRel: activeRel };
        }
      }
    }
  }
  return { trackId: tracks[0]?.id || "", group: "", outRel: activeRel };
}

function renderLeafList(items, active, trackId, groupName, startIdx) {
  let html = `<ul class="leaf-list">`;
  let idx = startIdx;
  for (const it of items) {
    idx += 1;
    const activeCls = it.outRel === active.outRel ? " active" : "";
    html += `<li>`;
    html += `<a class="leaf${activeCls}" href="${it.href}" data-out="${htmlEscape(it.outRel)}" data-search="${htmlEscape(it.search)}" data-track="${htmlEscape(trackId)}" data-group="${htmlEscape(groupName)}" data-lesson-slug="${htmlEscape(it.outRel)}">`;
    html += `<span class="num">${idx}</span>`;
    html += `<span class="leaf-title">${htmlEscape(it.title)}</span>`;
    html += `</a></li>`;
  }
  html += `</ul>`;
  return { html, nextIdx: idx };
}

function renderNav(tracks, active) {
  let html = "";
  for (const t of tracks) {
    const count = t.groups.reduce((n, g) => n + g.items.length, 0);
    const isActiveTrack = t.id === active.trackId;
    // SSR: open active track fully; others closed (JS restores multi-open from session)
    const badge = TRACK_BADGE[t.label] || "·";
    const label = `${badge} ${t.label}`;

    html += `<section class="track" data-track="${htmlEscape(t.id)}" data-open="${isActiveTrack ? "1" : "0"}"${isActiveTrack ? ' data-active="1"' : ""}>`;
    html += `<button type="button" class="track-btn" data-track-toggle="${htmlEscape(t.id)}" aria-expanded="${isActiveTrack}">`;
    html += `<span class="chev" aria-hidden="true">${CHEV_SVG}</span>`;
    html += `<span class="track-label">${htmlEscape(label)}</span>`;
    html += `<span class="track-count">${count}</span>`;
    html += `</button>`;
    html += `<div class="track-panel"><div class="track-panel-inner"><div class="track-body">`;

    let localIdx = 0;
    // If only one unnamed/API-like group → flat list (vue3 style)
    const onlyFlat =
      t.groups.length === 1 &&
      ["", "API", "Overview", "More", "All", "Start here"].includes(t.groups[0].name) &&
      (t.groups[0].name === "" ||
        ["Python SDK", "JS SDK", "Go SDK", "CLI"].includes(t.label) ||
        t.groups[0].items.length <= 6);

    if (onlyFlat) {
      const r = renderLeafList(t.groups[0].items, active, t.id, t.groups[0].name, localIdx);
      html += r.html;
    } else {
      for (const g of t.groups) {
        const hideHeader =
          !g.name ||
          (t.groups.length === 1 && ["Overview", "More", "All", "API"].includes(g.name));

        if (hideHeader) {
          const r = renderLeafList(g.items, active, t.id, g.name, localIdx);
          html += r.html;
          localIdx = r.nextIdx;
          continue;
        }

        // Active track: open ALL groups (browse-friendly). Others: open none until expanded.
        const gOpen = isActiveTrack;
        html += `<div class="group" data-group="${htmlEscape(g.name)}" data-open="${gOpen ? "1" : "0"}">`;
        html += `<button type="button" class="group-btn" data-group-toggle aria-expanded="${gOpen}">`;
        html += `<span class="chev" aria-hidden="true">${CHEV_SVG}</span>`;
        html += `<span class="group-name">${htmlEscape(g.name)}</span>`;
        html += `<span class="group-count">${g.items.length}</span>`;
        html += `</button>`;
        html += `<div class="group-panel"><div class="group-panel-inner">`;
        const r = renderLeafList(g.items, active, t.id, g.name, localIdx);
        html += r.html;
        localIdx = r.nextIdx;
        html += `</div></div></div>`;
      }
    }

    html += `</div></div></div></section>`;
  }
  return html;
}

function layout({ title, body, navHtml, breadcrumb, toc, activeTrack }) {
  const chips = ["Guide", "Examples", "Python SDK", "JS SDK", "Go SDK", "CLI"]
    .map((label) => {
      const id = label.toLowerCase().replace(/\s+/g, "-");
      const cls = activeTrack === id ? "chip active" : "chip";
      return `<button type="button" class="${cls}" data-jump-track="${id}">${htmlEscape(label)}</button>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${htmlEscape(title)} · Modal Docs</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${asset("assets/site.css")}" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/styles/github-dark.min.css" />
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <button type="button" class="menu-btn" id="menuBtn" aria-label="Menu">Menu</button>
      <a class="brand" href="${asset("index.html")}">
        <span class="brand-mark">M</span>
        <span class="brand-text">Modal Docs</span>
        <span class="brand-v">mirror</span>
      </a>
      <div class="chips" id="chips">${chips}</div>
      <a class="top-link" href="https://modal.com/docs" target="_blank" rel="noopener">Official ↗</a>
    </div>
  </header>

  <div class="shell">
    <aside class="sidebar" id="sidebar">
      <div class="side-head">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input class="search" id="search" type="search" placeholder="Search docs…" autocomplete="off" />
        </div>
        <p class="side-label">学习路径 · Docs</p>
      </div>
      <nav class="nav" id="nav">${navHtml}</nav>
      <div class="side-foot">llms.txt hierarchy · accordion like learning-vue3</div>
    </aside>
    <button type="button" class="backdrop" id="backdrop" aria-label="Close menu"></button>

    <div class="main">
      <div class="crumb">${breadcrumb}</div>
      <div class="content-wrap">
        <article class="content prose">${body}</article>
        ${toc || ""}
      </div>
      <footer class="page-foot">Unofficial mirror for personal/dev use. Content © Modal Labs.</footer>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/highlight.min.js"></script>
  <script src="${asset("assets/site.js")}"></script>
</body>
</html>`;
}

// -------- build --------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });

const pageMap = loadPages();
const llmsText = fs.existsSync(LLMS) ? fs.readFileSync(LLMS, "utf8") : "";
const llmsTracks = parseLlms(llmsText);
const navTracks = buildNavModel(pageMap, llmsTracks);

fs.writeFileSync(path.join(DIST, "assets", "nav.json"), JSON.stringify(navTracks, null, 2));
fs.writeFileSync(
  path.join(DIST, "assets", "site.css"),
  fs.readFileSync(path.join(__dirname, "site-assets", "site.css"), "utf8"),
);
fs.writeFileSync(
  path.join(DIST, "assets", "site.js"),
  fs.readFileSync(path.join(__dirname, "site-assets", "site.js"), "utf8"),
);
if (llmsText) {
  fs.mkdirSync(path.join(DIST, "meta"), { recursive: true });
  fs.writeFileSync(path.join(DIST, "meta", "llms.txt"), llmsText);
}

for (const page of pageMap.values()) {
  slugCount.clear();
  let body = marked.parse(page.md, { async: false });
  body = rewriteMdLinks(body);
  const active = findActivePath(navTracks, page.outRel);
  const navHtml = renderNav(navTracks, active);
  const toc = tocHtml(extractToc(page.md));
  const track = navTracks.find((t) => t.id === active.trackId);
  const groupName = active.group;
  const crumb = [
    `<a href="${asset("index.html")}">Home</a>`,
    track ? `<span class="sep">/</span><span class="pill">${htmlEscape(track.label)}</span>` : "",
    groupName && groupName !== "Start here" && groupName !== "" && groupName !== "API"
      ? `<span class="sep">/</span><span>${htmlEscape(groupName)}</span>`
      : "",
    `<span class="sep">/</span><span class="current">${htmlEscape(page.title)}</span>`,
  ].join("");

  const html = layout({
    title: page.title,
    body,
    navHtml,
    breadcrumb: crumb,
    toc,
    activeTrack: active.trackId,
  });
  const outAbs = path.join(DIST, page.outRel);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, html);
}

// index
const counts = navTracks.map((t) => ({
  label: t.label,
  id: t.id,
  n: t.groups.reduce((n, g) => n + g.items.length, 0),
  href: t.groups[0]?.items[0]?.href || asset("index.html"),
}));
const cards = counts
  .map(
    (c) =>
      `<a class="card" href="${c.href}"><strong>${htmlEscape((TRACK_BADGE[c.label] || "·") + " " + c.label)}</strong><span>${c.n} pages</span></a>`,
  )
  .join("\n");

const indexActive = { trackId: "guide", group: "", outRel: "index.html" };
const indexBody = `
  <h1>Modal documentation</h1>
  <p class="lead">Official Modal docs mirror. Left nav follows <code>llms.txt</code> with a learning-vue3 style path accordion — expand multiple tracks, browse groups, jump to any page.</p>
  <p>
    <a class="btn" href="https://modal.com/docs" target="_blank" rel="noopener">Official docs</a>
    <a class="btn ghost" href="${asset("meta/llms.txt")}">llms.txt</a>
  </p>
  <h2>Tracks</h2>
  <div class="cards">${cards}</div>
  <h2>Start here</h2>
  <ul>
    <li><a href="${asset("docs/guide.html")}">Guide · Introduction</a></li>
    <li><a href="${asset("docs/sdk/go/latest/intro.html")}">Go SDK</a></li>
    <li><a href="${asset("docs/sdk/js/latest/intro.html")}">JS SDK</a></li>
    <li><a href="${asset("docs/sdk/py/latest/intro.html")}">Python SDK</a></li>
    <li><a href="${asset("docs/guide/sandboxes.html")}">Sandboxes</a></li>
  </ul>
  <p class="muted">${pageMap.size} pages · hierarchy synced to Modal llms.txt</p>
`;

fs.writeFileSync(
  path.join(DIST, "index.html"),
  layout({
    title: "Home",
    body: indexBody,
    navHtml: renderNav(navTracks, indexActive),
    breadcrumb: `<span class="current">Home</span>`,
    toc: "",
    activeTrack: "guide",
  }),
);

fs.writeFileSync(
  path.join(DIST, "404.html"),
  layout({
    title: "Not found",
    body: `<h1>Page not found</h1><p><a class="btn" href="${asset("index.html")}">Back home</a></p>`,
    navHtml: renderNav(navTracks, indexActive),
    breadcrumb: `<span class="current">404</span>`,
    toc: "",
    activeTrack: "",
  }),
);

const summary = navTracks
  .map((t) => `${t.label}:${t.groups.reduce((n, g) => n + g.items.length, 0)}`)
  .join(" · ");
console.log(`Built ${pageMap.size} pages, ${navTracks.length} tracks — ${summary}`);
