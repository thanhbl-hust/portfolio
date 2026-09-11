---
title: "Guides: How to write blogs"
date: "2026-09-08"
tag: "Custom"
---

Every post on this site is a single Markdown file in `content/`. This page is both the syntax reference and a live example of it: everything below was written in Markdown and rendered by the same pipeline your own posts go through.

## Creating a post

Drop a file into `content/`. The file name becomes the URL:

```
content/docker-security.md   →   #/article/docker-security
```

Start the file with frontmatter, fenced between two `---` lines:

```
---
title: "Docker Security Basics"
date: "2026-09-10"
tag: "Docker"
---
```

| Field | Required | What it does |
| ------- | -------- | ------------------------------------------------------ |
| `title` | yes | The article heading, and the browser tab title |
| `date` | yes | `YYYY-MM-DD`. Posts are listed newest first |
| `tag` | no | The small pill shown on the card and in the sidebar |

The first ordinary paragraph after the frontmatter becomes the summary on the blog card, trimmed to 160 characters. Headings, quotes, code and images are skipped when it looks for that paragraph, so open with a real sentence.

## Headings

Start at `##`. The `title` in the frontmatter is already the page's top-level heading, so a `#` in the body would compete with it.

```
## Section title
### Sub-section
```

`##` and `###` are collected into the Table of Contents at the top of the article, which appears once a post has at least two of them. `####` and deeper still render, they just don't show up in the contents.

## Bold, italic and inline code

| You write | You get |
| ------------------ | ------------------ |
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `***both***` | ***both*** |
| `~~struck out~~` | ~~struck out~~ |
| `` `inline code` `` | `inline code` |

Inline code is useful for file names, flags and commands mentioned mid-sentence, like `kubectl get pods -A`.

## Lists

Use `-` for bullets and `1.` for numbers. Indent by two spaces to nest a list inside another:

```
- Cache layers
- Runner images
  - Base image drift
  - Missing system packages
- Shared state

1. Reproduce the failure
2. Pin the version
3. Re-run the pipeline
```

That renders as:

- Cache layers
- Runner images
  - Base image drift
  - Missing system packages
- Shared state

1. Reproduce the failure
2. Pin the version
3. Re-run the pipeline

Checklists work as well:

```
- [x] Draft written
- [ ] Diagrams added
- [ ] Proofread
```

- [x] Draft written
- [ ] Diagrams added
- [ ] Proofread

## Links and images

```
[The GitHub Actions docs](https://docs.github.com/actions)
[another post on this site](#/article/kubernetes-basics)
```

[The GitHub Actions docs](https://docs.github.com/actions) opens in a new tab: external links get that automatically. Links to [another post on this site](#/article/kubernetes-basics) use the `#/article/<slug>` form and stay in the same tab.

Images live in `public/` and are written relative to the site root:

```
![A simple client-router-server diagram](sample-diagram.svg)
```

![A simple client-router-server diagram](sample-diagram.svg)

## Code blocks

Fence the block with three backticks and name the language on the opening line:

````
```bash
docker system prune -af
docker build --no-cache -t myapp:latest .
```
````

```bash
docker system prune -af
docker build --no-cache -t myapp:latest .
```

Every block gets a Copy button in the corner. Highlighting is registered for `bash`, `shell`, `yaml`, `json`, `dockerfile`, `python`, `go`, `sql`, `ini` and `diff`. Any other language still renders correctly, just without colours; to add one, extend `HIGHLIGHT_LANGUAGES` in `vite.config.ts`.

Leaving the language off is fine too, and is the right choice for plain output:

```
NAME                     READY   STATUS    RESTARTS   AGE
example-pod-7d4b8c9f-x   1/1     Running   0          2m
```

## Tables

A header row, a separator row of dashes, then the body:

```
| Tool | Config format | Notes |
| ---- | ------------- | ----- |
| GitHub Actions | YAML | Good defaults |
| Jenkins | Groovy | Flexible, harder to keep tidy |
```

| Tool | Config format | Notes |
| -------------- | ------------- | ----------------------------- |
| GitHub Actions | YAML | Good defaults |
| Jenkins | Groovy | Flexible, harder to keep tidy |

The columns don't need to line up in the source. Wide tables scroll sideways inside their own box, so they never stretch the page on a phone.

## Quotes and separators

```
> Disclaimer: these are my own opinions, from my own scars.
```

> Disclaimer: these are my own opinions, from my own scars.

Three dashes alone on a line draw a horizontal rule:

---

Note that `---` only means a rule inside the body. At the very top of the file it opens the frontmatter instead.

## Publishing

```bash
git add content/docker-security.md
git commit -m "Add Docker security post"
git push
```

Pushing to `main` runs the build and deploys it. The article page, its Table of Contents, the entry on the blog list, the sidebar link and the RSS item are all generated from that one file, so there is nothing else to update.
