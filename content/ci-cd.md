---
title: "Understanding CI/CD Inconsistency"
date: "2026-09-07"
---

## Introduction

This is my first technical blog, so it may have some errors here and there, so please create
a *Suggest Changes* if you feel like changing any part of this blog. Really appreciate it!

If you're a DevOps Engineer, Developer, or even a Tester/QA, you're likely familiar with CI/CD
and may already be using tools like Jenkins, GitLab CI, or GitHub Actions. Have you ever
encountered an issue where, after a long run, your CI/CD pipeline randomly throws errors that
aren't directly related to your application? Congratulations, you've likely encountered **CI
inconsistency**.

As a DevOps engineer or developer with experience in CI/CD, you probably know that each CI
platform has a unique setup. For example:

> Disclaimer: This is only my opinions. But I've used all of these extensively with a deep
> understanding.

| CI/CD Name     | Format               | Personal Opinion                                             |
| -------------- | -------------------- | -------------------------------------------------------------|
| GitLab CI      | `.gitlab-ci.yml`      | Very good                                                     |
| Tekton CI      | K8s manifest (YAML)  | Not recommended without in-depth K8s knowledge                |
| GitHub Actions | `./github` (YAML)    | Good                                                          |
| Jenkins        | ClickOps/Groovy      | Good initially, fast but not reliable long term                |
| AWS CodePipeline | `buildspec.yaml`   | OK, but some cases need tricky workarounds                    |

## Why does this happen?

Most CI inconsistency issues come down to one of these root causes:

1. **Cached layers** going stale between runs.
2. **Ephemeral runners** with slightly different base images.
3. **Race conditions** in parallel jobs sharing state.

You can usually confirm a caching issue by forcing a clean run:

```bash
docker ps
docker system prune -af
docker build --no-cache -t myapp:latest .
```

If the pipeline suddenly passes on a clean run, the previous cache was the problem.

## Conclusion

CI/CD inconsistency is frustrating, but it's almost always traceable to caching, environment
drift, or shared mutable state. Treat your pipeline like production code: pin your versions,
avoid hidden state, and log aggressively.

---

If you spot an error in this post, a PR is always welcome.
