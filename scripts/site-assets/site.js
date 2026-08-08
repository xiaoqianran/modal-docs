(function () {
  const search = document.getElementById("search");
  const nav = document.getElementById("nav");
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.getElementById("sidebar");

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("open");
    });
    document.querySelector(".main")?.addEventListener("click", () => {
      sidebar.classList.remove("open");
    });
  }

  if (search && nav) {
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      nav.querySelectorAll(".nav-sec").forEach((sec) => {
        let any = false;
        sec.querySelectorAll("li").forEach((li) => {
          const a = li.querySelector("a");
          const title = (a?.dataset.title || a?.textContent || "").toLowerCase();
          const show = !q || title.includes(q);
          li.classList.toggle("hidden", !show);
          if (show) any = true;
        });
        sec.classList.toggle("hidden", !any);
      });
    });
  }
})();
