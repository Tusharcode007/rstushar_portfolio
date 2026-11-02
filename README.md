# R S Tushar — Portfolio

Personal portfolio in a **neo-brutalist** style: thick ink borders, hard offset
shadows, flat colour blocks and mono labels. Covers open-source work, projects,
skills, experience, education and contact.

Plain HTML, CSS and JS — no build step, no framework, and every bit of content
is in the HTML, so the page works even with JavaScript turned off.

**Live:** https://tusharcode007.github.io/rstushar_portfolio/

## Features

- Light and dark theme (follows the system, remembers a manual choice)
- Open-source section with links to every real issue, branch and comment
- Responsive layout down to small phones, with a mobile menu
- Scroll progress bar, active-section nav, scroll-reveal cards, typewriter hero line
- One-click "copy email" button
- Respects `prefers-reduced-motion`

## Structure

```
.
├── index.html          # all content
├── css/
│   └── style.css       # theme tokens (light/dark) + layout
├── js/
│   └── script.js       # theme toggle, nav, reveal, typewriter, copy email
├── assets/
│   └── images/
│       ├── profile.jpg
│       ├── sstlogo.png
│       └── bitslogo.png
└── README.md
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy on GitHub Pages

Repo → Settings → Pages → Source: `main` branch, `/ (root)`.
The site goes live at `https://<username>.github.io/<repo>/`.

## Editing content

Everything lives in `index.html`, one section per block:

- **Open source:** `<section id="opensource">` — featured MIT App Inventor card, GSSoC '26 issue cards
- **Projects:** `<section id="projects">` — one `<article class="project-card">` per project
- **Skills, experience, education, contact:** their own `<section>` blocks

Colours are CSS variables at the top of `css/style.css` (`--yellow`, `--pink`, `--blue`, …);
the dark theme overrides them in the `[data-theme="dark"]` block.
