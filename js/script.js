/* =========================================================
   R S Tushar — Portfolio
   Vanilla JS: nav behaviour, scroll reveal, dynamic project
   + open-source cards, typewriter hero line, back-to-top.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setFooterYear();
  hideLoader();
  initTypewriter();
  renderProjects();
  renderOssLinks();
  initNav();
  initScrollProgress();
  initScrollReveal();
  initBackToTop();
});

/* ---------- Footer year ---------- */
function setFooterYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- Loader ---------- */
function hideLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("hidden"), 300);
  });
  // Fallback in case 'load' already fired
  setTimeout(() => loader.classList.add("hidden"), 1500);
}

/* ---------- Typewriter hero subtitle ---------- */
function initTypewriter() {
  const target = document.getElementById("typewriter-text");
  if (!target) return;
  const phrases = [
    "Full-Stack Developer",
    "Open Source Contributor",
    "Competitive Programmer",
    "LLM Tooling Tinkerer",
  ];
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const current = phrases[phraseIndex];
    if (!deleting) {
      charIndex++;
      target.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, 1400);
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
    setTimeout(tick, deleting ? 40 : 80);
  }
  tick();
}

/* ---------- Project data (edit here to add/update projects) ---------- */
const PROJECTS = [
  {
    tag: "LLM API Cost Observability",
    title: "TokenSense",
    desc: "A Node.js CLI (built at a venture hackathon, team project) that parses LLM API usage logs, flags token-inefficiency patterns, and recommends model-switching strategies from token-to-cost analysis — no dashboard or extra infra needed.",
    tech: ["JavaScript", "Node.js", "Git", "Linux"],
    github: "https://github.com/Tusharcode007/TokenSense",
    demo: null,
  },
  {
    tag: "Academic Management",
    title: "AI-Powered Study Companion",
    desc: "An 8-module React SPA — task scheduling, dynamic filtering, revision planning, a Recharts analytics dashboard, and an AI-style study assistant for summaries, flashcards, and practice questions. Fully client-side, persisted with LocalStorage.",
    tech: ["React", "JavaScript", "Recharts", "LocalStorage"],
    github: "https://github.com/Tusharcode007/rst-AI-Powered-Study-Companion-",
    demo: null,
  },
  {
    tag: "Productivity Dashboard",
    title: "Productivity Booster",
    desc: "An all-in-one dashboard combining Pomodoro timer workflows, habit tracking, and goal visualisation, with persistent preferences and a modular panel structure so panels update independently without regressions.",
    tech: ["React", "JavaScript", "CSS", "Git"],
    github: "https://github.com/Tusharcode007/PRODUCTIVITY-BOOSTER",
    demo: null,
  },
];

function renderProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  grid.innerHTML = "";

  PROJECTS.forEach((project, i) => {
    const card = document.createElement("article");
    card.className = "project-card reveal";
    card.style.transitionDelay = `${i * 0.08}s`;

    const links = [`<a href="${project.github}" target="_blank" rel="noopener">GitHub ↗</a>`];
    if (project.demo) links.push(`<a href="${project.demo}" target="_blank" rel="noopener">Live demo ↗</a>`);

    card.innerHTML = `
      <span class="project-tag">${escapeHtml(project.tag)}</span>
      <h3>${escapeHtml(project.title)}</h3>
      <p class="project-desc">${escapeHtml(project.desc)}</p>
      <div class="project-tech">${project.tech.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>
      <div class="project-links">${links.join("")}</div>
    `;
    grid.appendChild(card);
  });

  // Newly-injected .reveal cards need observing too
  observeReveal(grid.querySelectorAll(".reveal"));
}

/* ---------- Open source links ---------- */
const OSS_LINKS = [
  { label: "GSoC-Org-Finder — Modal interaction bug (#511)", url: "https://github.com/S3DFX-CYBER/GSoC-Org-Finder-/issues/511" },
  { label: "TeaAndBooks — Issue #25", url: "https://github.com/vie-nyx/TeaAndBooks/issues/25" },
  { label: "TeaAndBooks — Issue #26", url: "https://github.com/vie-nyx/TeaAndBooks/issues/26" },
  { label: "TeaAndBooks — Issue #27", url: "https://github.com/vie-nyx/TeaAndBooks/issues/27" },
];

function renderOssLinks() {
  const list = document.getElementById("oss-links");
  if (!list) return;
  list.innerHTML = OSS_LINKS.map(
    (link) => `<li><a href="${link.url}" target="_blank" rel="noopener">${escapeHtml(link.label)} ↗</a></li>`
  ).join("");
}

/* ---------- Nav: scroll shadow, active link, mobile toggle ---------- */
function initNav() {
  const nav = document.getElementById("navbar");
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 30);
  });

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  // Active-section highlighting
  const sections = Array.from(navLinks)
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const map = new Map();
    navLinks.forEach((a) => map.set(a.getAttribute("href"), a));

    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = map.get(`#${entry.target.id}`);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove("active"));
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => navObserver.observe(s));
  }
}

/* ---------- Scroll progress bar ---------- */
function initScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;
  window.addEventListener("scroll", () => {
    const scrollTop = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    bar.style.width = `${pct}%`;
  });
}

/* ---------- Scroll reveal ---------- */
let revealObserver;
function initScrollReveal() {
  const items = document.querySelectorAll(".reveal");
  observeReveal(items);
}

function observeReveal(items) {
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in-view"));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
  }
  items.forEach((el) => revealObserver.observe(el));
}

/* ---------- Back to top ---------- */
function initBackToTop() {
  const btn = document.getElementById("back-to-top");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 500);
  });
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---------- Utility ---------- */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
