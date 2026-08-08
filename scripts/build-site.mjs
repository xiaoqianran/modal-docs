#!/usr/bin/env node
// Build a static docs site from docs/pages markdown files into dist/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PAGES_ROOT = path.join(ROOT, "docs", "pages");
const DIST = path.join(ROOT, "dist");
const BASE = process.env.PAGES_BASE || "";

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

function sectionOf(rel) {
  const parts = rel.split("/");
  if (parts[0] === "docs" && parts[1]) {
    const s = parts[1];
    if (s === "guide") return "Guide";
    if (s === "examples") return "Examples";
    if (s === "sdk") {
      if (parts[2] === "go") return "Go SDK";
      if (parts[2] === "js") return "JS SDK";
      if (parts[2] === "py") return "Python SDK";
      return "SDK";
    }
    if (s === "cli") return "CLI";
    if (s === "reference") return "Reference";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return "Other";
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

function layout({ title, body, navHtml, breadcrumb }) {
  return "<!DOCTYPE html>\n" +
`<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${htmlEscape(title)} - Modal Docs Mirror</title>
  <link rel="stylesheet" href="${asset("assets/site.css")}" />
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
      <article class="content prose">
        ${body}
      </article>
      <footer class="page-foot">
        Unofficial mirror for personal/dev use. Content (c) Modal Labs.
      </footer>
    </div>
  </div>
  <script src="${asset("assets/site.js")}"></script>
</body>
</html>`;
}

function buildNav(pages, activeRel) {
  const bySec = new Map();
  for (const p of pages) {
    if (!bySec.has(p.section)) bySec.set(p.section, []);
    bySec.get(p.section).push(p);
  }
  const order = ["Guide", "Examples", "Python SDK", "JS SDK", "Go SDK", "SDK", "CLI", "Reference", "Other"];
  const secs = [...order.filter((s) => bySec.has(s)), ...[...bySec.keys()].filter((s) => !order.includes(s)).sort()];
  let html = "";
  for (const sec of secs) {
    const items = bySec.get(sec).sort((a, b) => a.title.localeCompare(b.title));
    html += `<div class="nav-sec"><div class="nav-sec-title">${htmlEscape(sec)}</div><ul>`;
    for (const it of items) {
      const cls = it.outRel === activeRel ? "active" : "";
      html += `<li><a class="${cls}" href="${asset(it.outRel)}" data-title="${htmlEscape(it.title.toLowerCase())}">${htmlEscape(it.title)}</a></li>`;
    }
    html += `</ul></div>`;
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

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "assets"), { recursive: true });

const mdFiles = walk(PAGES_ROOT);
const pages = [];
for (const abs of mdFiles) {
  const md = fs.readFileSync(abs, "utf8");
  const outRel = relUrl(abs);
  const title = titleFromMd(md, path.basename(abs, ".md"));
  pages.push({
    abs,
    md,
    outRel,
    title,
    section: sectionOf(path.relative(PAGES_ROOT, abs).split(path.sep).join("/")),
  });
}

fs.writeFileSync(path.join(DIST, "assets", "site.css"), fs.readFileSync(path.join(__dirname, "site-assets", "site.css"), "utf8"));
fs.writeFileSync(path.join(DIST, "assets", "site.js"), fs.readFileSync(path.join(__dirname, "site-assets", "site.js"), "utf8"));

if (fs.existsSync(path.join(ROOT, "docs", "llms.txt"))) {
  fs.mkdirSync(path.join(DIST, "meta"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "docs", "llms.txt"), path.join(DIST, "meta", "llms.txt"));
}

for (const p of pages) {
  let body = marked.parse(p.md, { async: false });
  body = rewriteMdLinks(body);
  const html = layout({
    title: p.title,
    body,
    navHtml: buildNav(pages, p.outRel),
    breadcrumb: `<a href="${asset("index.html")}">Home</a> / <span>${htmlEscape(p.section)}</span> / <span>${htmlEscape(p.title)}</span>`,
  });
  const outAbs = path.join(DIST, p.outRel);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  fs.writeFileSync(outAbs, html);
}

const counts = pages.reduce((m, p) => {
  m[p.section] = (m[p.section] || 0) + 1;
  return m;
}, {});
const cards = Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .map(([sec, n]) => {
    const first = pages.find((p) => p.section === sec);
    return `<a class="card" href="${asset(first.outRel)}"><strong>${htmlEscape(sec)}</strong><span>${n} pages</span></a>`;
  })
  .join("\n");

const indexBody = `
  <h1>Modal documentation mirror</h1>
  <p class="lead">Offline-friendly mirror of the official Modal docs (Guide, Examples, Python / JS / Go SDKs, CLI).</p>
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
  <p class="muted">${pages.length} pages indexed</p>
`;

fs.writeFileSync(
  path.join(DIST, "index.html"),
  layout({
    title: "Home",
    body: indexBody,
    navHtml: buildNav(pages, "index.html"),
    breadcrumb: "<span>Home</span>",
  }),
);

fs.writeFileSync(
  path.join(DIST, "404.html"),
  layout({
    title: "Not found",
    body: `<h1>404</h1><p>Page not found. <a href="${asset("index.html")}">Back home</a></p>`,
    navHtml: buildNav(pages, ""),
    breadcrumb: "<span>404</span>",
  }),
);

console.log("Built " + pages.length + " pages -> " + DIST);
