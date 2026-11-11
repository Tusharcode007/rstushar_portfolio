# R S Tushar — Portfolio

Personal portfolio in a **neo-brutalist** style: thick ink borders, hard offset
shadows, flat colour blocks and mono labels. Covers open-source work, projects,
a combined GitHub + LeetCode activity calendar, skills, experience, education
and contact.

Plain HTML, CSS and JS — no build step, no framework. All written content is in
the HTML, so the page reads fine with JavaScript turned off; only the activity
calendar needs it.

**Live:** https://tusharcode007.github.io/rstushar_portfolio/

## Features

- Light and dark theme (follows the system, remembers a manual choice)
- Open-source section with links to every real issue, pull request, branch and comment
- Activity calendar: GitHub contributions and LeetCode submissions for the last
  12 months in one heatmap, with per-source views, streaks, tooltips, keyboard
  navigation and a monthly table
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
│   ├── script.js       # theme toggle, nav, reveal, typewriter, copy email
│   └── activity.js     # activity heatmap
├── scripts/
│   └── fetch-activity.mjs  # builds activity.json from GitHub + LeetCode
├── .github/workflows/
│   └── activity.yml    # runs the script every 6 hours, publishes to `data`
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

## Activity data

`.github/workflows/activity.yml` runs `scripts/fetch-activity.mjs` every six hours
(and on demand from the Actions tab). The script reads the GitHub contribution
calendar and the LeetCode submission calendar and solved counts, then the
workflow force-pushes `activity.json` to the `data` branch, so `main` never gets
bot commits. The page loads it from
`https://raw.githubusercontent.com/Tusharcode007/rstushar_portfolio/data/activity.json`.

If one source is down, the script keeps that source's last published data.
To try it locally: `node scripts/fetch-activity.mjs out/activity.json` (Node 20+).
The usernames are constants at the top of the script.

## Editing content

Everything lives in `index.html`, one section per block:

- **Open source:** `<section id="opensource">` — featured MIT App Inventor card, other issue cards
- **Projects:** `<section id="projects">` — one `<article class="project-card">` per project
- **Activity:** `<section id="activity">` — markup only; the data comes from the workflow above
- **Skills, experience, education, contact:** their own `<section>` blocks

Colours are CSS variables at the top of `css/style.css` (`--yellow`, `--pink`, `--blue`, …);
the dark theme overrides them in the `[data-theme="dark"]` block.
