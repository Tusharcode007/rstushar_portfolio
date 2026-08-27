# R S Tushar — Portfolio

Personal portfolio site: about, skills, projects, open-source contributions,
academics, experience, and contact — built with plain HTML, CSS and JS
(no build step required).

## Structure

```
.
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   └── images/
│       ├── selfpic2.jpeg
│       ├── sstlogo.png
│       └── bitslogo.png
└── README.md
```

## Run locally

Just open `index.html` in a browser, or serve it:

```bash
npx serve .
```

## Deploy on GitHub Pages

1. Push this repo to GitHub.
2. Repo → Settings → Pages → Source: `main` branch, `/ (root)`.
3. Site goes live at `https://<username>.github.io/<repo>/`.

## Editing content

- **Projects:** edit the `PROJECTS` array in `js/script.js`.
- **Open-source links:** edit the `OSS_LINKS` array in `js/script.js`.
- **Everything else** (skills, academics, experience, contact) lives directly in `index.html`.
