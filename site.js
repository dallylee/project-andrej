document.addEventListener("DOMContentLoaded", () => {
  highlightCurrentPage();
  buildToc();
});

function highlightCurrentPage() {
  const current = decodeURIComponent(window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".site-nav a").forEach((link) => {
    const target = (link.getAttribute("href") || "").toLowerCase();
    if (target === current) {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }
  });
}

function buildToc() {
  const tocList = document.querySelector(".toc-list");
  const sections = Array.from(document.querySelectorAll("main section[data-toc]"));
  if (!tocList || sections.length === 0) {
    return;
  }

  sections.forEach((section) => {
    if (!section.id) {
      section.id = slugify(section.dataset.toc || section.querySelector("h2")?.textContent || "sekcija");
    }

    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${section.id}`;
    link.textContent = section.dataset.toc || section.querySelector("h2")?.textContent || section.id;
    item.appendChild(link);
    tocList.appendChild(item);
  });

  const links = Array.from(tocList.querySelectorAll("a"));
  if (!("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const match = links.find((link) => link.getAttribute("href") === `#${entry.target.id}`);
        if (match && entry.isIntersecting) {
          links.forEach((link) => link.classList.remove("is-active"));
          match.classList.add("is-active");
        }
      });
    },
    {
      rootMargin: "-30% 0px -55% 0px",
      threshold: 0.1
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
