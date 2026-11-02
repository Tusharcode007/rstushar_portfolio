/* =========================================================
   R S Tushar — Portfolio
   Vanilla JS: theme toggle, nav behaviour, scroll reveal,
   typewriter hero line, copy-email, back-to-top.
   All content lives in index.html, so the page works fully
   without JavaScript.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setFooterYear();
  initTheme();
  initTypewriter();
  initNav();
  initScrollEffects();
  initScrollReveal();
  initCopyEmail();
});

/* ---------- Footer year ---------- */
function setFooterYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- Theme toggle (light / dark, remembers choice) ---------- */
function initTheme() {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  const current = () => root.getAttribute("data-theme") || (media.matches ? "dark" : "light");

  const sync = () => {
    const isDark = current() === "dark";
    if (btn) btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#141414" : "#FFD23F");
  };

  if (btn) {
    btn.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) { /* storage blocked — theme still applies */ }
      sync();
    });
  }
  media.addEventListener?.("change", sync);
  sync();
}

/* ---------- Typewriter hero subtitle ---------- */
function initTypewriter() {
  const target = document.getElementById("typewriter-text");
  if (!target) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const phrases = [
    "Full-Stack Developer",
    "Open Source Contributor",
    "Competitive Programmer",
    "LLM Tooling Tinkerer",
  ];
  let phraseIndex = 0;
  let charIndex = phrases[0].length;
  let deleting = true;

  function tick() {
    const current = phrases[phraseIndex];
    if (!deleting) {
      charIndex++;
      target.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1600);
        return;
      }
    } else {
      charIndex--;
      target.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 35 : 75);
  }
  // Show the first phrase in full before starting to cycle
  setTimeout(tick, 1800);
}

/* ---------- Nav: mobile toggle + active-section highlighting ---------- */
function initNav() {
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  const navLinks = document.querySelectorAll(".nav-link");

  const closeMenu = () => {
    links.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  };

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && links.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  // The hero (#top) has no nav link; when it is in view, no link is active
  const sections = [document.getElementById("top")]
    .concat(Array.from(navLinks).map((a) => document.querySelector(a.getAttribute("href"))))
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || !sections.length) return;

  const map = new Map();
  navLinks.forEach((a) => map.set(a.getAttribute("href"), a));

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = map.get(`#${entry.target.id}`);
        navLinks.forEach((a) => {
          a.classList.remove("active");
          a.removeAttribute("aria-current");
        });
        if (!link) return;
        link.classList.add("active");
        link.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((s) => navObserver.observe(s));
}

/* ---------- Scroll: nav shadow, progress bar, back-to-top ---------- */
function initScrollEffects() {
  const nav = document.getElementById("navbar");
  const bar = document.getElementById("scroll-progress");
  const backToTop = document.getElementById("back-to-top");
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    const doc = document.documentElement;
    const height = doc.scrollHeight - doc.clientHeight;
    if (nav) nav.classList.toggle("scrolled", y > 20);
    if (bar) bar.style.width = `${height > 0 ? (y / height) * 100 : 0}%`;
    if (backToTop) backToTop.classList.toggle("visible", y > 600);
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }
}

/* ---------- Scroll reveal ---------- */
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => observer.observe(el));
}

/* ---------- Copy email to clipboard ---------- */
function initCopyEmail() {
  const btn = document.getElementById("copy-email");
  const status = document.getElementById("copy-status");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const email = btn.dataset.email;
    let ok = false;
    try {
      await navigator.clipboard.writeText(email);
      ok = true;
    } catch (e) {
      // Fallback for browsers without the async clipboard API
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      ta.remove();
    }
    btn.textContent = ok ? "Copied ✓" : "Copy";
    if (status) status.textContent = ok ? "Email copied to clipboard" : "Couldn't copy — select the address instead";
    setTimeout(() => {
      btn.textContent = "Copy";
      if (status) status.textContent = "";
    }, 2200);
  });
}
