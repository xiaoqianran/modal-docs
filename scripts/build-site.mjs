#!/usr/bin/env node
// Build static Modal docs site with hierarchy + code highlight hooks
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PAGES_ROOT = path.join(ROOT, "docs", "pages");
const DIST = path.join(ROOT, "dist");
const BASE = process.env.PAGES_BASE || "";

// --- marked: keep language classes for highlight.js ---
marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false,
});

const renderer = new marked.Renderer();
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
  return n ? base + "-" + n : base;
}
renderer.heading = function (text, level) {
  // marked v15 may pass token object
  if (typeof text === "object" && text !== null) {
    level = text.depth;
    text = this.parser.parseInline(text.tokens);
  }
  const id = slugify(text.replace(/<[^>]+>/g, ""));
  return `<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${text}</h${level}>\n`;
};
renderer.code = function (code, infostring) {
  // marked v15 token form
  let lang = "";
  let text = code;
  if (typeof code === "object" && code !== null) {
    lang = (code.lang || "").trim();
    text = code.text;
  } else {
    lang = (infostring || "").trim();
  }
  // Modal docs often use "python notest" / "javascript notest" / "python fixture:..."
  lang = (lang.split(/\s+/)[0] || "").toLowerCase();
  const aliases = { js: "javascript", ts: "typescript", sh: "bash", shell: "bash", yml: "yaml", console: "bash", text: "" };
  if (aliases[lang] !== undefined) lang = aliases[lang];
  const cls = lang ? `language-${lang}` : "";
  const langLabel = lang || "text";
  const escaped = text
    .replaceAll("\u0026", "\u0026amp;")
    .replaceAll("\u003c", "\u0026lt;")
    .replaceAll("\u003e", "\u0026gt;");
  return `<div class="code-block" data-lang="${langLabel}"><div class="code-bar"><span>${langLabel}</span><button type="button" class="copy-btn" data-copy>Copy</button></div><pre><code class="${cls}">${escaped}</code></pre></div>\n`;
};
marked.use({ renderer });

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.isFile() && ent.name.endsWith(".md")) acc.push(p);
  }
  return acc;
}

function relUrl(fromAbs) {
  let rel = path.relative(PAGES_ROOT, fromAbs).split(path.sep).join("/");
  if (rel.endsWith(".md")) rel = rel.slice(0, -3) + ".html";
  return rel;
}

function titleFromMd(md, fallback) {
  const m = md.match(/^#\s+(.+)$/m);
  if (m) return m[1].replace(/[`*]/g, "").trim();
  return fallback;
}

function sectionMeta(rel) {
  // rel like docs/guide/apps.html or docs/sdk/go/latest/Client.html
  const parts = rel.replace(/\.html$/, "").split("/");
  // strip leading docs
  const segs = parts[0] === "docs" ? parts.slice(1) : parts;
  let top = "Other";
  let group = "";
  if (segs[0] === "guide") {
    top = "Guide";
    group = segs.length > 2 ? segs[1] : "Overview";
  } else if (segs[0] === "examples") {
    top = "Examples";
    group = segs.length > 2 ? segs[1] : "All";
  } else if (segs[0] === "sdk") {
    if (segs[1] === "go") top = "Go SDK";
    else if (segs[1] === "js") top = "JS SDK";
    else if (segs[1] === "py") top = "Python SDK";
    else top = "SDK";
    group = segs.includes("latest") ? "API Reference" : segs[2] || "Docs";
  } else if (segs[0] === "cli") {
    top = "CLI";
    group = segs[1] === "latest" ? "Commands" : segs[1] || "Docs";
  } else if (segs[0] === "reference") {
    top = "Reference";
    group = segs[1] || "Docs";
  } else if (segs.length === 1) {
    top = "Root";
    group = "Pages";
  }
  return { top, group, segs };
}

function htmlEscape(s) {
  return String(s)
    .replaceAll("\u0026", "\u0026amp;")
    .replaceAll("\u003c", "\u0026lt;")
    .replaceAll("\u003e", "\u0026gt;")
    .replaceAll("\u0022", "\u0026quot;");
}

function asset(p) {
  const base = (BASE || "").replace(/\/$/, "");
  const rel = String(p).replace(/^\//, "");
  return base ? base + "/" + rel : rel;
}

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
  html += `</ul></nav>`;
  return html;
}

function layout({ title, body, navHtml, breadcrumb, toc }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${htmlEscape(title)} - Modal Docs Mirror</title>
  <link rel="stylesheet" href="${asset("assets/site.css")}" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.11.1/styles/github-dark.min.css" />
</head>
<body>
  <div class="shell">
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <a href="${asset("index.html")}">Modal Docs</a>
        <span class="badge">mirror</span>
      </div>
      <input class="search" id="search" type="search" placeholder="Filter pages..." autocomplete="off" />
      <nav class="nav" id="nav">${navHtml}</nav>
      <footer class="side-foot">
        <a href="https://modal.com/docs" target="_blank" rel="noopener">Official docs</a>
      </footer>
    </aside>
    <div class="main">
      <header class="top">
        <button type="button" class="menu-btn" id="menuBtn" aria-label="Menu">Menu</button>
        <div class="crumb">${breadcrumb}</div>
      </header>
      <div class="content-wrap">
        <article class="content prose">
          ${body}
        </article>
        ${toc || ""}
      </div>
      <footer class="page-foot">
        Unofficial mirror for personal/dev use. Content (c) Modal Labs.
      </footer>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/highlight.min.js"></script>
  <script src="${asset("assets/site.js")}"></script>
</body>
</html>`;
}

function buildNavTree(pages, activeRel) {
  // top -> group -> pages
  const tree = new Map();
  for (const p of pages) {
    if (!tree.has(p.top)) tree.set(p.top, new Map());
    const g = tree.get(p.top);
    if (!g.has(p.group)) g.set(p.group, []);
    g.get(p.group).push(p);
  }
  const topOrder = [
    "Guide",
    "Examples",
    "Python SDK",
    "JS SDK",
    "Go SDK",
    "CLI",
    "Reference",
    "SDK",
    "Root",
    "Other",
  ];
  const tops = [
    ...topOrder.filter((t) => tree.has(t)),
    ...[...tree.keys()].filter((t) => !topOrder.includes(t)).sort(),
  ];

  let html = "";
  for (const top of tops) {
    const groups = tree.get(top);
    const topActive = [...groups.values()].some((arr) =>
      arr.some((p) => p.outRel === activeRel),
    );
    const open = topActive ? " open" : "";
    const count = [...groups.values()].reduce((n, a) => n + a.length, 0);
    html += `<details class="nav-top" data-top="${htmlEscape(top)}"${open ? " open" : ""}>`;
    html += `<summary><span class="nav-top-label">${htmlEscape(top)}</span><span class="nav-count">${count}</span></summary>`;
    html += `<div class="nav-top-body">`;

    const groupNames = [...groups.keys()].sort((a, b) => {
      if (a === "API Reference") return -1;
      if (b === "API Reference") return 1;
      if (a === "Overview" || a === "All") return -1;
      if (b === "Overview" || b === "All") return 1;
      return a.localeCompare(b);
    });

    for (const gName of groupNames) {
      const items = groups.get(gName).sort((a, b) => a.title.localeCompare(b.title));
      // If only one flat group for whole top and name is generic, skip subgroup label
      const showGroup = !(groups.size === 1 && ["Overview", "All", "Pages", "Docs", "Commands"].includes(gName));
      if (showGroup) {
        const gActive = items.some((p) => p.outRel === activeRel);
        html += `<details class="nav-group"${gActive ? " open" : ""}><summary>${htmlEscape(gName)}</summary><ul>`;
      } else {
        html += `<ul>`;
      }
      for (const it of items) {
        const cls = it.outRel === activeRel ? "active" : "";
        html += `<li><a class="${cls}" href="${asset(it.outRel)}" data-title="${htmlEscape(it.title.toLowerCase())}" data-top="${htmlEscape(top)}">${htmlEscape(it.title)}</a></li>`;
      }
      html += showGroup ? `</ul></details>` : `</ul>`;
    }
    html += `</div></details>`;
  }
  return html;
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

// --- build ---
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });

const mdFiles = walk(PAGES_ROOT);
const pages = [];
for (const abs of mdFiles) {
  const md = fs.readFileSync(abs, "utf8");
  const outRel = relUrl(abs);
  const title = titleFromMd(md, path.basename(abs, ".md"));
  const meta = sectionMeta(outRel);
  pages.push({
    abs,
    md,
    outRel,
    title,
    top: meta.top,
    group: meta.group,
    segs: meta.segs,
  });
}

fs.writeFileSync(path.join(DIST, "assets", "site.css"), fs.readFileSync(path.join(__dirname, "site-assets", "site.css"), "utf8"));
fs.writeFileSync(path.join(DIST, "assets", "site.js"), fs.readFileSync(path.join(__dirname, "site-assets", "site.js"), "utf8"));

if (fs.existsSync(path.join(ROOT, "docs", "llms.txt"))) {
  fs.mkdirSync(path.join(DIST, "meta"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "docs", "llms.txt"), path.join(DIST, "meta", "llms.txt"));
}

for (const p of pages) {
  slugCount.clear();
  let body = marked.parse(p.md, { async: false });
  body = rewriteMdLinks(body);
  const toc = tocHtml(extractToc(p.md));
  const html = layout({
    title: p.title,
    body,
    navHtml: buildNavTree(pages, p.outRel),
    breadcrumb: `<a href="${asset("index.html")}">Home</a> <span class="sep">/</span> <span>${htmlEscape(p.top)}</span> <span class="sep">/</span> <span>${htmlEscape(p.group)}</span> <span class="sep">/</span> <span>${htmlEscape(p.title)}</span>`,
    toc,
  });
  const outAbs = path.join(DIST, p.outRel);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, html);
}

const counts = pages.reduce((m, p) => {
  m[p.top] = (m[p.top] || 0) + 1;
  return m;
}, {});
const cards = Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .map(([sec, n]) => {
    const first = pages.find((p) => p.top === sec);
    return `<a class="card" href="${asset(first.outRel)}"><strong>${htmlEscape(sec)}</strong><span>${n} pages</span></a>`;
  })
  .join("\n");

const indexBody = `
  <h1>Modal documentation mirror</h1>
  <p class="lead">Structured mirror of official Modal docs with syntax highlighting, hierarchical navigation, and per-page outlines.</p>
  <p><a class="btn" href="https://modal.com/docs" target="_blank" rel="noopener">Official docs</a>
     <a class="btn ghost" href="${asset("meta/llms.txt")}">llms.txt</a></p>
  <h2>Browse by section</h2>
  <div class="cards">${cards}</div>
  <h2>Quick links</h2>
  <ul>
    <li><a href="${asset("docs/guide/sdk-javascript-go.html")}">JavaScript / Go SDKs (Beta)</a></li>
    <li><a href="${asset("docs/sdk/go/latest/intro.html")}">Go SDK Reference</a></li>
    <li><a href="${asset("docs/sdk/js/latest/intro.html")}">JS SDK Reference</a></li>
    <li><a href="${asset("docs/sdk/py/latest/intro.html")}">Python SDK Reference</a></li>
    <li><a href="${asset("docs/guide/sandboxes.html")}">Sandboxes</a></li>
  </ul>
  <p class="muted">${pages.length} pages</p>
`;

fs.writeFileSync(
  path.join(DIST, "index.html"),
  layout({
    title: "Home",
    body: indexBody,
    navHtml: buildNavTree(pages, "index.html"),
    breadcrumb: "<span>Home</span>",
    toc: "",
  }),
);

fs.writeFileSync(
  path.join(DIST, "404.html"),
  layout({
    title: "Not found",
    body: `<h1>404</h1><p>Page not found. <a href="${asset("index.html")}">Back home</a></p>`,
    navHtml: buildNavTree(pages, ""),
    breadcrumb: "<span>404</span>",
    toc: "",
  }),
);

console.log("Built " + pages.length + " pages -> " + DIST);
