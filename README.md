# Technical Notes

A minimal, static, content-driven technical blog / documentation site. No backend, no
database, no CMS — just Markdown files and a build step.

## Adding a new article

Drop a Markdown file into `content/`:

```
content/docker-security.md
```

```markdown
---
title: "Docker Security Basics"
date: "2026-09-10"
---

## Introduction

Body goes here...
```

Then:

```bash
git add .
git commit -m "Add docker security article"
git push
```

That's it. The build automatically:

- discovers every `content/*.md` file
- reads `title` / `date` from the frontmatter
- adds an entry to the sidebar
- generates the article's URL (`#/article/docker-security`)
- renders the article and its Table of Contents (from `##`/`###` headings)

No source file needs to change to add, rename, or remove an article — the sidebar list is
generated entirely from what's in `content/` at build time (`import.meta.glob`).

Articles are sorted by `date` descending. If a file has no `date`, it sorts to the bottom by
title. If a file has no `title` in frontmatter, the first `# H1` in the body is used, and
failing that, the filename.

## Editing the Portfolio page

The Portfolio page (the first sidebar entry) is not Markdown-driven — it's
[`src/pages/PortfolioPage.tsx`](src/pages/PortfolioPage.tsx). Edit the placeholder text directly
with your name, skills, projects, experience, and links.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

## Deploying to GitHub Pages

A workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys
`dist/` to GitHub Pages automatically on every push to `main`.

One-time setup after pushing this repo to GitHub:

1. Repo **Settings → Pages → Build and deployment → Source** → select **GitHub Actions**.
2. Push to `main` — the workflow builds and publishes the site.

The build uses relative asset paths (`base: './'` in `vite.config.ts`) and `HashRouter` for
routing, so it works out of the box under any GitHub Pages project path
(`https://<user>.github.io/<repo>/`) without further configuration.

## Stack

- Vite + React + TypeScript
- `react-markdown` + `remark-gfm` (tables, strikethrough) + `rehype-slug` (heading anchors) +
  `rehype-highlight` (code syntax highlighting)
- IBM Plex Mono (self-hosted via `@fontsource`), used consistently across sidebar, headings,
  body text, code, and tables
