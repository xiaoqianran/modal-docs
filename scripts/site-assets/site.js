
(function () {
  const search = document.getElementById("search");
  const nav = document.getElementById("nav");
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    document.querySelector(".main")?.addEventListener("click", () => {
      sidebar.classList.remove("open");
    });
  }

  if (window.hljs) {
    document.querySelectorAll("pre code").forEach((el) => {
      try { hljs.highlightElement(el); } catch (_) {}
    });
  }

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const block = btn.closest(".code-block");
      const code = block?.querySelector("code")?.innerText || "";
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy"), 1200);
      } catch {
        btn.textContent = "Failed";
        setTimeout(() => (btn.textContent = "Copy"), 1200);
      }
    });
  });

  const tocLinks = [...document.querySelectorAll(".toc a")];
  if (tocLinks.length && "IntersectionObserver" in window) {
    const map = new Map();
    tocLinks.forEach((a) => {
      const id = decodeURIComponent(a.getAttribute("href").slice(1));
      const el = document.getElementById(id);
      if (el) map.set(el, a);
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            tocLinks.forEach((l) => l.classList.remove("active"));
            map.get(e.target)?.classList.add("active");
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] },
    );
    map.forEach((_, el) => io.observe(el));
  }

  if (search && nav) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      nav.querySelectorAll(".nav-top").forEach((top) => {
        let topAny = false;
        top.querySelectorAll("li").forEach((li) => {
          const a = li.querySelector("a");
          const title = (a?.dataset.title || a?.textContent || "").toLowerCase();
          const show = !q || title.includes(q);
          li.classList.toggle("hidden", !show);
          if (show) topAny = true;
        });
        top.classList.toggle("hidden", !topAny);
        if (q && topAny) top.open = true;
        top.querySelectorAll(".nav-group").forEach((g) => {
          const any = [...g.querySelectorAll("li")].some((li) => !li.classList.contains("hidden"));
          g.classList.toggle("hidden", !any);
          if (q && any) g.open = true;
        });
      });
    });
  }
})();
