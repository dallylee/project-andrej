document.addEventListener("DOMContentLoaded", () => {
  setupAccessGate();
  highlightCurrentPage();
  buildToc();
});

const ACCESS_KEY = "andrej-offer-access-v1";
const ACCESS_PASSWORD = "43226";

function setupAccessGate() {
  if (hasStoredAccess()) {
    return;
  }

  document.body.classList.add("is-locked");

  const gate = document.createElement("div");
  gate.className = "access-gate";
  gate.innerHTML = `
    <div class="access-gate__panel" role="dialog" aria-modal="true" aria-labelledby="access-gate-title">
      <span class="access-gate__eyebrow">Privatni pregled</span>
      <h1 id="access-gate-title" class="access-gate__title">Unesi pristupni broj za prvi ulaz</h1>
      <p class="access-gate__text">
        Nakon što ga jednom uneseš na ovom uređaju, pregled ostaje otključan u tom browseru i više ne pita ponovno.
      </p>
      <form class="access-gate__form">
        <label class="access-gate__label" for="access-code">Pristupni broj</label>
        <input id="access-code" class="access-gate__input" type="password" inputmode="numeric" autocomplete="off" />
        <p class="access-gate__error" aria-live="polite"></p>
        <button class="button-link access-gate__button" type="submit">Otvori pregled</button>
      </form>
    </div>
  `;

  document.body.appendChild(gate);

  const form = gate.querySelector("form");
  const input = gate.querySelector("input");
  const error = gate.querySelector(".access-gate__error");

  if (!(form instanceof HTMLFormElement) || !(input instanceof HTMLInputElement) || !(error instanceof HTMLElement)) {
    return;
  }

  requestAnimationFrame(() => input.focus());

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (input.value.trim() === ACCESS_PASSWORD) {
      storeAccess();
      document.body.classList.remove("is-locked");
      gate.remove();
      return;
    }

    error.textContent = "Pristupni broj nije ispravan.";
    input.select();
  });
}

function hasStoredAccess() {
  try {
    return window.localStorage.getItem(ACCESS_KEY) === "granted";
  } catch {
    return false;
  }
}

function storeAccess() {
  try {
    window.localStorage.setItem(ACCESS_KEY, "granted");
  } catch {
    // Ignore storage failures; the gate will just appear again next time.
  }
}

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
