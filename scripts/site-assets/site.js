/**
 * Modal docs nav — learning-vue3 style:
 * - multi-open tracks (independent expand)
 * - groups open independently; active path expanded on load
 * - smooth grid expand + scroll-to-active
 * - search expands matching tracks/groups
 */
(function () {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const search = document.getElementById("search");
  const nav = document.getElementById("nav");
  const backdrop = document.getElementById("backdrop");
  const STORE_KEY = "modal-docs-nav-v2";

  function loadState() {
    try {
      return JSON.parse(sessionStorage.getItem(STORE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }
  function saveState(state) {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  function setTrackOpen(trackEl, open) {
    trackEl.dataset.open = open ? "1" : "0";
    const btn = trackEl.querySelector(":scope > [data-track-toggle]");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function setGroupOpen(groupEl, open) {
    groupEl.dataset.open = open ? "1" : "0";
    const btn = groupEl.querySelector(":scope > .group-btn");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function persistFromDom() {
    if (!nav) return;
    const tracks = {};
    const groups = {};
    nav.querySelectorAll(".track").forEach((t) => {
      const id = t.dataset.track;
      if (!id) return;
      tracks[id] = t.dataset.open === "1";
      t.querySelectorAll(":scope .group").forEach((g) => {
        const gName = g.dataset.group;
        if (gName) groups[`${id}::${gName}`] = g.dataset.open === "1";
      });
    });
    saveState({ tracks, groups });
  }

  // ---- track toggles (independent, like learning-vue3) ----
  nav?.querySelectorAll("[data-track-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-track-toggle");
      const track = nav.querySelector(`.track[data-track="${CSS.escape(id)}"]`);
      if (!track) return;
      const willOpen = track.dataset.open !== "1";
      setTrackOpen(track, willOpen);
      if (willOpen) {
        // open all groups in this track for browse-friendly path (vue3 shows full list)
        track.querySelectorAll(":scope .group").forEach((g) => setGroupOpen(g, true));
        requestAnimationFrame(() => {
          track.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      }
      persistFromDom();
      syncChips(id, willOpen);
    });
  });

  // ---- group toggles (independent) ----
  nav?.querySelectorAll(".group-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const g = btn.closest(".group");
      if (!g) return;
      setGroupOpen(g, g.dataset.open !== "1");
      persistFromDom();
    });
  });

  function syncChips(activeId, isOpen) {
    document.querySelectorAll(".chip").forEach((c) => {
      const id = c.getAttribute("data-jump-track");
      c.classList.toggle("active", isOpen && id === activeId);
    });
  }

  // ---- initial expand: active leaf path + session restore ----
  const active = nav?.querySelector(".leaf.active");
  const stored = loadState();

  if (active) {
    const track = active.closest(".track");
    const group = active.closest(".group");
    // mark active track for style
    track?.setAttribute("data-active", "1");

    // open active track
    if (track) setTrackOpen(track, true);

    // restore other tracks from session (multi-open)
    nav?.querySelectorAll(".track").forEach((t) => {
      if (t === track) return;
      const id = t.dataset.track;
      if (stored.tracks && typeof stored.tracks[id] === "boolean") {
        setTrackOpen(t, stored.tracks[id]);
      }
    });

    // groups: open ALL groups in active track for smooth browsing
    // (user complained exclusive single-group was clunky)
    if (track) {
      track.querySelectorAll(":scope .group").forEach((g) => {
        const key = `${track.dataset.track}::${g.dataset.group}`;
        if (stored.groups && typeof stored.groups[key] === "boolean") {
          // still force-open the group that contains active
          setGroupOpen(g, g === group ? true : stored.groups[key]);
        } else {
          setGroupOpen(g, true);
        }
      });
    }

    // restore groups in other open tracks
    nav?.querySelectorAll(".track").forEach((t) => {
      if (t === track || t.dataset.open !== "1") return;
      t.querySelectorAll(":scope .group").forEach((g) => {
        const key = `${t.dataset.track}::${g.dataset.group}`;
        if (stored.groups && typeof stored.groups[key] === "boolean") {
          setGroupOpen(g, stored.groups[key]);
        } else {
          setGroupOpen(g, true);
        }
      });
    });

    syncChips(track?.dataset.track, true);

    setTimeout(() => {
      active.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 80);
  } else {
    // home: open Guide by default (and restore multi-open)
    let anyRestored = false;
    nav?.querySelectorAll(".track").forEach((t) => {
      const id = t.dataset.track;
      if (stored.tracks && typeof stored.tracks[id] === "boolean") {
        setTrackOpen(t, stored.tracks[id]);
        anyRestored = true;
        if (stored.tracks[id]) {
          t.querySelectorAll(":scope .group").forEach((g) => {
            const key = `${id}::${g.dataset.group}`;
            if (stored.groups && typeof stored.groups[key] === "boolean") {
              setGroupOpen(g, stored.groups[key]);
            } else {
              setGroupOpen(g, true);
            }
          });
        }
      }
    });
    if (!anyRestored) {
      const guide = nav?.querySelector('.track[data-track="guide"]');
      if (guide) {
        setTrackOpen(guide, true);
        guide.querySelectorAll(":scope .group").forEach((g) => setGroupOpen(g, true));
        syncChips("guide", true);
      }
    }
  }

  persistFromDom();

  // ---- top chips: expand track (keep others), scroll, open groups ----
  document.querySelectorAll("[data-jump-track]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const id = chip.getAttribute("data-jump-track");
      const track = nav?.querySelector(`.track[data-track="${CSS.escape(id)}"]`);
      if (!track) return;
      setTrackOpen(track, true);
      track.querySelectorAll(":scope .group").forEach((g) => setGroupOpen(g, true));
      sidebar?.classList.add("open");
      backdrop?.classList.add("show");
      track.scrollIntoView({ block: "nearest", behavior: "smooth" });
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      persistFromDom();
    });
  });

  function closeMobile() {
    sidebar?.classList.remove("open");
    backdrop?.classList.remove("show");
  }
  function openMobile() {
    sidebar?.classList.add("open");
    backdrop?.classList.add("show");
  }

  menuBtn?.addEventListener("click", () => {
    if (sidebar?.classList.contains("open")) closeMobile();
    else openMobile();
  });
  backdrop?.addEventListener("click", closeMobile);
  document.querySelector(".main")?.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 1023px)").matches) closeMobile();
  });

  // ---- search ----
  search?.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    const searching = q.length > 0;

    nav?.querySelectorAll(".track").forEach((track) => {
      let trackAny = false;

      track.querySelectorAll(":scope .group").forEach((group) => {
        let groupAny = false;
        group.querySelectorAll("li").forEach((li) => {
          const a = li.querySelector(".leaf");
          const hay = (a?.dataset.search || a?.textContent || "").toLowerCase();
          const show = !searching || hay.includes(q);
          li.classList.toggle("hidden", !show);
          if (show) groupAny = true;
        });
        group.classList.toggle("hidden", searching ? !groupAny : false);
        if (searching && groupAny) setGroupOpen(group, true);
        if (groupAny) trackAny = true;
      });

      // flat leaf lists directly under track-body
      track.querySelectorAll(":scope > .track-panel .track-body > .leaf-list > li").forEach((li) => {
        const a = li.querySelector(".leaf");
        const hay = (a?.dataset.search || a?.textContent || "").toLowerCase();
        const show = !searching || hay.includes(q);
        li.classList.toggle("hidden", !show);
        if (show) trackAny = true;
      });

      track.classList.toggle("hidden", searching ? !trackAny : false);
      if (searching && trackAny) setTrackOpen(track, true);

      if (!searching) {
        // restore active + session
        const isActiveTrack = active && track.contains(active);
        const id = track.dataset.track;
        if (isActiveTrack) {
          setTrackOpen(track, true);
        } else if (stored.tracks && typeof stored.tracks[id] === "boolean") {
          setTrackOpen(track, stored.tracks[id]);
        } else {
          setTrackOpen(track, false);
        }
        track.querySelectorAll(":scope .group").forEach((g) => {
          if (isActiveTrack) setGroupOpen(g, true);
          else if (track.dataset.open === "1") setGroupOpen(g, true);
        });
      }
    });
  });

  // highlight + copy
  if (window.hljs) {
    document.querySelectorAll("pre code").forEach((el) => {
      try {
        hljs.highlightElement(el);
      } catch (_) {}
    });
  }
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const code = btn.closest(".code-block")?.querySelector("code")?.innerText || "";
      const copyL = btn.getAttribute("data-label-copy") || "Copy";
      const copiedL = btn.getAttribute("data-label-copied") || "Copied";
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = copiedL;
        setTimeout(() => (btn.textContent = copyL), 1200);
      } catch {
        btn.textContent = "Failed";
      }
    });
  });

  // remember language preference when user clicks switcher
  document.querySelectorAll("[data-lang-set]").forEach((a) => {
    a.addEventListener("click", () => {
      try {
        localStorage.setItem("modal-docs-lang", a.getAttribute("data-lang-set") || "en");
      } catch (_) {}
    });
  });

  // TOC spy
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
          if (!e.isIntersecting) return;
          tocLinks.forEach((l) => l.classList.remove("active"));
          map.get(e.target)?.classList.add("active");
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] },
    );
    map.forEach((_, el) => io.observe(el));
  }
})();
