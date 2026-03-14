document.addEventListener("DOMContentLoaded", () => {
  setupAccessGate();
  highlightCurrentPage();
  buildToc();
  setupHeroImageLightbox();
  setupCopyButtons();
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

function setupHeroImageLightbox() {
  if (document.body.classList.contains("home-page")) {
    return;
  }

  const images = Array.from(document.querySelectorAll(".hero-figure img"));
  if (images.length === 0) {
    return;
  }

  const lightbox = document.createElement("div");
  lightbox.className = "image-lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <button class="image-lightbox__backdrop" type="button" aria-label="Zatvori uvećani prikaz"></button>
    <figure class="image-lightbox__figure" role="dialog" aria-modal="true" aria-label="Uvećani prikaz infografike">
      <img class="image-lightbox__image" alt="">
      <figcaption class="image-lightbox__caption"></figcaption>
    </figure>
  `;

  document.body.appendChild(lightbox);

  const lightboxImage = lightbox.querySelector(".image-lightbox__image");
  const lightboxCaption = lightbox.querySelector(".image-lightbox__caption");
  let activeImage = null;

  if (!(lightboxImage instanceof HTMLImageElement) || !(lightboxCaption instanceof HTMLElement)) {
    return;
  }

  const closeLightbox = () => {
    if (!lightbox.classList.contains("is-open")) {
      return;
    }

    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-lightbox-open");

    if (activeImage) {
      activeImage.setAttribute("aria-expanded", "false");
      activeImage.focus({ preventScroll: true });
    }

    activeImage = null;
  };

  const openLightbox = (image) => {
    const captionText =
      image.closest("figure")?.querySelector(".figure-caption")?.textContent?.trim() ||
      image.getAttribute("alt") ||
      "";

    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.getAttribute("alt") || "";
    lightboxCaption.textContent = captionText;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-lightbox-open");

    if (activeImage && activeImage !== image) {
      activeImage.setAttribute("aria-expanded", "false");
    }

    activeImage = image;
    activeImage.setAttribute("aria-expanded", "true");
  };

  images.forEach((image) => {
    image.classList.add("is-zoomable");
    image.setAttribute("role", "button");
    image.setAttribute("tabindex", "0");
    image.setAttribute("aria-expanded", "false");
    image.setAttribute("aria-label", `${image.getAttribute("alt") || "Infografika"}. Klik za veći prikaz.`);

    image.addEventListener("click", () => {
      if (activeImage === image && lightbox.classList.contains("is-open")) {
        closeLightbox();
        return;
      }

      openLightbox(image);
    });

    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();

      if (activeImage === image && lightbox.classList.contains("is-open")) {
        closeLightbox();
        return;
      }

      openLightbox(image);
    });
  });

  lightbox.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (
      target.classList.contains("image-lightbox__backdrop") ||
      target.classList.contains("image-lightbox__image")
    ) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
    }
  });
}

function setupCopyButtons() {
  const buttons = Array.from(document.querySelectorAll("[data-copy-target]"));
  if (buttons.length === 0) {
    return;
  }

  buttons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    button.addEventListener("click", async () => {
      const targetId = button.dataset.copyTarget;
      const target = targetId ? document.getElementById(targetId) : null;
      const feedback = button.parentElement?.querySelector(".copy-feedback");
      const text = target instanceof HTMLTextAreaElement ? target.value : target?.textContent?.trim() || "";

      if (!text) {
        return;
      }

      const success = await copyText(text);
      if (feedback instanceof HTMLElement) {
        feedback.textContent = success ? "Tekst je spreman za mail." : "Kopiranje nije uspjelo.";
      }
    });
  });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "absolute";
      helper.style.left = "-9999px";
      document.body.appendChild(helper);
      helper.select();
      const copied = document.execCommand("copy");
      helper.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
